const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync");
const reviewController = require("../controllers/review");
const { requireAuth } = require("../middleware/auth");

router.post("/", requireAuth, wrapAsync(reviewController.create));
router.delete("/:reviewId", requireAuth, wrapAsync(reviewController.destroy));

module.exports = router;
