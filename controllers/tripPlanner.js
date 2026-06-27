const { planTrip, PLACES_DB, TRAVEL_DATA } = require("../utils/tripPlanner");
const { cache, TTL } = require("../utils/cache");

// ================= TRIP PLANNER PAGE =================
module.exports.plannerPage = (req, res) => {
  const destinations = Object.keys(PLACES_DB).map((d) => d.charAt(0).toUpperCase() + d.slice(1));
  const origins = Object.keys(TRAVEL_DATA).map((d) => d.charAt(0).toUpperCase() + d.slice(1));
  res.render("trips/planner", { destinations, origins });
};

// ================= GENERATE TRIP PLAN =================
module.exports.generatePlan = async (req, res) => {
  const { from, to, budget, days, tripType, travelers } = req.body;

  // Validation
  if (!from || !to || !budget || !days) {
    req.flash("error", "Please fill in all required fields");
    return res.redirect("/trips/plan");
  }

  const input = {
    from: from.trim(),
    to: to.trim(),
    budget: parseInt(budget),
    days: parseInt(days),
    tripType: tripType || "friends",
    travelers: parseInt(travelers) || 2,
  };

  try {
    const plan = await planTrip(input);
    res.render("trips/result", { plan });
  } catch (err) {
    console.error("Trip planner error:", err);
    req.flash("error", "Could not generate trip plan. Please try again.");
    res.redirect("/trips/plan");
  }
};

// ================= API: Generate Plan (JSON) =================
module.exports.generatePlanAPI = async (req, res) => {
  const { from, to, budget, days, tripType, travelers } = req.query;

  if (!from || !to || !budget || !days) {
    return res.status(400).json({ error: "Missing required fields: from, to, budget, days" });
  }

  const cacheKey = `trip:${from}:${to}:${budget}:${days}:${tripType}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json({ ...cached, fromCache: true });

  const input = {
    from: from.trim(),
    to: to.trim(),
    budget: parseInt(budget),
    days: parseInt(days),
    tripType: tripType || "friends",
    travelers: parseInt(travelers) || 2,
  };

  const plan = await planTrip(input);
  await cache.set(cacheKey, plan, TTL.TRENDING);
  res.json(plan);
};

// ================= API: Available Destinations =================
module.exports.getDestinations = (req, res) => {
  const destinations = Object.keys(PLACES_DB).map((d) => ({
    name: d.charAt(0).toUpperCase() + d.slice(1),
    placesCount: PLACES_DB[d].length,
  }));
  res.json({ destinations });
};
