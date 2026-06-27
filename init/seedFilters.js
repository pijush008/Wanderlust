/**
 * Seed existing listings with advanced filter fields
 * Run: node init/seedFilters.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const Listing = require("../models/listing");

const CATEGORIES = ["mountains", "beaches", "farms", "camping", "rooms", "iconic_cities", "homes", "castles", "boats", "domes"];
const CANCELLATION = ["flexible", "moderate", "strict"];
const AMENITIES_POOL = [
  "wifi", "kitchen", "parking", "pool", "ac", "heating",
  "washer", "dryer", "tv", "workspace", "balcony", "garden",
  "bbq", "gym", "hot_tub", "fireplace", "elevator", "security",
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBool(probability = 0.5) {
  return Math.random() < probability;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAmenities() {
  const count = randomInt(3, 8);
  const shuffled = [...AMENITIES_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function seedFilters() {
  await mongoose.connect(process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust");
  console.log("Connected to MongoDB");

  const listings = await Listing.find({});
  console.log(`Found ${listings.length} listings to update`);

  let updated = 0;
  for (const listing of listings) {
    // Assign category based on title/description keywords
    let category = "homes";
    const text = (listing.title + " " + listing.description).toLowerCase();
    if (text.includes("mountain") || text.includes("hill") || text.includes("cabin")) category = "mountains";
    else if (text.includes("beach") || text.includes("coast") || text.includes("island")) category = "beaches";
    else if (text.includes("farm") || text.includes("countryside")) category = "farms";
    else if (text.includes("camp") || text.includes("tent")) category = "camping";
    else if (text.includes("castle") || text.includes("palace") || text.includes("haveli")) category = "castles";
    else if (text.includes("boat") || text.includes("houseboat")) category = "boats";
    else if (text.includes("city") || text.includes("apartment") || text.includes("loft")) category = "iconic_cities";
    else if (text.includes("room") || text.includes("hotel")) category = "rooms";
    else if (text.includes("dome") || text.includes("igloo")) category = "domes";

    listing.category = category;
    listing.cancellationPolicy = randomFrom(CANCELLATION);
    listing.instantBook = randomBool(0.4);
    listing.maxGuests = randomInt(2, 10);
    listing.amenities = randomAmenities();

    // Family-friendly (40% chance)
    const isFamilyFriendly = randomBool(0.4);
    listing.familyFriendly = {
      childSafe: isFamilyFriendly,
      hasHighChair: isFamilyFriendly && randomBool(0.6),
      hasCrib: isFamilyFriendly && randomBool(0.5),
      kidsActivities: isFamilyFriendly && randomBool(0.3),
      familyScore: 0, // Will be calculated
    };

    // Pet-friendly (35% chance)
    const isPetFriendly = randomBool(0.35);
    listing.petFriendly = {
      allowed: isPetFriendly,
      hasPetBed: isPetFriendly && randomBool(0.5),
      hasYard: isPetFriendly && randomBool(0.4),
      petFee: isPetFriendly ? (randomBool(0.5) ? 0 : randomInt(200, 500)) : 0,
      petScore: 0, // Will be calculated
    };

    // Calculate scores
    let familyScore = 0;
    if (listing.familyFriendly.childSafe) familyScore += 30;
    if (listing.familyFriendly.hasHighChair) familyScore += 15;
    if (listing.familyFriendly.hasCrib) familyScore += 20;
    if (listing.familyFriendly.kidsActivities) familyScore += 20;
    if (listing.maxGuests >= 6) familyScore += 10;
    if (listing.cancellationPolicy === "flexible") familyScore += 5;
    listing.familyFriendly.familyScore = Math.min(familyScore, 100);

    let petScore = 0;
    if (listing.petFriendly.allowed) petScore += 40;
    if (listing.petFriendly.hasPetBed) petScore += 20;
    if (listing.petFriendly.hasYard) petScore += 25;
    if (listing.petFriendly.petFee === 0 && listing.petFriendly.allowed) petScore += 15;
    listing.petFriendly.petScore = Math.min(petScore, 100);

    await listing.save();
    updated++;
  }

  console.log(`✅ Updated ${updated} listings with filter fields`);
  await mongoose.disconnect();
}

seedFilters().catch(console.error);
