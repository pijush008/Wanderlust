const { travelAssistant, summarizeReviews, parseSearchIntent, generateDescription } = require("../utils/aiService");
const Listing = require("../models/listing");

// ================= CHATBOT INFO =================
module.exports.chatPage = (req, res) => {
  res.json({ available: true, welcomeMessage: "Hi! I'm WanderBot 🌍 ask me anything about travel." });
};

// ================= CHAT API =================
module.exports.chat = async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: "Message required" });
  }

  // Build context from available listings
  const listings = await Listing.find({})
    .select("title location price category")
    .limit(10)
    .lean();

  const listingContext = listings
    .map((l) => `${l.title} in ${l.location} — ₹${l.price}/night (${l.category || "home"})`)
    .join("\n");

  const result = await travelAssistant(message.trim(), { listings: listingContext });

  res.json(result);
};

// ================= REVIEW SUMMARY API =================
module.exports.reviewSummary = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" } });
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  if (!listing.reviews || listing.reviews.length < 3) {
    return res.json({ summary: null, message: "Not enough reviews to summarize" });
  }

  const reviews = listing.reviews.map((r) => ({
    rating: r.rating,
    comment: r.comment,
  }));

  const summary = await summarizeReviews(reviews);
  res.json({ summary, reviewCount: reviews.length });
};

// ================= SMART SEARCH API =================
module.exports.smartSearch = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Query required" });

  const intent = await parseSearchIntent(q);

  if (!intent) {
    return res.json({ intent: null, message: "Could not parse intent" });
  }

  // Build MongoDB query from AI-parsed intent
  const query = {};
  if (intent.location) query.location = new RegExp(intent.location, "i");
  if (intent.category) query.category = intent.category;
  if (intent.maxPrice) query.price = { ...query.price, $lte: intent.maxPrice };
  if (intent.minPrice) query.price = { ...query.price, $gte: intent.minPrice };
  if (intent.familyFriendly) query["familyFriendly.childSafe"] = true;
  if (intent.petFriendly) query["petFriendly.allowed"] = true;

  const results = await Listing.find(query).limit(12).lean();

  res.json({
    intent,
    results: results.map((l) => ({
      _id: l._id,
      title: l.title,
      location: l.location,
      price: l.price,
      image: l.image?.url,
      category: l.category,
    })),
    total: results.length,
  });
};

// ================= DESCRIPTION GENERATOR API =================
module.exports.generateDesc = async (req, res) => {
  const { title, location, country, price, category, amenities } = req.body;

  if (!title || !location) {
    return res.status(400).json({ error: "Title and location required" });
  }

  const description = await generateDescription({ title, location, country, price, category, amenities });
  res.json({ description });
};
