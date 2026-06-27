const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const c = require("../controllers/search");

router.get("/", wrapAsync(c.search));
router.get("/autocomplete", wrapAsync(c.autocomplete));
router.get("/trending", wrapAsync(c.trending));

module.exports = router;
