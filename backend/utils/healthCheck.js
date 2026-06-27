/**
 * ================= HEALTH CHECK & GRACEFUL SHUTDOWN =================
 * 
 * Required for:
 *   - Load balancer health probes (Nginx, AWS ALB, K8s)
 *   - Zero-downtime deployments
 *   - Container orchestration (Docker, K8s readiness/liveness)
 * 
 * Endpoints:
 *   GET /health       — Basic health (for load balancer)
 *   GET /health/ready — Readiness probe (DB + cache connected)
 *   GET /health/live  — Liveness probe (process alive)
 *   GET /health/full  — Detailed system status (admin)
 */

const mongoose = require("mongoose");
const os = require("os");

let isShuttingDown = false;
let serverStartTime = Date.now();

// ================= HEALTH STATUS =================
function getHealthStatus() {
  const mongoState = mongoose.connection.readyState;
  const mongoStates = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

  return {
    status: isShuttingDown ? "shutting_down" : "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.round((Date.now() - serverStartTime) / 1000),
    pid: process.pid,
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + "MB",
      heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB",
    },
    cpu: {
      cores: os.cpus().length,
      loadAvg: os.loadavg().map((l) => l.toFixed(2)),
    },
    database: {
      status: mongoStates[mongoState] || "unknown",
      connected: mongoState === 1,
    },
    system: {
      platform: os.platform(),
      nodeVersion: process.version,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024) + "MB",
      freeMemory: Math.round(os.freemem() / 1024 / 1024) + "MB",
    },
  };
}

// ================= READINESS CHECK =================
function isReady() {
  if (isShuttingDown) return false;
  if (mongoose.connection.readyState !== 1) return false;
  return true;
}

// ================= GRACEFUL SHUTDOWN =================
function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n Received ${signal} — starting graceful shutdown...`);

    // 1. Stop accepting new connections
    server.close(() => {
      console.log(" HTTP server closed");
    });

    // 2. Wait for in-flight requests (max 10s)
    const shutdownTimeout = setTimeout(() => {
      console.error(" Forced shutdown after timeout");
      process.exit(1);
    }, 10000);

    try {
      // 3. Close database connection
      await mongoose.connection.close();
      console.log(" MongoDB disconnected");

      // 4. Close worker queues
      try {
        const { shutdownQueues } = require("./workerQueue");
        await shutdownQueues();
        console.log(" Worker queues closed");
      } catch (e) {
        // Queue might not be initialized
      }

      clearTimeout(shutdownTimeout);
      console.log(" Graceful shutdown complete");
      process.exit(0);
    } catch (err) {
      console.error(" Shutdown error:", err);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  };

  // Listen for termination signals
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle uncaught errors gracefully (production only)
  if (process.env.NODE_ENV === "production") {
    process.on("uncaughtException", (err) => {
      console.error(" Uncaught Exception:", err.message);
      shutdown("uncaughtException");
    });
  }

  process.on("unhandledRejection", (reason) => {
    console.error(" Unhandled Rejection:", reason?.message || reason);
    // Don't shutdown on unhandled rejection, just log
  });

  // Worker message (from cluster master)
  process.on("message", (msg) => {
    if (msg === "shutdown") {
      shutdown("cluster-shutdown");
    }
  });
}

// ================= EXPRESS ROUTES =================
function healthRoutes(router) {
  // Basic health (load balancer probe)
  router.get("/health", (req, res) => {
    if (isShuttingDown) {
      return res.status(503).json({ status: "shutting_down" });
    }
    res.json({ status: "ok", uptime: Math.round((Date.now() - serverStartTime) / 1000) });
  });

  // Readiness probe (K8s / ALB)
  router.get("/health/ready", (req, res) => {
    if (isReady()) {
      return res.json({ ready: true });
    }
    res.status(503).json({ ready: false, reason: isShuttingDown ? "shutting_down" : "db_not_connected" });
  });

  // Liveness probe
  router.get("/health/live", (req, res) => {
    res.json({ alive: true, pid: process.pid });
  });

  // Full status (admin/monitoring)
  router.get("/health/full", (req, res) => {
    res.json(getHealthStatus());
  });

  return router;
}

module.exports = {
  getHealthStatus,
  isReady,
  setupGracefulShutdown,
  healthRoutes,
};
