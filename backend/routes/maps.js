const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const c = require("../controllers/maps");

router.get("/:id/poi", wrapAsync(c.getNearbyPOI));
router.get("/:id/nearby", wrapAsync(c.getNearbyListings));
router.get("/clusters", wrapAsync(c.getMapClusters));
router.get("/markers", wrapAsync(c.getMapMarkers));

module.exports = router;
