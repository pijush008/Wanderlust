/**
 * ================= WORKER QUEUE SYSTEM =================
 * 
 * Background job processing using Bull (Redis-backed queue).
 * Offloads heavy/slow tasks from the request-response cycle.
 * 
 * Architecture:
 *   ┌─────────────────────────────────────────────────────┐
 *   │  Web Server (Express)                                │
 *   │    → Receives request                                │
 *   │    → Adds job to queue                               │
 *   │    → Returns response immediately                    │
 *   └──────────────────────┬──────────────────────────────┘
 *                          │ Redis Queue
 *   ┌──────────────────────▼──────────────────────────────┐
 *   │  Worker Process                                      │
 *   │    → Picks up job from queue                         │
 *   │    → Processes in background                         │
 *   │    → Retries on failure (exponential backoff)        │
 *   └─────────────────────────────────────────────────────┘
 * 
 * Queues:
 *   1. emailQueue — Booking confirmations, notifications
 *   2. imageQueue — Image optimization, thumbnail generation
 *   3. analyticsQueue — View tracking, search analytics
 *   4. cleanupQueue — Expired lock cleanup, session pruning
 *   5. pricingQueue — Batch price recalculation
 * 
 * Without Redis: Falls back to in-memory immediate execution
 */

const Queue = require("bull");

// ================= QUEUE CONFIGURATION =================
const REDIS_URL = process.env.REDIS_URL || null;

const defaultOpts = {
  redis: REDIS_URL,
  defaultJobOptions: {
    removeOnComplete: 100,  // Keep last 100 completed jobs
    removeOnFail: 50,       // Keep last 50 failed jobs
    attempts: 3,            // Retry 3 times
    backoff: {
      type: "exponential",
      delay: 2000,          // 2s, 4s, 8s
    },
  },
};

// ================= QUEUE INSTANCES =================
let emailQueue = null;
let imageQueue = null;
let analyticsQueue = null;
let cleanupQueue = null;
let pricingQueue = null;

let queuesInitialized = false;
let useInMemoryFallback = true;

// ================= IN-MEMORY FALLBACK =================
// When Redis is unavailable, process jobs immediately (synchronous)
const inMemoryProcessors = {};

function registerProcessor(queueName, processor) {
  inMemoryProcessors[queueName] = processor;
}

async function processImmediately(queueName, data) {
  const processor = inMemoryProcessors[queueName];
  if (processor) {
    try {
      await processor({ data, id: "immediate-" + Date.now() });
    } catch (err) {
      console.error(`[Queue:${queueName}] Immediate processing failed:`, err.message);
    }
  }
}

// ================= INITIALIZE QUEUES =================
function initializeQueues() {
  if (!REDIS_URL) {
    useInMemoryFallback = true;
    console.log(" Worker Queues: In-memory fallback (REDIS_URL not set)");
    setupProcessors();
    return;
  }

  try {
    const Redis = require("ioredis");
    const testClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
      connectTimeout: 2000,
    });

    testClient.connect().then(() => {
      testClient.disconnect();
      emailQueue = new Queue("email", REDIS_URL, defaultOpts);
      imageQueue = new Queue("image", REDIS_URL, defaultOpts);
      analyticsQueue = new Queue("analytics", REDIS_URL, defaultOpts);
      cleanupQueue = new Queue("cleanup", REDIS_URL, defaultOpts);
      pricingQueue = new Queue("pricing", REDIS_URL, defaultOpts);

      useInMemoryFallback = false;
      queuesInitialized = true;
      console.log(" Worker Queues: Redis-backed (distributed)");
      setupProcessors();
    }).catch(() => {
      useInMemoryFallback = true;
      console.log(" Worker Queues: In-memory fallback (Redis unavailable)");
      setupProcessors();
    });

  } catch (err) {
    useInMemoryFallback = true;
    console.log(" Worker Queues: In-memory fallback (init error)");
    setupProcessors();
  }
}

