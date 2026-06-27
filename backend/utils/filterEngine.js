/**
 * ================= ADVANCED SEARCH FILTER ENGINE =================
 * 
 * Features:
 *   1. Price Heatmap — visual price distribution across locations
 *   2. Cancellation Flexibility — filter by policy type
 *   3. Instant Booking — no host approval needed
 *   4. Family-Friendly Ranking — scored based on child-safe features
 *   5. Pet-Friendly Scoring — scored based on pet amenities
 *   6. Multi-filter combination — all filters work together
 *   7. Sort options — price, rating, family score, pet score
 * 
 * Architecture:
 *   - Query Builder pattern: Each filter adds conditions to a MongoDB query
 *   - Scoring Engine: Computes family/pet scores dynamically
 *   - Heatmap Generator: Aggregates prices by location for visualization
 */

const { getQuickPrice } = require("./pricingEngine");

// ================= FILTER QUERY BUILDER =================

/**
 * Build MongoDB query from filter parameters
 * 
 * @param {Object} filters - Filter parameters from request
 * @returns {Object} { query, sort, meta }
 */
function buildFilterQuery(filters = {}) {
  const {
    q,                    // Text search query
    minPrice,             // Minimum price
    maxPrice,             // Maximum price
    category,             // Listing category
    cancellation,         // flexible | moderate | strict
    instantBook,          // true/false
    familyFriendly,       // true/false
    petFriendly,          // true/false
    minGuests,            // Minimum guest capacity
    location,             // Location filter
    country,              // Country filter
    sortBy,               // price_asc | price_desc | family | pet | newest | rating
    amenities,            // Comma-separated amenities
  } = filters;

  const query = {};
  const sort = {};
  const meta = { filtersApplied: [] };

  // --- Text Search ---
  if (q && q.trim().length > 0) {
    query.$text = { $search: q.trim() };
    meta.filtersApplied.push("text_search");
  }

  // --- Price Range ---
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) {
      query.price.$gte = parseInt(minPrice);
      meta.filtersApplied.push("min_price");
    }
    if (maxPrice) {
      query.price.$lte = parseInt(maxPrice);
      meta.filtersApplied.push("max_price");
    }
  }

  // --- Category ---
  if (category && category !== "all") {
    query.category = category;
    meta.filtersApplied.push("category");
  }

  // --- Cancellation Policy ---
  if (cancellation && cancellation !== "all") {
    query.cancellationPolicy = cancellation;
    meta.filtersApplied.push("cancellation");
  }

  // --- Instant Book ---
  if (instantBook === "true" || instantBook === true) {
    query.instantBook = true;
    meta.filtersApplied.push("instant_book");
  }

  // --- Family Friendly ---
  if (familyFriendly === "true" || familyFriendly === true) {
    query["familyFriendly.childSafe"] = true;
    meta.filtersApplied.push("family_friendly");
  }

  // --- Pet Friendly ---
  if (petFriendly === "true" || petFriendly === true) {
    query["petFriendly.allowed"] = true;
    meta.filtersApplied.push("pet_friendly");
  }

  // --- Min Guests ---
  if (minGuests) {
    query.maxGuests = { $gte: parseInt(minGuests) };
    meta.filtersApplied.push("min_guests");
  }

  // --- Location ---
  if (location) {
    query.location = new RegExp(location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    meta.filtersApplied.push("location");
  }

  // --- Country ---
  if (country) {
    query.country = new RegExp(country.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    meta.filtersApplied.push("country");
  }

  // --- Amenities ---
  if (amenities) {
    const amenityList = amenities.split(",").map((a) => a.trim()).filter(Boolean);
    if (amenityList.length > 0) {
      query.amenities = { $all: amenityList };
      meta.filtersApplied.push("amenities");
    }
  }

  // --- Sort ---
  switch (sortBy) {
    case "price_asc":
      sort.price = 1;
      break;
    case "price_desc":
      sort.price = -1;
      break;
    case "family":
      sort["familyFriendly.familyScore"] = -1;
      break;
    case "pet":
      sort["petFriendly.petScore"] = -1;
      break;
    case "newest":
      sort.createdAt = -1;
      break;
    case "rating":
      sort.reviews = -1; // Will be overridden by post-processing
      break;
    default:
      if (q) {
        sort.score = { $meta: "textScore" };
      } else {
        sort.createdAt = -1;
      }
  }

  meta.totalFilters = meta.filtersApplied.length;
  return { query, sort, meta };
}

// ================= FAMILY-FRIENDLY SCORING =================

/**
 * Calculate family-friendly score for a listing
 * Score 0-100 based on child-safe features
 */
function calculateFamilyScore(listing) {
  let score = 0;

  if (listing.familyFriendly) {
    if (listing.familyFriendly.childSafe) score += 30;
    if (listing.familyFriendly.hasHighChair) score += 15;
    if (listing.familyFriendly.hasCrib) score += 20;
    if (listing.familyFriendly.kidsActivities) score += 20;
  }

  // Bonus for larger capacity
  if (listing.maxGuests >= 6) score += 10;
  else if (listing.maxGuests >= 4) score += 5;

  // Bonus for flexible cancellation (families need flexibility)
  if (listing.cancellationPolicy === "flexible") score += 5;

  return Math.min(score, 100);
}

// ================= PET-FRIENDLY SCORING =================

/**
 * Calculate pet-friendly score for a listing
 * Score 0-100 based on pet amenities
 */
function calculatePetScore(listing) {
  let score = 0;

  if (listing.petFriendly) {
    if (listing.petFriendly.allowed) score += 40;
    if (listing.petFriendly.hasPetBed) score += 20;
    if (listing.petFriendly.hasYard) score += 25;
    if (listing.petFriendly.petFee === 0) score += 15; // No extra fee = bonus
  }

  return Math.min(score, 100);
}

// ================= PRICE HEATMAP GENERATOR =================

/**
 * Generate price heatmap data — aggregates prices by location
 * Returns data for visual price distribution map
 * 
 * @param {Array} listings - All listings (or filtered subset)
 * @returns {Object} Heatmap data with price ranges per location
 */
function generatePriceHeatmap(listings) {
  const locationPrices = {};

  for (const listing of listings) {
    const loc = listing.location;
    if (!locationPrices[loc]) {
      locationPrices[loc] = {
        location: loc,
        country: listing.country,
        prices: [],
        coordinates: listing.geometry?.coordinates || null,
      };
    }
    
    // Use dynamic price
    const dynamicPrice = getQuickPrice(listing.price, loc);
    locationPrices[loc].prices.push(dynamicPrice.finalPrice);
  }

  // Calculate stats per location
  const heatmap = Object.values(locationPrices).map((loc) => {
    const prices = loc.prices;
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    // Determine heat level (for color coding)
    let heatLevel;
    if (avg >= 4000) heatLevel = "very_high";
    else if (avg >= 2500) heatLevel = "high";
    else if (avg >= 1500) heatLevel = "medium";
    else if (avg >= 800) heatLevel = "low";
    else heatLevel = "very_low";

    return {
      location: loc.location,
      country: loc.country,
      coordinates: loc.coordinates,
      listingCount: prices.length,
      avgPrice: avg,
      minPrice: min,
      maxPrice: max,
      heatLevel,
    };
  });

  // Sort by average price descending
  heatmap.sort((a, b) => b.avgPrice - a.avgPrice);

  return heatmap;
}

// ================= PRICE RANGE DISTRIBUTION =================

/**
 * Get price distribution for filter UI (how many listings in each range)
 */
function getPriceDistribution(listings) {
  const ranges = [
    { label: "Under ₹1,000", min: 0, max: 999, count: 0 },
    { label: "₹1,000 – ₹2,000", min: 1000, max: 2000, count: 0 },
    { label: "₹2,000 – ₹3,000", min: 2000, max: 3000, count: 0 },
    { label: "₹3,000 – ₹5,000", min: 3000, max: 5000, count: 0 },
    { label: "Above ₹5,000", min: 5000, max: Infinity, count: 0 },
  ];

  for (const listing of listings) {
    for (const range of ranges) {
      if (listing.price >= range.min && listing.price <= range.max) {
        range.count++;
        break;
      }
    }
  }

  return ranges;
}

// ================= FILTER METADATA =================

/**
 * Get available filter options (for UI dropdowns)
 */
async function getFilterOptions(Listing) {
  const [categories, locations, countries, priceStats] = await Promise.all([
    Listing.distinct("category"),
    Listing.distinct("location"),
    Listing.distinct("country"),
    Listing.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          avgPrice: { $avg: "$price" },
        },
      },
    ]),
  ]);

  return {
    categories: categories.filter(Boolean),
    locations: locations.sort(),
    countries: countries.sort(),
    priceRange: priceStats[0] || { minPrice: 0, maxPrice: 10000, avgPrice: 2000 },
    cancellationPolicies: ["flexible", "moderate", "strict"],
    sortOptions: [
      { value: "relevance", label: "Relevance" },
      { value: "price_asc", label: "Price: Low to High" },
      { value: "price_desc", label: "Price: High to Low" },
      { value: "family", label: "Family-Friendly" },
      { value: "pet", label: "Pet-Friendly" },
      { value: "newest", label: "Newest First" },
    ],
  };
}

// ================= EXPORTS =================
module.exports = {
  buildFilterQuery,
  calculateFamilyScore,
  calculatePetScore,
  generatePriceHeatmap,
  getPriceDistribution,
  getFilterOptions,
};
