const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const c = require("../controllers/ai");

router.get("/chat", c.chatPage);
router.post("/chat", wrapAsync(c.chat));
router.get("/reviews/:id/summary", wrapAsync(c.reviewSummary));
router.get("/search", wrapAsync(c.smartSearch));
router.post("/generate-description", wrapAsync(c.generateDesc));

module.exports = router;
