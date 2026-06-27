/**
 * Replace random picsum images with curated Unsplash images of real
 * villas, houses, cabins, and hotels matching each listing's theme.
 *
 * Run: node init/updateImages.js
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const Listing = require("../models/listing");

// Curated by category — real-looking villa/house/hotel images from Unsplash
const IMAGES_BY_CATEGORY = {
  mountains: [
    "https://images.unsplash.com/photo-1601565415267-7eaeed98b602?w=900&q=80", // wooden cabin in mountains
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=900&q=80", // mountain villa
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=900&q=80", // mountain house
    "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=900&q=80", // cabin
    "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=900&q=80", // mountain retreat
    "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=900&q=80", // alpine cottage
  ],
  beaches: [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80", // beach villa
    "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=900&q=80", // beachfront
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=80", // beach house
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=900&q=80", // tropical villa
    "https://images.unsplash.com/photo-1582610116397-edb318620f90?w=900&q=80", // beach bungalow
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80", // ocean view villa
  ],
  iconic_cities: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80", // city apartment
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80", // modern flat
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=80", // city loft
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=900&q=80", // urban apartment
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80", // city home
  ],
  castles: [
    "https://images.unsplash.com/photo-1585543805890-6051f7829f98?w=900&q=80", // historic castle
    "https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=900&q=80", // palace
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=900&q=80", // haveli
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=80", // royal stay
  ],
  camping: [
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=900&q=80", // luxury camp
    "https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=900&q=80", // glamping tent
    "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=900&q=80", // desert camp
    "https://images.unsplash.com/photo-1455763916899-e8b50eca9967?w=900&q=80", // forest tent
  ],
  farms: [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80", // farmhouse
    "https://images.unsplash.com/photo-1518563259479-d003c05a6507?w=900&q=80", // country house
    "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=900&q=80", // farm stay
  ],
  homes: [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80", // modern home
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80", // luxury home
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80", // suburban house
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80", // villa
    "https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=900&q=80", // garden home
  ],
  boats: [
    "https://images.unsplash.com/photo-1545159427-c46cef0a7d70?w=900&q=80", // houseboat
    "https://images.unsplash.com/photo-1571733379281-fc0eddc20356?w=900&q=80", // backwater boat
    "https://images.unsplash.com/photo-1518709594023-6eab9bab7b6a?w=900&q=80", // luxury houseboat
  ],
  rooms: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80", // hotel room
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&q=80", // boutique hotel
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80", // luxury suite
  ],
  domes: [
    "https://images.unsplash.com/photo-1610483178519-f54b1cc6bbb6?w=900&q=80", // glamping dome
    "https://images.unsplash.com/photo-1611516491426-03025e6043c8?w=900&q=80", // geodesic dome
  ],
};

// Specific overrides by location keywords (more accurate)
const LOCATION_KEYWORDS = {
  goa: "beaches",
  manali: "mountains",
  shimla: "mountains",
  mussoorie: "mountains",
  darjeeling: "mountains",
  ooty: "mountains",
  kasol: "mountains",
  kullu: "mountains",
  leh: "mountains",
  gulmarg: "mountains",
  auli: "mountains",
  himalayan: "mountains",
  jaipur: "castles",
  jodhpur: "castles",
  udaipur: "castles",
  jaisalmer: "camping",
  bikaner: "camping",
  pondicherry: "beaches",
  andaman: "beaches",
  alleppey: "boats",
  kumarakom: "boats",
  mumbai: "iconic_cities",
  delhi: "iconic_cities",
  bangalore: "iconic_cities",
  rishikesh: "homes",
  shillong: "mountains",
  coorg: "mountains",
  "jim corbett": "homes",
  kanha: "homes",
};

function pickImage(listing) {
  const text = `${listing.title} ${listing.description} ${listing.location}`.toLowerCase();
  let category = listing.category || "homes";

  // Override by location
  for (const [key, cat] of Object.entries(LOCATION_KEYWORDS)) {
    if (text.includes(key)) { category = cat; break; }
  }

  const pool = IMAGES_BY_CATEGORY[category] || IMAGES_BY_CATEGORY.homes;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function updateAllImages() {
  await mongoose.connect(process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust");
  console.log("Connected to MongoDB");

  const listings = await Listing.find({});
  console.log(`Found ${listings.length} listings to update`);

  let updated = 0;
  for (const listing of listings) {
    const newUrl = pickImage(listing);
    listing.image = {
      url: newUrl,
      filename: "unsplash-curated",
    };
    await listing.save();
    updated++;
    console.log(`  ✓ ${listing.title} (${listing.location})`);
  }

  console.log(`\n✅ Updated ${updated} listings with curated images`);
  await mongoose.disconnect();
}

updateAllImages().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
