if (process.env.NODE_ENV !== "production") require("dotenv").config();

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);

// ================= CORS (frontend can be on different domain) =================
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ================= DATABASE =================
mongoose.connect(process.env.ATLASDB_URL || process.env.MONGO_URL)
  .then(() => console.log(" MongoDB Connected"))
  .catch((err) => console.error(" MongoDB error:", err.message));

// ================= CACHE =================
const { cache } = require("./utils/cache");
cache.initialize(process.env.REDIS_URL || null);

// ================= AI =================
const { initializeAI } = require("./utils/aiService");
initializeAI();

// ================= REALTIME =================
const { initializeSocket } = require("./utils/realtime");
initializeSocket(server);

// ================= WORKER QUEUES =================
const { initializeQueues, setupScheduledJobs } = require("./utils/workerQueue");
initializeQueues();
setupScheduledJobs();

// ================= HEALTH CHECK =================
const { setupGracefulShutdown, healthRoutes } = require("./utils/healthCheck");
setupGracefulShutdown(server);
healthRoutes(app);

// ================= API ROUTES =================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/listings", require("./routes/listing"));
app.use("/api/listings/:id/reviews", require("./routes/review"));
app.use("/api/search", require("./routes/search"));
app.use("/api/filter", require("./routes/filter"));
app.use("/api/pricing", require("./routes/pricing"));
app.use("/api", require("./routes/booking"));
app.use("/api/trips", require("./routes/tripPlanner"));
app.use("/api/recommendations", require("./routes/recommendation"));
app.use("/api/waitlist", require("./routes/waitlist"));
app.use("/api/maps", require("./routes/maps"));
app.use("/api/weather", require("./routes/weather"));
app.use("/api/payments", require("./routes/payment"));
app.use("/api/ai", require("./routes/ai"));

// Root
app.get("/", (req, res) => {
  res.json({
    name: "Wanderlust API",
    version: "1.0.0",
    endpoints: ["/api/auth", "/api/listings", "/api/search", "/api/trips", "/api/ai"],
  });
});

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(` API Server running on port ${PORT}`);
});
