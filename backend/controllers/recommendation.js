const {
  getRecommendations,
  findSimilarListings,
  trackActivity,
  buildUserProfile,
  classifyPrice,
} = require("../utils/recommendationEngine");
const Listing = require("../models/listing");

// ================= GET PERSONALIZED RECOMMENDATIONS =================
module.exports.getRecommendations = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Login required for personalized recommendations" });
  }

  const result = await getRecommendations(req.user._id);
  res.json(result);
};

// ================= GET SIMILAR LISTINGS =================
module.exports.getSimilar = async (req, res) => {
  const { id } = req.params;
  const similar = await findSimilarListings(id, 6);

  res.json({
    listingId: id,
    similar: similar.map((s) => ({
      _id: s._id,
      title: s.title,
      location: s.location,
      price: s.price,
      image: s.image?.url,
      category: s.category,
      similarityScore: s.similarityScore,
    })),
  });
};

// ================= TRACK VIEW (called when user views a listing) =================
module.exports.trackView = async (req, res) => {
  if (!req.user) return res.json({ tracked: false });

  const { id } = req.params;
  const listing = await Listing.findById(id).select("location country category price").lean();

  if (listing) {
    await trackActivity(req.user._id, "view", {
      listingId: id,
      listingData: {
        location: listing.location,
        country: listing.country,
        category: listing.category || "homes",
        priceRange: classifyPrice(listing.price),
        price: listing.price,
      },
    });
  }

  res.json({ tracked: true });
};

// ================= TRACK SEARCH =================
module.exports.trackSearch = async (req, res) => {
  if (!req.user) return res.json({ tracked: false });

  const { q } = req.query;
  if (q) {
    await trackActivity(req.user._id, "search", { searchQuery: q });
  }

  res.json({ tracked: true });
};

// ================= GET USER PROFILE (debug/admin) =================
module.exports.getUserProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Login required" });
  }

  const profile = await buildUserProfile(req.user._id);
  res.json({ userId: req.user._id, profile });
};

// ================= RECOMMENDATIONS (JSON) =================
module.exports.recommendationsPage = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Login required" });
  const result = await getRecommendations(req.user._id, 12);
  res.json(result);
};