// ================= JOB PROCESSORS =================
function setupProcessors() {
  // --- Email Queue ---
  const emailProcessor = async (job) => {
    const { type, to, data } = job.data;
    console.log(`[Email] Processing: ${type} to ${to}`);
    // In production: integrate with SendGrid/Nodemailer
    // await sendEmail(to, type, data);
    return { sent: true, type, to };
  };

  // --- Image Queue ---
  const imageProcessor = async (job) => {
    const { listingId, imageUrl, operations } = job.data;
    console.log(`[Image] Processing: ${listingId} — ${operations.join(", ")}`);
    // In production: call Cloudinary eager transformations
    // await optimizeImage(imageUrl, operations);
    return { optimized: true, listingId };
  };

  // --- Analytics Queue ---
  const analyticsProcessor = async (job) => {
    const { event, data } = job.data;
    // Track search queries, page views, booking patterns
    // In production: write to analytics DB or send to Mixpanel/Amplitude
    return { tracked: true, event };
  };

  // --- Cleanup Queue ---
  const cleanupProcessor = async (job) => {
    const { task } = job.data;
    console.log(`[Cleanup] Running: ${task}`);
    
    if (task === "expired_locks") {
      const { cleanupExpiredLocks } = require("./lockManager");
      const result = await cleanupExpiredLocks();
      return result;
    }
    
    if (task === "expired_bookings") {
      const Booking = require("../models/booking");
      // Mark old pending bookings as failed
      const result = await Booking.updateMany(
        { status: "pending", createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) } },
        { $set: { status: "failed" } }
      );
      return { expired: result.modifiedCount };
    }

    return { task, completed: true };
  };

  // --- Pricing Queue ---
  const pricingProcessor = async (job) => {
    const { listingId, recalculate } = job.data;
    console.log(`[Pricing] Recalculating: ${listingId || "all"}`);
    // Batch recalculate dynamic prices and update cache
    const { cache, listingIndexKey } = require("./cache");
    await cache.del(listingIndexKey());
    return { recalculated: true };
  };

  // Register for in-memory fallback
  registerProcessor("email", emailProcessor);
  registerProcessor("image", imageProcessor);
  registerProcessor("analytics", analyticsProcessor);
  registerProcessor("cleanup", cleanupProcessor);
  registerProcessor("pricing", pricingProcessor);

  // Register with Bull (when Redis available)
  if (emailQueue) {
    emailQueue.process(5, emailProcessor);      // 5 concurrent
    imageQueue.process(3, imageProcessor);      // 3 concurrent
    analyticsQueue.process(10, analyticsProcessor); // 10 concurrent
    cleanupQueue.process(2, cleanupProcessor);  // 2 concurrent
    pricingQueue.process(2, pricingProcessor);  // 2 concurrent
  }
}

// ================= ADD JOB HELPERS =================

/**
 * Add a job to a queue (or process immediately if no Redis)
 */
async function addJob(queueName, data, opts = {}) {
  if (useInMemoryFallback) {
    await processImmediately(queueName, data);
    return { id: "immediate", queue: queueName };
  }

  const queues = { email: emailQueue, image: imageQueue, analytics: analyticsQueue, cleanup: cleanupQueue, pricing: pricingQueue };
  const queue = queues[queueName];

  if (!queue) {
    console.error(`Unknown queue: ${queueName}`);
    return null;
  }

  const job = await queue.add(data, opts);
  return { id: job.id, queue: queueName };
}

// ================= CONVENIENCE METHODS =================

async function sendBookingEmail(to, bookingData) {
  return addJob("email", { type: "booking_confirmation", to, data: bookingData });
}

async function sendCancellationEmail(to, bookingData) {
  return addJob("email", { type: "booking_cancellation", to, data: bookingData });
}

async function optimizeListingImage(listingId, imageUrl) {
  return addJob("image", {
    listingId,
    imageUrl,
    operations: ["webp_convert", "thumbnail", "responsive_set"],
  });
}

async function trackEvent(event, data) {
  return addJob("analytics", { event, data, timestamp: new Date() }, { priority: 10 });
}

async function scheduleCleanup(task) {
  return addJob("cleanup", { task }, { delay: 0 });
}

async function recalculatePricing(listingId = null) {
  return addJob("pricing", { listingId, recalculate: true });
}

// ================= SCHEDULED JOBS (Cron-like) =================
function setupScheduledJobs() {
  if (useInMemoryFallback) {
    // Use setInterval for in-memory mode
    setInterval(() => processImmediately("cleanup", { task: "expired_locks" }), 5 * 60 * 1000);
    setInterval(() => processImmediately("cleanup", { task: "expired_bookings" }), 15 * 60 * 1000);
    setInterval(() => processImmediately("pricing", { recalculate: true }), 60 * 60 * 1000);
    return;
  }

  // Bull repeatable jobs (Redis-backed cron)
  if (cleanupQueue) {
    cleanupQueue.add({ task: "expired_locks" }, { repeat: { cron: "*/5 * * * *" } });   // Every 5 min
    cleanupQueue.add({ task: "expired_bookings" }, { repeat: { cron: "*/15 * * * *" } }); // Every 15 min
  }
  if (pricingQueue) {
    pricingQueue.add({ recalculate: true }, { repeat: { cron: "0 * * * *" } }); // Every hour
  }
}

// ================= QUEUE STATS =================
async function getQueueStats() {
  if (useInMemoryFallback) {
    return { mode: "in-memory", message: "Jobs processed immediately (no Redis)" };
  }

  const stats = {};
  const queues = { email: emailQueue, image: imageQueue, analytics: analyticsQueue, cleanup: cleanupQueue, pricing: pricingQueue };

  for (const [name, queue] of Object.entries(queues)) {
    if (queue) {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);
      stats[name] = { waiting, active, completed, failed };
    }
  }

  return { mode: "redis", stats };
}

// ================= GRACEFUL SHUTDOWN =================
async function shutdownQueues() {
  const queues = [emailQueue, imageQueue, analyticsQueue, cleanupQueue, pricingQueue].filter(Boolean);
  await Promise.all(queues.map((q) => q.close()));
}

// ================= EXPORTS =================
module.exports = {
  initializeQueues,
  setupScheduledJobs,
  addJob,
  sendBookingEmail,
  sendCancellationEmail,
  optimizeListingImage,
  trackEvent,
  scheduleCleanup,
  recalculatePricing,
  getQueueStats,
  shutdownQueues,
};
