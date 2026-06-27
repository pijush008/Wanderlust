const Listing = require("../models/listing");
const {
  calculateDynamicPrice,
  getQuickPrice,
  getFestivalMultiplier,
  getSeasonMultiplier,
  FESTIVALS,
  LOCATION_SEASONS,
} = require("../utils/pricingEngine");

// ================= GET DYNAMIC PRICE FOR A LISTING =================
module.exports.getListingPrice = async (req, res) => {
  const { id } = req.params;
  const { date, daysUntilCheckin } = req.query;

  const listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  const targetDate = date ? new Date(date) : new Date();
  const days = daysUntilCheckin ? parseInt(daysUntilCheckin) : 7;

  // Simulate demand score based on reviews count and recency
  const demandScore = Math.min(
    (listing.reviews.length * 10) + Math.random() * 20,
    100
  );

  // Simulate booking rate based on reviews
  const bookingRate = Math.min(listing.reviews.length * 0.15, 0.95);

  const pricing = calculateDynamicPrice({
    basePrice: listing.price,
    location: listing.location,
    date: targetDate,
    demandScore,
    bookingRate,
    daysUntilCheckin: days,
  });

  res.json({
    listingId: listing._id,
    title: listing.title,
    location: listing.location,
    ...pricing,
  });
};

// ================= GET PRICES FOR MULTIPLE DATES (Calendar View) =================
module.exports.getPriceCalendar = async (req, res) => {
  const { id } = req.params;
  const { startDate, days = 30 } = req.query;

  const listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  const start = startDate ? new Date(startDate) : new Date();
  const numDays = Math.min(parseInt(days), 90); // Max 90 days

  const calendar = [];
  for (let i = 0; i < numDays; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);

    const pricing = getQuickPrice(listing.price, listing.location);
    const fullPricing = calculateDynamicPrice({
      basePrice: listing.price,
      location: listing.location,
      date,
      demandScore: 30,
      bookingRate: 0.5,
      daysUntilCheckin: i + 1,
    });

    calendar.push({
      date: date.toISOString().split("T")[0],
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      finalPrice: fullPricing.finalPrice,
      status: fullPricing.status,
      multiplier: fullPricing.totalMultiplier,
      festival: fullPricing.breakdown.festival.name,
    });
  }

  res.json({
    listingId: listing._id,
    basePrice: listing.price,
    location: listing.location,
    calendar,
  });
};

// ================= GET PRICING BREAKDOWN (Show Page Widget) =================
module.exports.getPriceBreakdown = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  const demandScore = Math.min(
    (listing.reviews.length * 10) + 15,
    100
  );
  const bookingRate = Math.min(listing.reviews.length * 0.15, 0.95);

  const pricing = calculateDynamicPrice({
    basePrice: listing.price,
    location: listing.location,
    date: new Date(),
    demandScore,
    bookingRate,
    daysUntilCheckin: 7,
  });

  res.json({
    listingId: listing._id,
    ...pricing,
  });
};

// ================= UPCOMING FESTIVALS =================
module.exports.getUpcomingFestivals = (req, res) => {
  const now = new Date();
  const mmdd = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const upcoming = FESTIVALS
    .filter((f) => f.start >= mmdd)
    .slice(0, 5)
    .map((f) => ({
      name: f.name,
      startDate: f.start,
      endDate: f.end,
      surgeMultiplier: f.multiplier,
      percentIncrease: Math.round((f.multiplier - 1) * 100),
    }));

  // If we're past most festivals, wrap around to next year
  if (upcoming.length < 3) {
    const wrapped = FESTIVALS.slice(0, 3).map((f) => ({
      name: f.name,
      startDate: f.start,
      endDate: f.end,
      surgeMultiplier: f.multiplier,
      percentIncrease: Math.round((f.multiplier - 1) * 100),
    }));
    upcoming.push(...wrapped);
  }

  res.json({ upcoming: upcoming.slice(0, 5) });
};

// ================= PRICING ANALYTICS (for owners) =================
module.exports.getPricingAnalytics = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  // Generate 7-day forecast
  const forecast = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const pricing = calculateDynamicPrice({
      basePrice: listing.price,
      location: listing.location,
      date,
      demandScore: 30 + Math.random() * 30,
      bookingRate: 0.5,
      daysUntilCheckin: i + 1,
    });

    forecast.push({
      date: date.toISOString().split("T")[0],
      day: date.toLocaleDateString("en-US", { weekday: "long" }),
      price: pricing.finalPrice,
      status: pricing.status,
      multiplier: pricing.totalMultiplier,
    });
  }

  // Location season info
  const loc = listing.location.toLowerCase();
  const locationInfo = LOCATION_SEASONS[loc] || null;

  res.json({
    listingId: listing._id,
    basePrice: listing.price,
    location: listing.location,
    forecast,
    locationSeasonConfig: locationInfo,
    tips: generatePricingTips(listing, forecast),
  });
};

// ================= HELPER: Generate pricing tips =================
function generatePricingTips(listing, forecast) {
  const tips = [];
  const avgMultiplier = forecast.reduce((sum, f) => sum + f.multiplier, 0) / forecast.length;

  if (avgMultiplier > 1.3) {
    tips.push("🔥 High demand period! Your listing is priced well for the season.");
  }
  if (avgMultiplier < 0.95) {
    tips.push("💡 Consider running a promotion — it's off-peak season for your area.");
  }

  const weekendPrices = forecast.filter((f) =>
    ["Saturday", "Sunday", "Friday"].includes(f.day)
  );
  if (weekendPrices.length > 0) {
    tips.push("📅 Weekend pricing is active — expect higher rates Fri-Sun.");
  }

  if (listing.reviews.length < 3) {
    tips.push("⭐ Get more reviews to boost your demand score and pricing power.");
  }

  return tips;
}
