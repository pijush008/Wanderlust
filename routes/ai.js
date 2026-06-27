const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const aiController = require("../controllers/ai");

// GET /ai/chat — Chatbot page
router.get("/chat", aiController.chatPage);

// POST /ai/chat — Send message to AI
router.post("/chat", wrapAsync(aiController.chat));

// GET /ai/reviews/:id/summary — AI review summary
router.get("/reviews/:id/summary", wrapAsync(aiController.reviewSummary));

// GET /ai/search?q= — AI-powered smart search
router.get("/search", wrapAsync(aiController.smartSearch));

// POST /ai/generate-description — Generate listing description
router.post("/generate-description", wrapAsync(aiController.generateDesc));

module.exports = router;
