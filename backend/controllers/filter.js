/**
 * ================= ADVANCED FILTER CONTROLLER =================
 * 
 * Endpoints:
 *   GET /filter — Advanced search with all filters (renders page)
 *   GET /api/filter — JSON API for AJAX filtering
 *   GET /api/filter/heatmap — Price heatmap data
 *   GET /api/filter/options — Available filter options for UI
 *   GET /api/filter/distribution — Price distribution chart data
 */

const Listing = require("../models/listing");
const { getQuickPrice } = require("../utils/pricingEngine");
const { getCardImage } = require("../utils/imageOptimizer");
const { cache, TTL } = require("../utils/cache");
const {
  buildFilterQuery,
  calculateFamilyScore,
  calculatePetScore,
  generatePriceHeatmap,
  getPriceDistribution,
  getFilterOptions,
} = require("../utils/filterEngine");

// ================= ADVANCED FILTER PAGE =================
module.exports.filterPage = async (req, res) => {
  const filters = req.query;
  const { query, sort, meta } = buildFilterQuery(filters);

  // Build MongoDB query
  let findQuery = Listing.find(query);

  // Add text score if text search
  if (query.$text) {
    findQuery = Listing.find(query, { score: { $meta: "textScore" } });
  }

  // Apply sort
  if (Object.keys(sort).length > 0) {
    findQuery = findQuery.sort(sort);
  }

  // Execute
  let results = await findQuery.limit(100).lean();

  // Post-process: add dynamic pricing + scores + images
  results = results.map((listing) => {
    const pricing = getQuickPrice(listing.price, listing.location);
    const optimizedImage = getCardImage(listing.image?.url || "");
    return {
      ...listing,
      dynamicPrice: pricing.finalPrice,
      priceMultiplier: pricing.multiplier,
      isSurge: pricing.isSurge,
      isDiscount: pricing.isDiscount,
      optimizedImage,
      familyScore: calculateFamilyScore(listing),
      petScore: calculatePetScore(listing),
    };
  });

  // Post-sort by family/pet score if needed
  if (filters.sortBy === "family") {
    results.sort((a, b) => b.familyScore - a.familyScore);
  } else if (filters.sortBy === "pet") {
    results.sort((a, b) => b.petScore - a.petScore);
  }

  // Get filter options for UI
  const filterOptions = await getFilterOptions(Listing);

  res.json({
    results,
    filters,
    meta,
    filterOptions,
  });
};

// ================= FILTER API (JSON) =================
module.exports.filterAPI = async (req, res) => {
  const filters = req.query;
  const cacheKey = "filter:" + JSON.stringify(filters);

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json({ ...cached, fromCache: true });
  }

  const { query, sort, meta } = buildFilterQuery(filters);

  let findQuery = Listing.find(query);
  if (query.$text) {
    findQuery = Listing.find(query, { score: { $meta: "textScore" } });
  }
  if (Object.keys(sort).length > 0) {
    findQuery = findQuery.sort(sort);
  }

  let results = await findQuery.limit(100).lean();

  // Enrich results
  results = results.map((listing) => {
    const pricing = getQuickPrice(listing.price, listing.location);
    return {
      _id: listing._id,
      title: listing.title,
      location: listing.location,
      country: listing.country,
      price: listing.price,
      dynamicPrice: pricing.finalPrice,
      isSurge: pricing.isSurge,
      isDiscount: pricing.isDiscount,
      image: listing.image?.url,
      category: listing.category,
      cancellationPolicy: listing.cancellationPolicy,
      instantBook: listing.instantBook,
      familyScore: calculateFamilyScore(listing),
      petScore: calculatePetScore(listing),
      maxGuests: listing.maxGuests,
    };
  });

  if (filters.sortBy === "family") {
    results.sort((a, b) => b.familyScore - a.familyScore);
  } else if (filters.sortBy === "pet") {
    results.sort((a, b) => b.petScore - a.petScore);
  }

  const response = { results, meta, total: results.length };

  // Cache for 60s
  await cache.set(cacheKey, response, TTL.SEARCH_RESULTS);

  res.json(response);
};

// ================= PRICE HEATMAP =================
module.exports.priceHeatmap = async (req, res) => {
  const cacheKey = "heatmap:all";
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json({ heatmap: cached, fromCache: true });
  }

  const listings = await Listing.find({}).select("price location country geometry").lean();
  const heatmap = generatePriceHeatmap(listings);

  await cache.set(cacheKey, heatmap, TTL.TRENDING);

  res.json({ heatmap });
};

// ================= FILTER OPTIONS =================
module.exports.filterOptionsAPI = async (req, res) => {
  const cacheKey = "filter:options";
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const options = await getFilterOptions(Listing);

  await cache.set(cacheKey, options, TTL.TRENDING);

  res.json(options);
};

// ================= PRICE DISTRIBUTION =================
module.exports.priceDistribution = async (req, res) => {
  const cacheKey = "filter:distribution";
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json({ distribution: cached, fromCache: true });
  }

  const listings = await Listing.find({}).select("price").lean();
  const distribution = getPriceDistribution(listings);

  await cache.set(cacheKey, distribution, TTL.TRENDING);

  res.json({ distribution });
};
