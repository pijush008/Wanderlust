/**
 * ================= CLUSTER MODE (Multi-Core Scaling) =================
 * 
 * Node.js is single-threaded. This file spawns one worker per CPU core,
 * multiplying throughput by the number of cores available.
 * 
 * Architecture:
 *   Master Process (PID 1)
 *     ├── Worker 1 (CPU Core 0) → Express + Socket.IO
 *     ├── Worker 2 (CPU Core 1) → Express + Socket.IO
 *     ├── Worker 3 (CPU Core 2) → Express + Socket.IO
 *     └── Worker 4 (CPU Core 3) → Express + Socket.IO
 * 
 * Load Distribution:
 *   - OS kernel distributes incoming connections across workers (round-robin)
 *   - Each worker is an independent process with its own event loop
 *   - If a worker crashes, master respawns it automatically
 * 
 * Socket.IO Scaling:
 *   - Requires Redis adapter for cross-worker event broadcasting
 *   - Without Redis: each worker handles its own WebSocket connections
 *   - With Redis: events broadcast to all workers via pub/sub
 * 
 * Usage:
 *   Production: node cluster.js
 *   Development: node app.js (single process, easier debugging)
 */

const cluster = require("cluster");
const os = require("os");

const NUM_CPUS = os.cpus().length;
const WORKERS = parseInt(process.env.WEB_CONCURRENCY) || NUM_CPUS;

if (cluster.isPrimary) {
  console.log(`\n================= CLUSTER MODE =================`);
  console.log(` Master PID: ${process.pid}`);
  console.log(` CPU Cores: ${NUM_CPUS}`);
  console.log(` Workers: ${WORKERS}`);
  console.log(`================================================\n`);

  // Fork workers
  for (let i = 0; i < WORKERS; i++) {
    const worker = cluster.fork();
    console.log(` Worker ${worker.process.pid} started (core ${i})`);
  }

  // Respawn crashed workers
  cluster.on("exit", (worker, code, signal) => {
    console.error(` Worker ${worker.process.pid} died (code: ${code}, signal: ${signal})`);
    console.log(" Spawning replacement worker...");
    const newWorker = cluster.fork();
    console.log(` New worker ${newWorker.process.pid} started`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("\n Master received SIGTERM — shutting down gracefully...");
    for (const id in cluster.workers) {
      cluster.workers[id].send("shutdown");
      cluster.workers[id].disconnect();
    }
    setTimeout(() => process.exit(0), 10000); // Force exit after 10s
  });

  // Health monitoring
  setInterval(() => {
    const workers = Object.keys(cluster.workers).length;
    if (workers < WORKERS) {
      console.log(` Only ${workers}/${WORKERS} workers alive — spawning...`);
      cluster.fork();
    }
  }, 30000); // Check every 30s

} else {
  // Worker process — load the app
  require("./app.js");
}
