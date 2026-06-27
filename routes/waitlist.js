const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const waitlistController = require("../controllers/waitlist");
const { isLoggedIn } = require("../middleware");

// POST /api/waitlist/:id/join — Join waitlist for a listing
router.post("/:id/join", isLoggedIn, wrapAsync(waitlistController.joinWaitlist));

// POST /api/waitlist/:waitlistId/leave — Leave waitlist
router.post("/:waitlistId/leave", isLoggedIn, wrapAsync(waitlistController.leaveWaitlist));

// GET /api/waitlist/:id/status — Get waitlist count + user position
router.get("/:id/status", wrapAsync(waitlistController.getStatus));

// GET /api/waitlist/:id/queue — Get full queue (owner view)
router.get("/:id/queue", isLoggedIn, wrapAsync(waitlistController.listingWaitlist));

// GET /waitlist — My waitlist page
router.get("/", isLoggedIn, wrapAsync(waitlistController.myWaitlist));

module.exports = router;
