/**
 * 1. Adds 2 new listings to the database
 * 2. Assigns UNIQUE images to ALL listings (no duplicates)
 *
 * Run: node init/addListingsAndDedup.js
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const Listing = require("../models/listing");
const User = require("../models/user");

// 50+ unique Unsplash images by category — enough so every listing gets a unique one
const IMAGE_POOL = {
  mountains: [
    "https://images.unsplash.com/photo-1601565415267-7eaeed98b602?w=900&q=80",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=900&q=80",
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=900&q=80",
    "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=900&q=80",
    "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=900&q=80",
    "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=900&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&q=80",
    "https://images.unsplash.com/photo-1520637836862-4d197d17c95a?w=900&q=80",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=900&q=80",
    "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=900&q=80",
    "https://images.unsplash.com/photo-1488462237308-ecaa28b729d7?w=900&q=80",
    "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=900&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=80",
    "https://images.unsplash.com/photo-1515688594390-b649af70d282?w=900&q=80",
    "https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb?w=900&q=80",
    "https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=900&q=80",
    "https://images.unsplash.com/photo-1586375300773-8384e3e4916f?w=900&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=900&q=80",
    "https://images.unsplash.com/photo-1503264116251-35a269479413?w=900&q=80",
    "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?w=900&q=80",
  ],
  beaches: [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80",
    "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=900&q=80",
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=80",
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=900&q=80",
    "https://images.unsplash.com/photo-1582610116397-edb318620f90?w=900&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80",
    "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=900&q=80",
    "https://images.unsplash.com/photo-1602391833977-358a52198938?w=900&q=80",
    "https://images.unsplash.com/photo-1493558103817-58b2924bce98?w=900&q=80",
    "https://images.unsplash.com/photo-1551887414-562ff8d61f21?w=900&q=80",
    "https://images.unsplash.com/photo-1505731132164-cca7f1a8d14b?w=900&q=80",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=900&q=80",
  ],
  iconic_cities: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=80",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=900&q=80",
    "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=900&q=80",
    "https://images.unsplash.com/photo-1622396481328-9b1b78cdd9fd?w=900&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=80",
  ],
  castles: [
    "https://images.unsplash.com/photo-1585543805890-6051f7829f98?w=900&q=80",
    "https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=900&q=80",
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=900&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=80",
    "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=900&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80",
  ],
  camping: [
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=900&q=80",
    "https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=900&q=80",
    "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=900&q=80",
    "https://images.unsplash.com/photo-1455763916899-e8b50eca9967?w=900&q=80",
    "https://images.unsplash.com/photo-1499244571948-7ccddb3583f1?w=900&q=80",
    "https://images.unsplash.com/photo-1518614368389-78a0d8f59b87?w=900&q=80",
  ],
  farms: [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80",
    "https://images.unsplash.com/photo-1518563259479-d003c05a6507?w=900&q=80",
    "https://images.unsplash.com/photo-1522706604294-ff1927f6dd0d?w=900&q=80",
    "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=900&q=80",
  ],
  homes: [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80",
    "https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=900&q=80",
    "https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=900&q=80",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=80",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=900&q=80",
    "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=900&q=80",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=80",
    "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=900&q=80",
    "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=900&q=80",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80",
  ],
  boats: [
    "https://images.unsplash.com/photo-1545159427-c46cef0a7d70?w=900&q=80",
    "https://images.unsplash.com/photo-1571733379281-fc0eddc20356?w=900&q=80",
    "https://images.unsplash.com/photo-1518709594023-6eab9bab7b6a?w=900&q=80",
    "https://images.unsplash.com/photo-1573472635971-ee48d96c6307?w=900&q=80",
  ],
  rooms: [
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80",
    "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=900&q=80",
  ],
  domes: [
    "https://images.unsplash.com/photo-1610483178519-f54b1cc6bbb6?w=900&q=80",
    "https://images.unsplash.com/photo-1611516491426-03025e6043c8?w=900&q=80",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=900&q=80",
  ],
};

const LOCATION_CAT = {
  goa: "beaches", manali: "mountains", shimla: "mountains", mussoorie: "mountains",
  darjeeling: "mountains", ooty: "mountains", kasol: "mountains", kullu: "mountains",
  leh: "mountains", gulmarg: "mountains", auli: "mountains", nainital: "mountains",
  munnar: "mountains", coorg: "mountains", shillong: "mountains",
  jaipur: "castles", jodhpur: "castles", udaipur: "castles",
  jaisalmer: "camping", bikaner: "camping", ranakpur: "camping",
  pondicherry: "beaches", andaman: "beaches",
  alleppey: "boats", kumarakom: "boats",
  mumbai: "iconic_cities", delhi: "iconic_cities", bangalore: "iconic_cities", kolkata: "iconic_cities",
  rishikesh: "homes", sundarbans: "homes", "jim corbett": "homes", kanha: "homes",
};

function getCategory(listing) {
  const text = `${listing.title} ${listing.description} ${listing.location}`.toLowerCase();
  for (const [key, cat] of Object.entries(LOCATION_CAT)) {
    if (text.includes(key)) return cat;
  }
  return listing.category || "homes";
}

async function run() {
  await mongoose.connect(process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust");
  console.log(" Connected to MongoDB\n");

  // Get any user as owner (or create a default one)
  let owner = await User.findOne({});
  if (!owner) {
    console.log("❌ No users found. Please sign up at least one user first.");
    process.exit(1);
  }

  // ================= ADD 2 NEW LISTINGS =================
  const newListings = [
    {
      title: "Sunset Lighthouse Stay",
      description: "Unique stay inside a restored coastal lighthouse with 360° ocean views and private deck for sunset watching.",
      price: 4200,
      location: "Kanyakumari",
      country: "India",
      geometry: { type: "Point", coordinates: [77.5400, 8.0883] },
      category: "homes",
      owner: owner._id,
      maxGuests: 4,
      instantBook: true,
      cancellationPolicy: "moderate",
    },
    {
      title: "Glass Igloo Northern Lights",
      description: "Sleep under the Himalayan stars in this transparent dome with floor heating and panoramic mountain views.",
      price: 5800,
      location: "Spiti Valley",
      country: "India",
      geometry: { type: "Point", coordinates: [78.0413, 32.2461] },
      category: "domes",
      owner: owner._id,
      maxGuests: 2,
      instantBook: true,
      cancellationPolicy: "flexible",
    },
  ];

  for (const data of newListings) {
    const existing = await Listing.findOne({ title: data.title, location: data.location });
    if (existing) {
      console.log(`⏭️  Skipping (already exists): ${data.title}`);
      continue;
    }
    await Listing.create(data);
    console.log(`✅ Added: ${data.title} (${data.location})`);
  }

  // ================= DEDUP IMAGES =================
  console.log("\n--- Assigning UNIQUE images to all listings ---\n");

  const allListings = await Listing.find({});
  console.log(`Total listings: ${allListings.length}`);

  // Track used images per category
  const usedByCategory = {};
  for (const cat of Object.keys(IMAGE_POOL)) usedByCategory[cat] = new Set();

  // Also track globally for fallback
  const usedGlobal = new Set();

  for (const listing of allListings) {
    const category = getCategory(listing);
    const pool = IMAGE_POOL[category] || IMAGE_POOL.homes;
    const usedInCat = usedByCategory[category] || new Set();

    // Find unused image in this category
    let chosen = pool.find((img) => !usedInCat.has(img) && !usedGlobal.has(img));

    // If category exhausted, pick from any unused global
    if (!chosen) {
      const allImages = Object.values(IMAGE_POOL).flat();
      chosen = allImages.find((img) => !usedGlobal.has(img));
    }

    // Last resort: random
    if (!chosen) {
      const allImages = Object.values(IMAGE_POOL).flat();
      chosen = allImages[Math.floor(Math.random() * allImages.length)];
    }

    usedInCat.add(chosen);
    usedGlobal.add(chosen);

    listing.image = { url: chosen, filename: "unsplash-unique" };
    await listing.save();
  }

  // Verify uniqueness
  const all = await Listing.find({}).select("title image").lean();
  const seen = new Set();
  let duplicates = 0;
  for (const l of all) {
    if (seen.has(l.image.url)) {
      duplicates++;
      console.log(`  ⚠️  Duplicate: ${l.title}`);
    }
    seen.add(l.image.url);
  }

  console.log(`\n✅ ${all.length} listings, ${seen.size} unique images${duplicates ? `, ${duplicates} duplicates` : " — NO DUPLICATES!"}`);

  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
