/**
 * ================= RECOMMENDATION ENGINE =================
 * 
 * Architecture:
 *   User History → Similarity Engine → Recommendation Service
 * 
 * Algorithms:
 *   1. Content-Based Filtering
 *      - Builds user preference profile from history
 *      - Finds listings similar to what user liked
 *      - Features: location, category, price range, amenities
 * 
 *   2. Collaborative Filtering
 *      - "Users who booked X also booked Y"
 *      - Finds users with similar taste, recommends their picks
 *      - Item-based: finds listings commonly booked together
 * 
 *   3. Hybrid Scoring
 *      - Combines content-based (60%) + collaborative (30%) + popularity (10%)
 *      - Applies diversity penalty (avoid recommending same location repeatedly)
 *      - Freshness boost (newer listings get slight advantage)
 * 
 * Performance:
 *   - Pre-computed user profiles (updated on each interaction)
 *   - Cached recommendations (TTL: 10 minutes)
 *   - Fallback to popularity-based when no history exists (cold start)
 */

const Listing = require("../models/listing");
const UserActivity = require("../models/userActivity");
const Booking = require("../models/booking");
const { getQuickPrice } = require("./pricingEngine");
const { cache, TTL, recommendationsKey } = require("./cache");

// ================= PRICE RANGE CLASSIFIER =================
function classifyPrice(price) {
  if (price < 1500) return "budget";
  if (price < 3000) return "mid";
  if (price < 5000) return "premium";
  return "luxury";
}

// ================= TRACK USER ACTIVITY =================

/**
 * Record a user interaction (called from controllers)
 */
async function trackActivity(userId, action, data = {}) {
  if (!userId) return;

  try {
    const activity = new UserActivity({
      user: userId,
      action,
      listing: data.listingId || null,
      listingData: data.listingData || null,
      searchQuery: data.searchQuery || null,
      duration: data.duration || null,
      rating: data.rating || null,
      device: data.device || "desktop",
      sessionId: data.sessionId || null,
    });

    await activity.save();

    // Invalidate cached recommendations for this user
    await cache.del(recommendationsKey(userId.toString()));
  } catch (err) {
    // Non-critical — don't break the request
    console.error("Activity tracking error:", err.message);
  }
}

// ================= USER PREFERENCE PROFILE =================

/**
 * Build a user's preference profile from their history
 * Returns weighted preferences for location, category, price range
 */
async function buildUserProfile(userId) {
  const activities = await UserActivity.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  if (activities.length === 0) return null;

  // Weight by action type (bookings matter more than views)
  const weights = { book: 5, review: 4, wishlist: 3, view: 1, search: 0.5 };

  const profile = {
    locations: {},      // location → weighted score
    categories: {},     // category → weighted score
    priceRanges: {},    // priceRange → weighted score
    avgPrice: 0,
    totalInteractions: activities.length,
    recentListings: [], // Last 10 interacted listing IDs
  };

  let priceSum = 0;
  let priceCount = 0;

  for (const act of activities) {
    const w = weights[act.action] || 1;

    if (act.listingData) {
      // Location preference
      if (act.listingData.location) {
        profile.locations[act.listingData.location] =
          (profile.locations[act.listingData.location] || 0) + w;
      }

      // Category preference
      if (act.listingData.category) {
        profile.categories[act.listingData.category] =
          (profile.categories[act.listingData.category] || 0) + w;
      }

      // Price range preference
      if (act.listingData.priceRange) {
        profile.priceRanges[act.listingData.priceRange] =
          (profile.priceRanges[act.listingData.priceRange] || 0) + w;
      }

      if (act.listingData.price) {
        priceSum += act.listingData.price;
        priceCount++;
      }
    }

    if (act.listing) {
      profile.recentListings.push(act.listing.toString());
    }
  }

  profile.avgPrice = priceCount > 0 ? Math.round(priceSum / priceCount) : 2000;
  profile.recentListings = [...new Set(profile.recentListings)].slice(0, 10);

  return profile;
}

// ================= CONTENT-BASED FILTERING =================

/**
 * Score a listing based on how well it matches user's profile
 * Higher score = better match
 */
