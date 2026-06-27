const { planTrip, PLACES_DB, TRAVEL_DATA } = require("../utils/tripPlanner");
const { cache, TTL } = require("../utils/cache");

// GET /api/trips/options
exports.options = (req, res) => {
  const destinations = Object.keys(PLACES_DB).map((d) => d.charAt(0).toUpperCase() + d.slice(1));
  const origins = Object.keys(TRAVEL_DATA).map((d) => d.charAt(0).toUpperCase() + d.slice(1));
  res.json({ destinations, origins });
};

// POST /api/trips/plan
exports.generatePlan = async (req, res) => {
  const { from, to, budget, days, tripType, travelers } = req.body;

  if (!from || !to || !budget || !days) {
    return res.status(400).json({ error: "Required: from, to, budget, days" });
  }

  const input = {
    from: from.trim(),
    to: to.trim(),
    budget: parseInt(budget),
    days: parseInt(days),
    tripType: tripType || "friends",
    travelers: parseInt(travelers) || 2,
  };

  const cacheKey = `trip:${input.from}:${input.to}:${input.budget}:${input.days}:${input.tripType}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json({ ...cached, fromCache: true });

  const plan = await planTrip(input);
  await cache.set(cacheKey, plan, TTL.TRENDING);
  res.json(plan);
};

// GET /api/trips/destinations
exports.getDestinations = (req, res) => {
  const destinations = Object.keys(PLACES_DB).map((d) => ({
    name: d.charAt(0).toUpperCase() + d.slice(1),
    placesCount: PLACES_DB[d].length,
  }));
  res.json({ destinations });
};
