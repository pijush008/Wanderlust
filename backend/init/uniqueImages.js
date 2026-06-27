/**
 * Assign 100% UNIQUE, visually distinct images to every listing
 * Uses 50+ hand-picked Unsplash images
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const Listing = require("../models/listing");
const { cache } = require("../utils/cache");

// 50+ HAND-VERIFIED unique images (no visual duplicates)
const UNIQUE_IMAGES = [
  // Mountains / Cabins
  "https://images.unsplash.com/photo-1601565415267-7eaeed98b602?w=900&q=80",
  "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=900&q=80",
  "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=900&q=80",
  "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=900&q=80",
  "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=900&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=80",
  "https://images.unsplash.com/photo-1515688594390-b649af70d282?w=900&q=80",
  "https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb?w=900&q=80",
  "https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=900&q=80",
  "https://images.unsplash.com/photo-1586375300773-8384e3e4916f?w=900&q=80",
  "https://images.unsplash.com/photo-1503264116251-35a269479413?w=900&q=80",
  "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?w=900&q=80",
  // Beaches / Villas
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80",
  "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=900&q=80",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=80",
  "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=900&q=80",
  "https://images.unsplash.com/photo-1582610116397-edb318620f90?w=900&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80",
  "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=900&q=80",
  "https://images.unsplash.com/photo-1602391833977-358a52198938?w=900&q=80",
  "https://images.unsplash.com/photo-1505731132164-cca7f1a8d14b?w=900&q=80",
  // Cities / Apartments
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=80",
  "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=900&q=80",
  "https://images.unsplash.com/photo-1622396481328-9b1b78cdd9fd?w=900&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=80",
  // Castles / Palaces
  "https://images.unsplash.com/photo-1585543805890-6051f7829f98?w=900&q=80",
  "https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=900&q=80",
  "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=900&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=80",
  "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=900&q=80",
  // Camping / Tents
  "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=900&q=80",
  "https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=900&q=80",
  "https://images.unsplash.com/photo-1455763916899-e8b50eca9967?w=900&q=80",
  "https://images.unsplash.com/photo-1499244571948-7ccddb3583f1?w=900&q=80",
  // Farms / Countryside
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80",
  "https://images.unsplash.com/photo-1522706604294-ff1927f6dd0d?w=900&q=80",
  "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=900&q=80",
  // Modern Homes
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80",
  "https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=900&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=80",
  // Houseboats
  "https://images.unsplash.com/photo-1545159427-c46cef0a7d70?w=900&q=80",
  "https://images.unsplash.com/photo-1571733379281-fc0eddc20356?w=900&q=80",
  // Hotels / Rooms
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&q=80",
  "https://images.unsplash.com/photo-1611516491426-03025e6043c8?w=900&q=80",
  "https://images.unsplash.com/photo-1610483178519-f54b1cc6bbb6?w=900&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80",
  "https://images.unsplash.com/photo-1488462237308-ecaa28b729d7?w=900&q=80",
  "https://images.unsplash.com/photo-1518709594023-6eab9bab7b6a?w=900&q=80",
  "https://images.unsplash.com/photo-1518563259479-d003c05a6507?w=900&q=80",
];

async function run() {
  await mongoose.connect(process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust");
  console.log("Connected to MongoDB");

  // Initialize cache then flush
  cache.initialize(process.env.REDIS_URL || null);
  await cache.flush();
  console.log("✅ Cache flushed");

  const listings = await Listing.find({}).sort({ createdAt: 1 });
  console.log(`Found ${listings.length} listings, ${UNIQUE_IMAGES.length} unique images available\n`);

  if (listings.length > UNIQUE_IMAGES.length) {
    console.log(`⚠️  Warning: More listings (${listings.length}) than unique images (${UNIQUE_IMAGES.length})`);
  }

  // Shuffle images for variety
  const shuffled = [...UNIQUE_IMAGES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const imageUrl = shuffled[i % shuffled.length]; // wrap if too many listings
    listing.image = { url: imageUrl, filename: "unsplash-unique" };
    await listing.save();
    console.log(`  ${i + 1}. ${listing.title}\n     → ${imageUrl.split("?")[0]}`);
  }

  // Verify
  const all = await Listing.find({}).select("image").lean();
  const urls = all.map((l) => l.image.url);
  const unique = new Set(urls);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Total listings: ${all.length}`);
  console.log(`Unique images: ${unique.size}`);
  if (urls.length === unique.size) {
    console.log(`✅ 100% UNIQUE — no duplicates!`);
  } else {
    console.log(`❌ ${urls.length - unique.size} duplicates found`);
  }

  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
