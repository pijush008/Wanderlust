const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const c = require("../controllers/weather");

router.get("/:id", wrapAsync(c.getWeather));

module.exports = router;
