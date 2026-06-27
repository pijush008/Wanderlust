const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const mapsController = require("../controllers/maps");

// GET /api/maps/:id/poi — Nearby restaurants, hospitals, stations, attractions
router.get("/:id/poi", wrapAsync(mapsController.getNearbyPOI));

// GET /api/maps/:id/nearby — Nearby listings (geo query)
router.get("/:id/nearby", wrapAsync(mapsController.getNearbyListings));

// GET /api/maps/clusters — Clustered markers for map view
router.get("/clusters", wrapAsync(mapsController.getMapClusters));

// GET /api/maps/markers — All listing markers
router.get("/markers", wrapAsync(mapsController.getMapMarkers));

module.exports = router;
