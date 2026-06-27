const Listing = require("../models/listing");
const { cache, TTL, searchKey, autocompleteKey, trendingKey } = require("../utils/cache");

// ================= HELPER: Build Fuzzy Regex =================
// Generates a regex that tolerates typos (character transpositions, missing/extra chars)
function buildFuzzyRegex(query) {
  // Escape special regex characters
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Allow optional characters between each letter for typo tolerance
  const fuzzy = escaped.split("").join("\\w{0,1}");
  return new RegExp(fuzzy, "i");
}

// ================= HELPER: Calculate Relevance Score =================
function calculateScore(listing, query) {
  const q = query.toLowerCase();
  let score = 0;

  // Exact match in title (highest weight)
  if (listing.title.toLowerCase() === q) score += 100;
  // Title starts with query
  else if (listing.title.toLowerCase().startsWith(q)) score += 80;
  // Title contains query
  else if (listing.title.toLowerCase().includes(q)) score += 60;

  // Location exact match
  if (listing.location.toLowerCase() === q) score += 90;
  // Location starts with query
  else if (listing.location.toLowerCase().startsWith(q)) score += 70;
  // Location contains query
  else if (listing.location.toLowerCase().includes(q)) score += 50;

  // Country match
  if (listing.country.toLowerCase().includes(q)) score += 40;

  // Description match (lower weight)
  if (listing.description.toLowerCase().includes(q)) score += 20;

  // Boost newer listings slightly
  if (listing.createdAt) {
    const ageInDays = (Date.now() - new Date(listing.createdAt)) / (1000 * 60 * 60 * 24);
    if (ageInDays < 7) score += 15;
    else if (ageInDays < 30) score += 10;
  }

  // Boost listings with more reviews
  if (listing.reviews && listing.reviews.length > 0) {
    score += Math.min(listing.reviews.length * 3, 15);
  }

  return score;
}

// ================= MAIN SEARCH =================
module.exports.search = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.redirect("/listings");
  }

  const query = q.trim();
  
  // Check cache first
  const cacheKey = searchKey(query);
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.render("listings/search", { results: cached, query, fromCache: true });
  }

  let results = [];

  try {
    // Strategy 1: MongoDB Text Search (best for multi-word queries)
    const textResults = await Listing.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } }).limit(50);

    if (textResults.length > 0) {
      results = textResults;
    }

    // Strategy 2: Fuzzy Regex Search (handles typos)
    if (results.length < 5) {
      const fuzzyRegex = buildFuzzyRegex(query);
      const regexResults = await Listing.find({
        $or: [
          { title: fuzzyRegex },
          { location: fuzzyRegex },
          { country: fuzzyRegex },
          { description: fuzzyRegex },
        ],
      }).limit(50);

      // Merge without duplicates
      const existingIds = new Set(results.map((r) => r._id.toString()));
      for (const item of regexResults) {
        if (!existingIds.has(item._id.toString())) {
          results.push(item);
        }
      }
    }

    // Strategy 3: Partial match (prefix search)
    if (results.length < 3) {
      const prefixRegex = new RegExp("^" + query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const prefixResults = await Listing.find({
        $or: [
          { title: prefixRegex },
          { location: prefixRegex },
          { country: prefixRegex },
        ],
      }).limit(20);

      const existingIds = new Set(results.map((r) => r._id.toString()));
      for (const item of prefixResults) {
        if (!existingIds.has(item._id.toString())) {
          results.push(item);
        }
      }
    }

    // Rank results by relevance score
    results.sort((a, b) => calculateScore(b, query) - calculateScore(a, query));

  } catch (err) {
    console.error("Search error:", err);
    // Fallback: simple regex
    const simpleRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    results = await Listing.find({
      $or: [
        { title: simpleRegex },
        { location: simpleRegex },
        { country: simpleRegex },
      ],
    }).limit(30);
  }

  // Cache the results
  await cache.set(cacheKey, results, TTL.SEARCH_RESULTS);

  res.render("listings/search", { results, query, fromCache: false });
};

// ================= AUTOCOMPLETE API =================
module.exports.autocomplete = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 1) {
    return res.json({ suggestions: [] });
  }

  const query = q.trim();
  
  // Check cache
  const cacheKey = autocompleteKey(query);
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json({ suggestions: cached, fromCache: true });
  }

  const regex = new RegExp("^" + query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const fuzzyRegex = buildFuzzyRegex(query);

  try {
    // Get location suggestions
    const locationMatches = await Listing.aggregate([
      { $match: { $or: [{ location: regex }, { location: fuzzyRegex }] } },
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Get country suggestions
    const countryMatches = await Listing.aggregate([
      { $match: { $or: [{ country: regex }, { country: fuzzyRegex }] } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    // Get title suggestions
    const titleMatches = await Listing.find({
      $or: [{ title: regex }, { title: fuzzyRegex }],
    })
      .select("title location _id")
      .limit(5);

    // Build suggestions array
    const suggestions = [];

    // Locations first (most relevant for travel)
    for (const loc of locationMatches) {
      suggestions.push({
        type: "location",
        text: loc._id,
        count: loc.count,
        icon: "fa-location-dot",
      });
    }

    // Countries
    for (const country of countryMatches) {
      suggestions.push({
        type: "country",
        text: country._id,
        count: country.count,
        icon: "fa-globe",
      });
    }

    // Titles
    for (const listing of titleMatches) {
      suggestions.push({
        type: "listing",
        text: listing.title,
        subtext: listing.location,
        id: listing._id,
        icon: "fa-house",
      });
    }

    // Deduplicate and limit
    const seen = new Set();
    const unique = suggestions.filter((s) => {
      const key = s.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const finalSuggestions = unique.slice(0, 8);
    
    // Cache suggestions
    await cache.set(cacheKey, finalSuggestions, TTL.AUTOCOMPLETE);

    res.json({ suggestions: finalSuggestions });
  } catch (err) {
    console.error("Autocomplete error:", err);
    res.json({ suggestions: [] });
  }
};

// ================= TRENDING LOCATIONS =================
module.exports.trending = async (req, res) => {
  try {
    // Check cache (trending is expensive aggregation)
    const cacheKey = trendingKey();
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ trending: cached, fromCache: true });
    }

    const trending = await Listing.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 }, country: { $first: "$country" } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // Cache for 5 minutes
    await cache.set(cacheKey, trending, TTL.TRENDING);

    res.json({ trending });
  } catch (err) {
    console.error("Trending error:", err);
    res.json({ trending: [] });
  }
};
