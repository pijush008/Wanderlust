/**
 * ================= SMART TRIP PLANNER ENGINE =================
 * 
 * Architecture:
 *   Trip Planner Service
 *     ├── Location Engine      — Distance, routes, travel modes
 *     ├── Budget Engine        — Cost allocation, optimization
 *     ├── Recommendation Engine — Stay matching, scoring
 *     └── Itinerary Generator  — Day-wise plan, activities, timeline
 * 
 * Input:
 *   { from: "Kolkata", to: "Goa", budget: 20000, days: 3, tripType: "friends" }
 * 
 * Output:
 *   { stays, itinerary, costBreakdown, travelRoutes, places, tips }
 * 
 * Interview Topics:
 *   - Graph algorithms (shortest path for multi-city routes)
 *   - Recommendation systems (collaborative + content-based filtering)
 *   - Search ranking (weighted scoring for stay recommendations)
 *   - Budget optimization (knapsack-like allocation)
 */

const Listing = require("../models/listing");
const { getQuickPrice } = require("./pricingEngine");

// ================= LOCATION DATABASE =================
// Pre-computed distances and travel info between major Indian cities
const TRAVEL_DATA = {
  // [from][to] = { distance_km, travel_modes: [{ mode, duration, cost }] }
  delhi: {
    goa: { distance: 1870, modes: [{ mode: "flight", duration: "2h 30m", cost: 4500 }, { mode: "train", duration: "26h", cost: 1200 }, { mode: "bus", duration: "28h", cost: 1500 }] },
    manali: { distance: 530, modes: [{ mode: "bus", duration: "12h", cost: 800 }, { mode: "car", duration: "10h", cost: 3000 }] },
    jaipur: { distance: 280, modes: [{ mode: "train", duration: "4h 30m", cost: 500 }, { mode: "bus", duration: "5h", cost: 600 }, { mode: "car", duration: "4h", cost: 2000 }] },
    rishikesh: { distance: 230, modes: [{ mode: "bus", duration: "6h", cost: 500 }, { mode: "car", duration: "5h", cost: 2500 }] },
    udaipur: { distance: 660, modes: [{ mode: "flight", duration: "1h 30m", cost: 3500 }, { mode: "train", duration: "12h", cost: 800 }] },
    mumbai: { distance: 1400, modes: [{ mode: "flight", duration: "2h", cost: 4000 }, { mode: "train", duration: "16h", cost: 1000 }] },
  },
  kolkata: {
    goa: { distance: 1870, modes: [{ mode: "flight", duration: "2h 45m", cost: 5000 }, { mode: "train", duration: "32h", cost: 1500 }] },
    darjeeling: { distance: 600, modes: [{ mode: "train", duration: "10h", cost: 600 }, { mode: "car", duration: "10h", cost: 3500 }] },
    manali: { distance: 1800, modes: [{ mode: "flight", duration: "3h", cost: 5500 }, { mode: "train", duration: "30h", cost: 1800 }] },
    puri: { distance: 500, modes: [{ mode: "train", duration: "7h", cost: 400 }, { mode: "bus", duration: "8h", cost: 500 }] },
    mumbai: { distance: 2000, modes: [{ mode: "flight", duration: "2h 30m", cost: 4500 }, { mode: "train", duration: "26h", cost: 1200 }] },
    jaipur: { distance: 1500, modes: [{ mode: "flight", duration: "2h 15m", cost: 4000 }, { mode: "train", duration: "20h", cost: 1100 }] },
  },
  mumbai: {
    goa: { distance: 590, modes: [{ mode: "flight", duration: "1h", cost: 3000 }, { mode: "train", duration: "8h", cost: 600 }, { mode: "bus", duration: "10h", cost: 800 }] },
    udaipur: { distance: 660, modes: [{ mode: "flight", duration: "1h 30m", cost: 3500 }, { mode: "train", duration: "12h", cost: 700 }] },
    jaipur: { distance: 1150, modes: [{ mode: "flight", duration: "1h 45m", cost: 3800 }, { mode: "train", duration: "16h", cost: 900 }] },
    manali: { distance: 1950, modes: [{ mode: "flight", duration: "3h", cost: 5500 }, { mode: "train", duration: "28h", cost: 1500 }] },
    pondicherry: { distance: 1300, modes: [{ mode: "flight", duration: "2h", cost: 4000 }, { mode: "train", duration: "20h", cost: 1000 }] },
  },
  bangalore: {
    goa: { distance: 560, modes: [{ mode: "flight", duration: "1h", cost: 2800 }, { mode: "train", duration: "10h", cost: 600 }, { mode: "bus", duration: "10h", cost: 700 }] },
    ooty: { distance: 270, modes: [{ mode: "bus", duration: "6h", cost: 500 }, { mode: "car", duration: "5h", cost: 2500 }] },
    coorg: { distance: 250, modes: [{ mode: "bus", duration: "5h", cost: 400 }, { mode: "car", duration: "4h 30m", cost: 2200 }] },
    pondicherry: { distance: 310, modes: [{ mode: "bus", duration: "6h", cost: 500 }, { mode: "car", duration: "5h", cost: 2500 }] },
    alleppey: { distance: 560, modes: [{ mode: "train", duration: "10h", cost: 600 }, { mode: "bus", duration: "12h", cost: 700 }] },
  },
  chennai: {
    pondicherry: { distance: 150, modes: [{ mode: "bus", duration: "3h", cost: 250 }, { mode: "car", duration: "2h 30m", cost: 1500 }] },
    ooty: { distance: 560, modes: [{ mode: "bus", duration: "10h", cost: 600 }, { mode: "train", duration: "8h", cost: 500 }] },
    alleppey: { distance: 700, modes: [{ mode: "train", duration: "12h", cost: 700 }, { mode: "flight", duration: "1h 30m", cost: 3500 }] },
    goa: { distance: 680, modes: [{ mode: "flight", duration: "1h 15m", cost: 3200 }, { mode: "train", duration: "12h", cost: 700 }] },
  },
};

