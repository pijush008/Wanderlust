const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const c = require("../controllers/pricing");

router.get("/:id", wrapAsync(c.getListingPrice));
router.get("/:id/breakdown", wrapAsync(c.getPriceBreakdown));
router.get("/:id/calendar", wrapAsync(c.getPriceCalendar));
router.get("/:id/analytics", wrapAsync(c.getPricingAnalytics));
router.get("/info/festivals", c.getUpcomingFestivals);

module.exports = router;
