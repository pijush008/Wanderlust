/**
 * ================= STANDALONE WORKER PROCESS =================
 * 
 * Runs background jobs independently from the web server.
 * Connects to the same Redis queues and processes jobs.
 * 
 * This separation means:
 *   - Web server handles HTTP requests (fast response times)
 *   - Worker handles heavy tasks (email, image processing, analytics)
 *   - They communicate via Redis queues
 *   - Worker can be scaled independently
 * 
 * Usage:
 *   node worker.js              — Start worker
 *   pm2 start ecosystem.config.js --only worker
 */

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");

const dbUrl = process.env.ATLASDB_URL;

async function startWorker() {
  // Connect to database (workers need DB access for job processing)
  try {
    await mongoose.connect(dbUrl);
    console.log(" [Worker] MongoDB connected");
  } catch (err) {
    console.error(" [Worker] MongoDB connection failed:", err.message);
    process.exit(1);
  }

  // Initialize and start processing queues
  const { initializeQueues, setupScheduledJobs } = require("./utils/workerQueue");
  initializeQueues();
  setupScheduledJobs();

  console.log(` [Worker] PID ${process.pid} — Processing background jobs...`);
  console.log(" [Worker] Queues: email, image, analytics, cleanup, pricing");

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log(" [Worker] Shutting down...");
    const { shutdownQueues } = require("./utils/workerQueue");
    await shutdownQueues();
    await mongoose.connection.close();
    process.exit(0);
  });
}

startWorker();