// ================= PLACES TO VISIT DATABASE =================
const PLACES_DB = {
  goa: [
    { name: "Baga Beach", type: "beach", duration: "3h", cost: 0, bestFor: ["friends", "couple"] },
    { name: "Dudhsagar Falls", type: "nature", duration: "6h", cost: 500, bestFor: ["friends", "family", "adventure"] },
    { name: "Fort Aguada", type: "heritage", duration: "2h", cost: 50, bestFor: ["family", "solo", "couple"] },
    { name: "Anjuna Flea Market", type: "shopping", duration: "3h", cost: 200, bestFor: ["friends", "solo"] },
    { name: "Tito's Lane", type: "nightlife", duration: "4h", cost: 1500, bestFor: ["friends", "couple"] },
    { name: "Old Goa Churches", type: "heritage", duration: "2h", cost: 0, bestFor: ["family", "solo"] },
    { name: "Palolem Beach", type: "beach", duration: "4h", cost: 0, bestFor: ["couple", "solo"] },
    { name: "Spice Plantation Tour", type: "nature", duration: "3h", cost: 400, bestFor: ["family", "couple"] },
  ],
  manali: [
    { name: "Rohtang Pass", type: "adventure", duration: "6h", cost: 800, bestFor: ["friends", "adventure"] },
    { name: "Solang Valley", type: "adventure", duration: "4h", cost: 500, bestFor: ["friends", "family", "adventure"] },
    { name: "Hadimba Temple", type: "heritage", duration: "1h", cost: 0, bestFor: ["family", "solo"] },
    { name: "Old Manali", type: "culture", duration: "3h", cost: 200, bestFor: ["friends", "solo", "couple"] },
    { name: "Jogini Waterfall Trek", type: "trek", duration: "4h", cost: 0, bestFor: ["friends", "adventure", "solo"] },
    { name: "Mall Road", type: "shopping", duration: "2h", cost: 300, bestFor: ["friends", "family"] },
  ],
  jaipur: [
    { name: "Amber Fort", type: "heritage", duration: "3h", cost: 200, bestFor: ["family", "couple", "solo"] },
    { name: "Hawa Mahal", type: "heritage", duration: "1h", cost: 50, bestFor: ["family", "solo"] },
    { name: "City Palace", type: "heritage", duration: "2h", cost: 300, bestFor: ["family", "couple"] },
    { name: "Nahargarh Fort", type: "heritage", duration: "2h", cost: 100, bestFor: ["friends", "couple"] },
    { name: "Johari Bazaar", type: "shopping", duration: "3h", cost: 500, bestFor: ["friends", "family"] },
    { name: "Chokhi Dhani", type: "culture", duration: "4h", cost: 800, bestFor: ["friends", "family"] },
  ],
  udaipur: [
    { name: "Lake Pichola Boat Ride", type: "nature", duration: "2h", cost: 400, bestFor: ["couple", "family"] },
    { name: "City Palace", type: "heritage", duration: "3h", cost: 300, bestFor: ["family", "solo"] },
    { name: "Sajjangarh Palace", type: "heritage", duration: "2h", cost: 100, bestFor: ["couple", "friends"] },
    { name: "Fateh Sagar Lake", type: "nature", duration: "2h", cost: 0, bestFor: ["couple", "family", "friends"] },
  ],
  rishikesh: [
    { name: "River Rafting", type: "adventure", duration: "3h", cost: 1000, bestFor: ["friends", "adventure"] },
    { name: "Bungee Jumping", type: "adventure", duration: "2h", cost: 3500, bestFor: ["friends", "adventure"] },
    { name: "Laxman Jhula", type: "heritage", duration: "1h", cost: 0, bestFor: ["family", "solo"] },
    { name: "Beatles Ashram", type: "culture", duration: "2h", cost: 150, bestFor: ["solo", "friends"] },
    { name: "Triveni Ghat Aarti", type: "spiritual", duration: "1h", cost: 0, bestFor: ["family", "solo"] },
  ],
  darjeeling: [
    { name: "Tiger Hill Sunrise", type: "nature", duration: "3h", cost: 200, bestFor: ["family", "couple", "solo"] },
    { name: "Toy Train Ride", type: "experience", duration: "2h", cost: 300, bestFor: ["family", "couple"] },
    { name: "Tea Garden Visit", type: "nature", duration: "2h", cost: 100, bestFor: ["family", "couple", "solo"] },
    { name: "Batasia Loop", type: "nature", duration: "1h", cost: 0, bestFor: ["family", "friends"] },
  ],
  mumbai: [
    { name: "Gateway of India", type: "heritage", duration: "1h", cost: 0, bestFor: ["family", "solo", "friends"] },
    { name: "Marine Drive", type: "nature", duration: "2h", cost: 0, bestFor: ["couple", "friends", "solo"] },
    { name: "Elephanta Caves", type: "heritage", duration: "4h", cost: 500, bestFor: ["family", "solo"] },
    { name: "Street Food Tour", type: "food", duration: "3h", cost: 500, bestFor: ["friends", "solo"] },
  ],
  alleppey: [
    { name: "Houseboat Cruise", type: "experience", duration: "8h", cost: 3000, bestFor: ["couple", "family"] },
    { name: "Alleppey Beach", type: "beach", duration: "2h", cost: 0, bestFor: ["family", "couple"] },
    { name: "Backwater Kayaking", type: "adventure", duration: "3h", cost: 800, bestFor: ["friends", "adventure"] },
  ],
  ooty: [
    { name: "Botanical Garden", type: "nature", duration: "2h", cost: 50, bestFor: ["family", "couple"] },
    { name: "Ooty Lake Boating", type: "nature", duration: "1h", cost: 200, bestFor: ["family", "couple"] },
    { name: "Doddabetta Peak", type: "nature", duration: "2h", cost: 0, bestFor: ["friends", "family"] },
    { name: "Tea Factory Visit", type: "experience", duration: "1h", cost: 100, bestFor: ["family", "solo"] },
  ],
};

