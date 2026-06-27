const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const initData = require("./data.js");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}


 // const dbUrl = process.env.MONGO_URL

 const dbUrl = process.env.ATLASDB_URL



// Replace with your actual User ID from the Users collection
const OWNER_ID = "6939868f9fce4aa8fe0243c4";

mongoose
  .connect(dbUrl)
  .then(() => {
    console.log(" MongoDB connected");
  })
  .catch((err) => {
    console.log(" MongoDB connection error:", err);
    console.log("DB URL:", process.env.ATLASDB_URL);

  });

const initDB = async () => {
  try {
    // Remove existing listings
    await Listing.deleteMany({});
    console.log("  Old listings deleted");

    // Add owner to each listing
    const listingsWithOwner = initData.data.map((listing) => {
      return { ...listing, owner: OWNER_ID };
    });

    // Insert all listings
    await Listing.insertMany(listingsWithOwner);
    console.log(" All listings added successfully");

    mongoose.connection.close();
  } catch (err) {
    console.log(" Error seeding DB:", err);
  }
};

initDB();
