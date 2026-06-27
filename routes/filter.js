const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const filterController = require("../controllers/filter");

// GET /filter — Advanced filter page (rendered)
router.get("/", wrapAsync(filterController.filterPage));

// GET /api/filter — JSON API for AJAX filtering
router.get("/api", wrapAsync(filterController.filterAPI));

// GET /api/filter/heatmap — Price heatmap data
router.get("/api/heatmap", wrapAsync(filterController.priceHeatmap));

// GET /api/filter/options — Available filter options
router.get("/api/options", wrapAsync(filterController.filterOptionsAPI));

// GET /api/filter/distribution — Price distribution
router.get("/api/distribution", wrapAsync(filterController.priceDistribution));

module.exports = router;
