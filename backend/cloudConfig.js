const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "wanderlust_DEV",
    allowedFormats: ["jpg", "jpeg", "png", "webp", "avif"],
    // Optimize on upload: auto quality + format
    transformation: [
      { quality: "auto", fetch_format: "auto" },
    ],
  },
});

module.exports = { cloudinary, storage };
