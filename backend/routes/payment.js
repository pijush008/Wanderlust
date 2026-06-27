const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const c = require("../controllers/payment");
const { requireAuth } = require("../middleware/auth");

router.post("/create-order", requireAuth, wrapAsync(c.createOrder));
router.post("/verify", requireAuth, wrapAsync(c.verifyPayment));
router.post("/failed", requireAuth, wrapAsync(c.markFailed));
router.get("/:id/receipt", requireAuth, wrapAsync(c.getReceipt));

module.exports = router;
