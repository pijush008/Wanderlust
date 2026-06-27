const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const c = require("../controllers/filter");

router.get("/", wrapAsync(c.filterPage));
router.get("/heatmap", wrapAsync(c.priceHeatmap));
router.get("/options", wrapAsync(c.filterOptionsAPI));
router.get("/distribution", wrapAsync(c.priceDistribution));

module.exports = router;
