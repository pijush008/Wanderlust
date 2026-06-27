const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const authController = require("../controllers/auth");
const { requireAuth } = require("../middleware/auth");

router.post("/signup", wrapAsync(authController.signup));
router.post("/login", wrapAsync(authController.login));
router.get("/me", requireAuth, wrapAsync(authController.me));

module.exports = router;
