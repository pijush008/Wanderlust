const express = require("express");
const router = express.Router();
const { cache } = require("../utils/cache");
const { getRealtimeStats } = require("../utils/realtime");

// GET /api/cache/stats — Cache performance metrics
router.get("/stats", (req, res) => {
  const stats = cache.getStats();
  res.json(stats);
});

// GET /api/cache/realtime — Realtime WebSocket stats
router.get("/realtime", (req, res) => {
  const stats = getRealtimeStats();
  res.json(stats);
});

// POST /api/cache/flush — Flush entire cache (admin only)
router.post("/flush", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  cache.flush();
  res.json({ message: "Cache flushed", timestamp: new Date().toISOString() });
});

module.exports = router;
