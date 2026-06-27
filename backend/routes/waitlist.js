const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const c = require("../controllers/waitlist");
const { requireAuth } = require("../middleware/auth");

router.post("/:id/join", requireAuth, wrapAsync(c.joinWaitlist));
router.post("/:waitlistId/leave", requireAuth, wrapAsync(c.leaveWaitlist));
router.get("/:id/status", wrapAsync(c.getStatus));
router.get("/:id/queue", requireAuth, wrapAsync(c.listingWaitlist));
router.get("/", requireAuth, wrapAsync(c.myWaitlist));

module.exports = router;
