const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const bookingController = require("../controllers/booking");
const { isLoggedIn } = require("../middleware");

// POST /listings/:id/book — Create a booking (with conflict resolution)
router.post("/listings/:id/book", isLoggedIn, wrapAsync(bookingController.createBooking));

// GET /bookings — My bookings list
router.get("/bookings", isLoggedIn, wrapAsync(bookingController.myBookings));

// GET /bookings/:bookingId — View single booking
router.get("/bookings/:bookingId", isLoggedIn, wrapAsync(bookingController.showBooking));

// POST /bookings/:bookingId/cancel — Cancel a booking
router.post("/bookings/:bookingId/cancel", isLoggedIn, wrapAsync(bookingController.cancelBooking));

// API: Check availability (JSON)
router.get("/api/bookings/:id/availability", wrapAsync(bookingController.checkAvailability));

// API: Get booked dates for calendar (JSON)
router.get("/api/bookings/:id/dates", wrapAsync(bookingController.getBookedDates));

module.exports = router;
