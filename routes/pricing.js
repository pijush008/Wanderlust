const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const pricingController = require("../controllers/pricing");

// GET /api/pricing/:id — Full dynamic price for a listing
router.get("/:id", wrapAsync(pricingController.getListingPrice));

// GET /api/pricing/:id/breakdown — Price breakdown widget data
router.get("/:id/breakdown", wrapAsync(pricingController.getPriceBreakdown));

// GET /api/pricing/:id/calendar — Price calendar (30-90 days)
router.get("/:id/calendar", wrapAsync(pricingController.getPriceCalendar));

// GET /api/pricing/:id/analytics — Owner analytics & forecast
router.get("/:id/analytics", wrapAsync(pricingController.getPricingAnalytics));

// GET /api/pricing/info/festivals — Upcoming festivals with surge info
router.get("/info/festivals", pricingController.getUpcomingFestivals);

module.exports = router;
