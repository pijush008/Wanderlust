const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const listingController = require("../controllers/listing");
const { requireAuth, optionalAuth, isOwner } = require("../middleware/auth");
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });

router.get("/", wrapAsync(listingController.index));
router.post("/", requireAuth, upload.single("image"), wrapAsync(listingController.create));
router.get("/:id", optionalAuth, wrapAsync(listingController.show));
router.put("/:id", requireAuth, isOwner, upload.single("image"), wrapAsync(listingController.update));
router.delete("/:id", requireAuth, isOwner, wrapAsync(listingController.destroy));

module.exports = router;