// ================= TRIP TYPE PREFERENCES =================
const TRIP_PREFERENCES = {
  friends: { nightlife: 1.5, adventure: 1.5, food: 1.3, shopping: 1.2, heritage: 0.8 },
  couple: { nature: 1.5, heritage: 1.3, food: 1.3, nightlife: 1.0, adventure: 0.8 },
  family: { heritage: 1.5, nature: 1.3, shopping: 1.2, adventure: 0.7, nightlife: 0.3 },
  solo: { adventure: 1.5, culture: 1.5, nature: 1.3, food: 1.2, nightlife: 0.8 },
  adventure: { adventure: 2.0, trek: 1.8, nature: 1.5, heritage: 0.7, shopping: 0.5 },
};

// ================= BUDGET ENGINE =================

/**
 * Allocate budget across categories
 * Uses weighted distribution based on trip type
 */
function allocateBudget(totalBudget, days, travelers, tripType) {
  // Base allocation percentages
  const allocations = {
    friends: { travel: 0.30, stay: 0.30, food: 0.20, activities: 0.15, misc: 0.05 },
    couple: { travel: 0.25, stay: 0.40, food: 0.20, activities: 0.10, misc: 0.05 },
    family: { travel: 0.30, stay: 0.35, food: 0.20, activities: 0.10, misc: 0.05 },
    solo: { travel: 0.30, stay: 0.25, food: 0.20, activities: 0.20, misc: 0.05 },
    adventure: { travel: 0.25, stay: 0.25, food: 0.15, activities: 0.30, misc: 0.05 },
  };

  const alloc = allocations[tripType] || allocations.friends;
  const perPerson = totalBudget / (travelers || 1);

  return {
    total: totalBudget,
    perPerson: Math.round(perPerson),
    travel: Math.round(totalBudget * alloc.travel),
    stay: Math.round(totalBudget * alloc.stay),
    food: Math.round(totalBudget * alloc.food),
    activities: Math.round(totalBudget * alloc.activities),
    misc: Math.round(totalBudget * alloc.misc),
    perDay: Math.round(totalBudget / days),
    stayPerNight: Math.round((totalBudget * alloc.stay) / days),
  };
}

