const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const c = require("../controllers/tripPlanner");

router.get("/options", c.options);
router.post("/plan", wrapAsync(c.generatePlan));
router.get("/destinations", c.getDestinations);

module.exports = router;
