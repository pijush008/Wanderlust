const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const c = require("../controllers/booking");
const { requireAuth } = require("../middleware/auth");

router.post("/listings/:id/book", requireAuth, wrapAsync(c.create));
router.get("/bookings", requireAuth, wrapAsync(c.myBookings));
router.get("/bookings/:bookingId", requireAuth, wrapAsync(c.show));
router.post("/bookings/:bookingId/cancel", requireAuth, wrapAsync(c.cancel));
router.get("/listings/:id/availability", wrapAsync(c.checkAvailability));
router.get("/listings/:id/booked-dates", wrapAsync(c.getBookedDates));

module.exports = router;
