const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const recController = require("../controllers/recommendation");

// GET /recommendations — Personalized recommendations page
router.get("/", wrapAsync(recController.recommendationsPage));

// GET /api/recommendations — JSON API for personalized recs
router.get("/api", wrapAsync(recController.getRecommendations));

// GET /api/recommendations/similar/:id — Similar listings
router.get("/api/similar/:id", wrapAsync(recController.getSimilar));

// POST /api/recommendations/track/view/:id — Track listing view
router.post("/api/track/view/:id", wrapAsync(recController.trackView));

// POST /api/recommendations/track/search — Track search query
router.post("/api/track/search", wrapAsync(recController.trackSearch));

// GET /api/recommendations/profile — User preference profile
router.get("/api/profile", wrapAsync(recController.getUserProfile));

module.exports = router;