// ================= LOCATION ENGINE =================

/**
 * Get travel options between two cities
 */
function getTravelOptions(from, to) {
  const fromKey = from.toLowerCase().trim();
  const toKey = to.toLowerCase().trim();

  // Direct route
  if (TRAVEL_DATA[fromKey] && TRAVEL_DATA[fromKey][toKey]) {
    return TRAVEL_DATA[fromKey][toKey];
  }

  // Reverse lookup
  if (TRAVEL_DATA[toKey] && TRAVEL_DATA[toKey][fromKey]) {
    return TRAVEL_DATA[toKey][fromKey];
  }

  // Generic estimate based on distance
  return {
    distance: null,
    modes: [
      { mode: "flight", duration: "2-3h", cost: 4000 },
      { mode: "train", duration: "12-20h", cost: 1000 },
      { mode: "bus", duration: "15-24h", cost: 800 },
    ],
  };
}

/**
 * Recommend best travel mode based on budget and time
 */
function recommendTravelMode(travelOptions, budget, days) {
  if (!travelOptions.modes || travelOptions.modes.length === 0) return null;

  // If short trip (1-2 days), prefer fastest
  if (days <= 2) {
    return travelOptions.modes[0]; // Usually flight
  }

  // If budget is tight, prefer cheapest
  const sorted = [...travelOptions.modes].sort((a, b) => a.cost - b.cost);
  if (budget < 5000) return sorted[0];

  // Otherwise, best value (cost/time ratio)
  return travelOptions.modes.length > 1 ? travelOptions.modes[1] : travelOptions.modes[0];
}

// ================= RECOMMENDATION ENGINE =================

/**
 * Find best stays at destination within budget
 */
