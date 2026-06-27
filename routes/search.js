const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const searchController = require("../controllers/search");

// GET /search?q=query — Full search results page
router.get("/", wrapAsync(searchController.search));

// GET /search/autocomplete?q=query — JSON autocomplete suggestions
router.get("/autocomplete", wrapAsync(searchController.autocomplete));

// GET /search/trending — JSON trending locations
router.get("/trending", wrapAsync(searchController.trending));

module.exports = router;