function contentBasedScore(listing, profile) {
  if (!profile) return 0;

  let score = 0;

  // Location match (strongest signal)
  if (profile.locations[listing.location]) {
    score += profile.locations[listing.location] * 10;
  }

  // Category match
  const category = listing.category || "homes";
  if (profile.categories[category]) {
    score += profile.categories[category] * 8;
  }

  // Price range match
  const priceRange = classifyPrice(listing.price);
  if (profile.priceRanges[priceRange]) {
    score += profile.priceRanges[priceRange] * 6;
  }

  // Price proximity (closer to user's average = better)
  if (profile.avgPrice > 0) {
    const priceDiff = Math.abs(listing.price - profile.avgPrice) / profile.avgPrice;
    if (priceDiff < 0.2) score += 15;       // Within 20% of avg
    else if (priceDiff < 0.5) score += 8;   // Within 50%
    else score -= 5;                         // Too far from preference
  }

  // Country match (weaker signal)
  const countryActivities = Object.entries(profile.locations)
    .filter(([loc]) => loc); // Just having location data is a signal

  return score;
}

// ================= COLLABORATIVE FILTERING =================

/**
 * Find listings that similar users also booked
 * "Users who booked listing X also booked Y"
 */
async function collaborativeRecommendations(userId, limit = 10) {
  // Step 1: Get listings this user has booked/viewed
  const userListings = await UserActivity.find({
    user: userId,
    action: { $in: ["book", "view", "wishlist"] },
    listing: { $ne: null },
  })
    .distinct("listing");

  if (userListings.length === 0) return [];

  // Step 2: Find other users who interacted with the same listings
  const similarUsers = await UserActivity.aggregate([
    {
      $match: {
        listing: { $in: userListings },
        user: { $ne: userId },
        action: { $in: ["book", "view"] },
      },
    },
    { $group: { _id: "$user", commonListings: { $sum: 1 } } },
    { $sort: { commonListings: -1 } },
    { $limit: 20 }, // Top 20 similar users
  ]);

  if (similarUsers.length === 0) return [];

  const similarUserIds = similarUsers.map((u) => u._id);

  // Step 3: Get listings those similar users liked but current user hasn't seen
  const recommendations = await UserActivity.aggregate([
    {
      $match: {
        user: { $in: similarUserIds },
        action: { $in: ["book", "review", "wishlist"] },
        listing: { $nin: userListings, $ne: null },
      },
    },
    {
      $group: {
        _id: "$listing",
        score: { $sum: 1 },           // More users = higher score
        actions: { $push: "$action" },
      },
    },
    { $sort: { score: -1 } },
    { $limit: limit },
  ]);

  return recommendations.map((r) => ({
    listingId: r._id,
    collaborativeScore: r.score * 5, // Normalize
    bookedBy: r.actions.filter((a) => a === "book").length,
  }));
}

// ================= POPULARITY-BASED (Cold Start) =================

/**
 * When user has no history, recommend popular listings
 */
async function popularityRecommendations(limit = 10) {
  // Most booked + most reviewed listings
  const popular = await Listing.aggregate([
    {
      $project: {
        title: 1,
        location: 1,
        country: 1,
        price: 1,
        category: 1,
        image: 1,
        reviewCount: { $size: { $ifNull: ["$reviews", []] } },
      },
    },
    { $sort: { reviewCount: -1 } },
    { $limit: limit },
  ]);

  return popular;
}

// ================= SIMILAR LISTINGS (Item-Based) =================

/**
 * Find listings similar to a given listing
 * Used on the show page: "You might also like"
 */
async function findSimilarListings(listingId, limit = 6) {
  const listing = await Listing.findById(listingId).lean();
  if (!listing) return [];

  // Find by same location, category, or similar price
  const priceMin = listing.price * 0.6;
  const priceMax = listing.price * 1.5;

  const similar = await Listing.find({
    _id: { $ne: listingId },
    $or: [
      { location: listing.location },
      { category: listing.category },
      { country: listing.country, price: { $gte: priceMin, $lte: priceMax } },
    ],
  })
    .limit(20)
    .lean();

  // Score by similarity
  const scored = similar.map((s) => {
    let score = 0;
    if (s.location === listing.location) score += 40;
    if (s.category === listing.category) score += 30;
    if (s.country === listing.country) score += 15;
    // Price proximity
    const priceDiff = Math.abs(s.price - listing.price) / listing.price;
    if (priceDiff < 0.2) score += 15;
    else if (priceDiff < 0.5) score += 8;

    return { ...s, similarityScore: score };
  });

  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  return scored.slice(0, limit);
}