async function recommendStays(destination, budgetPerNight, days, tripType) {
  const regex = new RegExp(destination.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  let listings = await Listing.find({
    $or: [{ location: regex }, { country: regex }],
  }).lean();

  if (listings.length === 0) {
    // Fallback: search in title/description
    listings = await Listing.find({
      $or: [{ title: regex }, { description: regex }],
    }).lean();
  }

  // Score and filter by budget
  const scored = listings.map((listing) => {
    const pricing = getQuickPrice(listing.price, listing.location);
    let score = 50; // Base score

    // Budget fit (higher score if within budget)
    if (pricing.finalPrice <= budgetPerNight) score += 30;
    else if (pricing.finalPrice <= budgetPerNight * 1.2) score += 15;
    else score -= 20;

    // Trip type matching
    if (tripType === "family" && listing.familyFriendly?.childSafe) score += 20;
    if (tripType === "friends" && listing.maxGuests >= 4) score += 15;
    if (tripType === "couple" && listing.price >= 2000) score += 10;
    if (tripType === "adventure" && listing.category === "camping") score += 20;

    // Reviews boost
    if (listing.reviews?.length > 3) score += 10;

    // Instant book bonus
    if (listing.instantBook) score += 5;

    // Flexible cancellation bonus
    if (listing.cancellationPolicy === "flexible") score += 5;

    return {
      _id: listing._id,
      title: listing.title,
      location: listing.location,
      basePrice: listing.price,
      dynamicPrice: pricing.finalPrice,
      totalCost: pricing.finalPrice * days,
      image: listing.image?.url,
      score,
      withinBudget: pricing.finalPrice <= budgetPerNight,
      familyFriendly: listing.familyFriendly?.childSafe || false,
      petFriendly: listing.petFriendly?.allowed || false,
      instantBook: listing.instantBook || false,
      cancellation: listing.cancellationPolicy || "moderate",
    };
  });

  // Sort by score, return top 5
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}

// ================= ITINERARY GENERATOR =================

/**
 * Generate day-wise itinerary
 */
function generateItinerary(destination, days, tripType, places) {
  const destKey = destination.toLowerCase().trim();
  const availablePlaces = places || PLACES_DB[destKey] || [];

  if (availablePlaces.length === 0) {
    return generateGenericItinerary(destination, days, tripType);
  }

  // Score places by trip type preference
  const prefs = TRIP_PREFERENCES[tripType] || TRIP_PREFERENCES.friends;
  const scoredPlaces = availablePlaces.map((place) => {
    let score = 1;
    if (prefs[place.type]) score *= prefs[place.type];
    if (place.bestFor && place.bestFor.includes(tripType)) score *= 1.5;
    return { ...place, score };
  });

  scoredPlaces.sort((a, b) => b.score - a.score);

  // Distribute places across days
  const itinerary = [];
  let placeIndex = 0;

  for (let day = 1; day <= days; day++) {
    const dayPlan = {
      day,
      title: day === 1 ? "Arrival & Explore" : day === days ? "Last Day & Departure" : `Day ${day} — Adventure`,
      activities: [],
      estimatedCost: 0,
    };

    // Morning activity
    if (placeIndex < scoredPlaces.length) {
      const place = scoredPlaces[placeIndex++];
      dayPlan.activities.push({ time: "9:00 AM", ...place, period: "morning" });
      dayPlan.estimatedCost += place.cost;
    }

    // Afternoon activity
    if (placeIndex < scoredPlaces.length) {
      const place = scoredPlaces[placeIndex++];
      dayPlan.activities.push({ time: "2:00 PM", ...place, period: "afternoon" });
      dayPlan.estimatedCost += place.cost;
    }

    // Evening activity (not on last day)
    if (day < days && placeIndex < scoredPlaces.length) {
      const place = scoredPlaces[placeIndex++];
      dayPlan.activities.push({ time: "6:00 PM", ...place, period: "evening" });
      dayPlan.estimatedCost += place.cost;
    }

    // Add food estimate
    dayPlan.estimatedCost += tripType === "friends" ? 800 : tripType === "couple" ? 1200 : 1000;
    dayPlan.foodBudget = tripType === "friends" ? 800 : tripType === "couple" ? 1200 : 1000;

    itinerary.push(dayPlan);
  }

  return itinerary;
}

function generateGenericItinerary(destination, days, tripType) {
  const itinerary = [];
  for (let day = 1; day <= days; day++) {
    itinerary.push({
      day,
      title: day === 1 ? "Arrival & Local Exploration" : day === days ? "Departure Day" : `Day ${day} — Explore ${destination}`,
      activities: [
        { time: "9:00 AM", name: `Explore local attractions in ${destination}`, type: "sightseeing", duration: "3h", cost: 200, period: "morning" },
        { time: "1:00 PM", name: "Local cuisine experience", type: "food", duration: "1h", cost: 500, period: "afternoon" },
        { time: "3:00 PM", name: "Visit popular spots", type: "sightseeing", duration: "3h", cost: 300, period: "afternoon" },
      ],
      estimatedCost: 1500,
      foodBudget: 800,
    });
  }
  return itinerary;
}

// ================= MAIN PLANNER FUNCTION =================

/**
 * Generate complete trip plan
 * 
 * @param {Object} input
 * @param {String} input.from - Origin city
 * @param {String} input.to - Destination city
 * @param {Number} input.budget - Total budget in ₹
 * @param {Number} input.days - Number of days
 * @param {String} input.tripType - friends | couple | family | solo | adventure
 * @param {Number} input.travelers - Number of travelers
 * @returns {Object} Complete trip plan
 */
async function planTrip(input) {
  const { from, to, budget, days, tripType = "friends", travelers = 2 } = input;

  // 1. Budget allocation
  const budgetPlan = allocateBudget(budget, days, travelers, tripType);

  // 2. Travel options
  const travelOptions = getTravelOptions(from, to);
  const recommendedMode = recommendTravelMode(travelOptions, budgetPlan.travel, days);

  // 3. Stay recommendations
  const stays = await recommendStays(to, budgetPlan.stayPerNight, days, tripType);

  // 4. Places to visit
  const destKey = to.toLowerCase().trim();
  const allPlaces = PLACES_DB[destKey] || [];

  // 5. Generate itinerary
  const itinerary = generateItinerary(to, days, tripType, allPlaces);

  // 6. Calculate total estimated cost
  const travelCost = recommendedMode ? recommendedMode.cost * 2 * travelers : budgetPlan.travel;
  const stayCost = stays.length > 0 ? stays[0].totalCost : budgetPlan.stay;
  const activityCost = itinerary.reduce((sum, day) => sum + day.estimatedCost, 0);
  const totalEstimated = travelCost + stayCost + activityCost;

  // 7. Tips based on trip type
  const tips = generateTips(to, tripType, days, budget);

  return {
    summary: {
      from,
      to,
      days,
      travelers,
      tripType,
      budget,
      totalEstimated,
      withinBudget: totalEstimated <= budget,
      savings: budget - totalEstimated,
    },
    travel: {
      distance: travelOptions.distance,
      allModes: travelOptions.modes,
      recommended: recommendedMode,
      roundTripCost: recommendedMode ? recommendedMode.cost * 2 * travelers : null,
    },
    budgetBreakdown: budgetPlan,
    stays,
    itinerary,
    places: allPlaces.map((p) => ({
      ...p,
      recommended: p.bestFor?.includes(tripType),
    })),
    tips,
    generatedAt: new Date().toISOString(),
  };
}

// ================= TIPS GENERATOR =================
function generateTips(destination, tripType, days, budget) {
  const tips = [];
  const dest = destination.toLowerCase();

  if (days <= 2) tips.push("💡 Short trip — prioritize top attractions and skip long travel activities.");
  if (budget < 10000) tips.push("💰 Budget tip: Book trains/buses early for cheapest fares.");
  if (tripType === "friends") tips.push("🎉 Friends trip: Split costs on stays and cabs to save more.");
  if (tripType === "couple") tips.push("💕 Couple tip: Book stays with lake/mountain views for the best experience.");
  if (tripType === "family") tips.push("👨‍👩‍👧 Family tip: Look for stays with kitchen access to save on food.");

  if (dest === "goa") {
    tips.push("🏖️ Best time: Nov-Feb. Avoid monsoon (Jun-Sep).");
    tips.push("🛵 Rent a scooter (₹300/day) — cheapest way to explore.");
  }
  if (dest === "manali") {
    tips.push("🏔️ Best time: Mar-Jun & Oct-Dec. Roads may close in heavy snow.");
    tips.push("🧥 Pack warm layers even in summer — nights are cold.");
  }
  if (dest === "jaipur") {
    tips.push("🏰 Buy a composite ticket for all forts — saves ₹500+.");
  }

  tips.push("📱 Download offline maps — network can be patchy in remote areas.");

  return tips;
}

// ================= EXPORTS =================
module.exports = {
  planTrip,
  allocateBudget,
  getTravelOptions,
  recommendStays,
  generateItinerary,
  PLACES_DB,
  TRAVEL_DATA,
};
