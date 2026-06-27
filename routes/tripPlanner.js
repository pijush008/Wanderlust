const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const tripController = require("../controllers/tripPlanner");

// GET /trips/plan — Trip planner form page
router.get("/plan", tripController.plannerPage);

// POST /trips/plan — Generate trip plan (form submit)
router.post("/plan", wrapAsync(tripController.generatePlan));

// GET /trips/api/plan — Generate plan (JSON API)
router.get("/api/plan", wrapAsync(tripController.generatePlanAPI));

// GET /trips/api/destinations — Available destinations
router.get("/api/destinations", tripController.getDestinations);

module.exports = router;
