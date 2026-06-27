const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const c = require("../controllers/recommendation");
const { requireAuth, optionalAuth } = require("../middleware/auth");

router.get("/", requireAuth, wrapAsync(c.recommendationsPage));
router.get("/similar/:id", wrapAsync(c.getSimilar));
router.post("/track/view/:id", optionalAuth, wrapAsync(c.trackView));
router.post("/track/search", optionalAuth, wrapAsync(c.trackSearch));
router.get("/profile", requireAuth, wrapAsync(c.getUserProfile));

module.exports = router;