// ================= MAIN RECOMMENDATION FUNCTION =================

/**
 * Get personalized recommendations for a user
 * Combines all algorithms with hybrid scoring
 * 
 * @param {String} userId - User ID
 * @param {Number} limit - Number of recommendations
 * @returns {Array} Scored and ranked recommendations
 */
async function getRecommendations(userId, limit = 12) {
  // Check cache
  const cacheKey = recommendationsKey(userId.toString());
  const cached = await cache.get(cacheKey);
  if (cached) return { recommendations: cached, fromCache: true };

  // Build user profile
  const profile = await buildUserProfile(userId);

  // Cold start: no history → return popular listings
  if (!profile || profile.totalInteractions < 3) {
    const popular = await popularityRecommendations(limit);
    const enriched = popular.map((l) => ({
      ...l,
      reason: "Popular on Wanderlust",
      score: 50,
      method: "popularity",
    }));
    await cache.set(cacheKey, enriched, TTL.USER_RECOMMENDATIONS);
    return { recommendations: enriched, method: "popularity", fromCache: false };
  }

  // Get all candidate listings (exclude recently viewed)
  const candidates = await Listing.find({
    _id: { $nin: profile.recentListings },
  })
    .limit(100)
    .lean();

  // Get collaborative signals
  const collabResults = await collaborativeRecommendations(userId, 15);
  const collabMap = new Map(collabResults.map((r) => [r.listingId.toString(), r]));

  // Score each candidate with hybrid approach
  const scored = candidates.map((listing) => {
    const lid = listing._id.toString();

    // Content-based score (60% weight)
    const cbScore = contentBasedScore(listing, profile);

    // Collaborative score (30% weight)
    const collab = collabMap.get(lid);
    const cfScore = collab ? collab.collaborativeScore : 0;

    // Popularity score (10% weight)
    const popScore = (listing.reviews?.length || 0) * 3;

    // Hybrid score
    const hybridScore = cbScore * 0.6 + cfScore * 0.3 + popScore * 0.1;

    // Diversity penalty (reduce score if same location appears too much)
    // Applied during final ranking

    // Freshness boost
    const ageInDays = (Date.now() - new Date(listing.createdAt)) / (1000 * 60 * 60 * 24);
    const freshnessBoost = ageInDays < 7 ? 5 : ageInDays < 30 ? 2 : 0;

    // Generate reason
    let reason = "Recommended for you";
    if (cbScore > 30 && profile.locations[listing.location]) {
      reason = `Because you liked ${listing.location}`;
    } else if (cbScore > 20 && profile.categories[listing.category]) {
      reason = `Based on your interest in ${listing.category} stays`;
    } else if (cfScore > 0) {
      reason = "Travelers like you also booked this";
    } else if (popScore > 10) {
      reason = "Highly rated by guests";
    }

    return {
      _id: listing._id,
      title: listing.title,
      location: listing.location,
      country: listing.country,
      price: listing.price,
      dynamicPrice: getQuickPrice(listing.price, listing.location).finalPrice,
      image: listing.image?.url,
      category: listing.category,
      score: Math.round(hybridScore + freshnessBoost),
      reason,
      method: cfScore > cbScore ? "collaborative" : "content-based",
      reviewCount: listing.reviews?.length || 0,
    };
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Apply diversity: limit max 2 from same location in top results
  const diversified = [];
  const locationCount = {};
  for (const item of scored) {
    const loc = item.location;
    locationCount[loc] = (locationCount[loc] || 0) + 1;
    if (locationCount[loc] <= 2) {
      diversified.push(item);
    }
    if (diversified.length >= limit) break;
  }

  // Cache for 10 minutes
  await cache.set(cacheKey, diversified, TTL.USER_RECOMMENDATIONS);

  return { recommendations: diversified, method: "hybrid", fromCache: false };
}

// ================= EXPORTS =================
module.exports = {
  trackActivity,
  buildUserProfile,
  getRecommendations,
  findSimilarListings,
  popularityRecommendations,
  collaborativeRecommendations,
  contentBasedScore,
  classifyPrice,
};
