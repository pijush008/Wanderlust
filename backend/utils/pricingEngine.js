/**
 * ================= DYNAMIC PRICING ENGINE =================
 * 
 * Formula:
 *   finalPrice = basePrice × demandMultiplier × seasonMultiplier 
 *                × weekendMultiplier × festivalMultiplier × occupancyMultiplier
 * 
 * Engineering Concepts:
 *   - Rule Engine: Each multiplier is a rule evaluated independently
 *   - Scheduling: Festival/season dates are pre-configured
 *   - Analytics: Demand is calculated from recent views/bookings
 *   - Business Logic: Caps, floors, and surge limits protect users
 */

// ================= FESTIVAL CALENDAR (India-focused) =================
const FESTIVALS = [
  { name: "New Year", start: "01-01", end: "01-03", multiplier: 1.4 },
  { name: "Republic Day", start: "01-26", end: "01-26", multiplier: 1.2 },
  { name: "Holi", start: "03-20", end: "03-25", multiplier: 1.35 },
  { name: "Independence Day", start: "08-15", end: "08-15", multiplier: 1.2 },
  { name: "Ganesh Chaturthi", start: "09-05", end: "09-10", multiplier: 1.25 },
  { name: "Navratri", start: "10-03", end: "10-12", multiplier: 1.3 },
  { name: "Dussehra", start: "10-12", end: "10-13", multiplier: 1.35 },
  { name: "Diwali", start: "10-28", end: "11-03", multiplier: 1.5 },
  { name: "Christmas", start: "12-23", end: "12-26", multiplier: 1.45 },
  { name: "New Year Eve", start: "12-30", end: "12-31", multiplier: 1.5 },
];

// ================= SEASONAL CONFIG =================
const SEASONS = {
  // Month ranges (1-indexed)
  peak: { months: [10, 11, 12, 1, 2, 3], multiplier: 1.3 },      // Oct-Mar (winter/tourist season)
  shoulder: { months: [4, 9], multiplier: 1.1 },                    // Apr, Sep
  offPeak: { months: [5, 6, 7, 8], multiplier: 0.85 },             // May-Aug (monsoon/summer)
};

// ================= LOCATION-BASED SEASON OVERRIDES =================
const LOCATION_SEASONS = {
  // Hill stations are peak in summer
  manali: { peakMonths: [4, 5, 6, 10, 11, 12], multiplier: 1.4 },
  shimla: { peakMonths: [4, 5, 6, 10, 11, 12], multiplier: 1.35 },
  mussoorie: { peakMonths: [4, 5, 6, 10, 11, 12], multiplier: 1.35 },
  darjeeling: { peakMonths: [3, 4, 5, 10, 11], multiplier: 1.3 },
  ooty: { peakMonths: [4, 5, 6, 10, 11], multiplier: 1.3 },
  // Beach destinations peak in winter
  goa: { peakMonths: [11, 12, 1, 2, 3], multiplier: 1.45 },
  pondicherry: { peakMonths: [10, 11, 12, 1, 2], multiplier: 1.3 },
  // Desert peak in winter
  jaisalmer: { peakMonths: [10, 11, 12, 1, 2], multiplier: 1.35 },
  // Kashmir peak in specific seasons
  gulmarg: { peakMonths: [12, 1, 2, 3, 6, 7], multiplier: 1.4 },
};

// ================= PRICING LIMITS =================
const LIMITS = {
  maxMultiplier: 2.5,       // Price can never exceed 2.5x base
  minMultiplier: 0.7,       // Price never drops below 0.7x base
  maxSurge: 1.8,            // Surge cap
  demandWindow: 24,         // Hours to calculate demand
};

// ================= RULE ENGINE =================

/**
 * Rule 1: Weekend Multiplier
 * Friday, Saturday, Sunday get premium pricing
 */
function getWeekendMultiplier(date = new Date()) {
  const day = date.getDay(); // 0=Sun, 5=Fri, 6=Sat
  if (day === 6) return 1.25;       // Saturday (highest)
  if (day === 5) return 1.15;       // Friday
  if (day === 0) return 1.2;        // Sunday
  return 1.0;                        // Weekday
}

/**
 * Rule 2: Festival Multiplier
 * Checks if current date falls within any festival window
 */
function getFestivalMultiplier(date = new Date()) {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  for (const festival of FESTIVALS) {
    if (mmdd >= festival.start && mmdd <= festival.end) {
      return { multiplier: festival.multiplier, name: festival.name };
    }
  }
  return { multiplier: 1.0, name: null };
}

/**
 * Rule 3: Seasonal Multiplier
 * Based on month + optional location override
 */
function getSeasonMultiplier(date = new Date(), location = "") {
  const month = date.getMonth() + 1;
  const loc = location.toLowerCase().trim();

  // Check location-specific season first
  if (LOCATION_SEASONS[loc]) {
    const locSeason = LOCATION_SEASONS[loc];
    if (locSeason.peakMonths.includes(month)) {
      return { multiplier: locSeason.multiplier, season: "peak (local)" };
    }
    return { multiplier: 0.9, season: "off-peak (local)" };
  }

  // Generic season
  if (SEASONS.peak.months.includes(month)) {
    return { multiplier: SEASONS.peak.multiplier, season: "peak" };
  }
  if (SEASONS.shoulder.months.includes(month)) {
    return { multiplier: SEASONS.shoulder.multiplier, season: "shoulder" };
  }
  return { multiplier: SEASONS.offPeak.multiplier, season: "off-peak" };
}

/**
 * Rule 4: Demand Multiplier
 * Based on how many views/searches a listing or location gets
 * Higher demand = higher price (surge pricing)
 */
function getDemandMultiplier(demandScore = 0) {
  // demandScore: 0-100 scale
  if (demandScore >= 90) return 1.5;    // Extreme demand
  if (demandScore >= 75) return 1.35;   // High demand
  if (demandScore >= 50) return 1.2;    // Moderate demand
  if (demandScore >= 25) return 1.1;    // Low demand
  return 1.0;                            // Normal
}

/**
 * Rule 5: Occupancy Optimization
 * If listing has been available for long without booking, reduce price
 * If listing is frequently booked, increase price
 */
function getOccupancyMultiplier(bookingRate = 0.5) {
  // bookingRate: 0-1 (0 = never booked, 1 = always booked)
  if (bookingRate >= 0.9) return 1.3;   // Almost always booked - premium
  if (bookingRate >= 0.7) return 1.15;  // Popular
  if (bookingRate >= 0.4) return 1.0;   // Normal
  if (bookingRate >= 0.2) return 0.9;   // Underperforming - discount
  return 0.8;                            // Rarely booked - bigger discount
}

/**
 * Rule 6: Time-of-Day Multiplier (last-minute vs advance booking)
 */
function getBookingTimingMultiplier(daysUntilCheckin = 7) {
  if (daysUntilCheckin <= 1) return 1.3;    // Last minute surge
  if (daysUntilCheckin <= 3) return 1.15;   // Short notice
  if (daysUntilCheckin >= 30) return 0.9;   // Early bird discount
  if (daysUntilCheckin >= 60) return 0.85;  // Far advance discount
  return 1.0;
}

// ================= MAIN PRICING CALCULATOR =================

/**
 * Calculate dynamic price with full breakdown
 * 
 * @param {Object} options
 * @param {Number} options.basePrice - The listing's base price
 * @param {String} options.location - Listing location
 * @param {Date} options.date - Target date for pricing
 * @param {Number} options.demandScore - 0-100 demand score
 * @param {Number} options.bookingRate - 0-1 occupancy rate
 * @param {Number} options.daysUntilCheckin - Days until check-in
 * @returns {Object} Pricing breakdown
 */
function calculateDynamicPrice(options = {}) {
  const {
    basePrice = 1000,
    location = "",
    date = new Date(),
    demandScore = 30,
    bookingRate = 0.5,
    daysUntilCheckin = 7,
  } = options;

  // Calculate each multiplier
  const weekend = getWeekendMultiplier(date);
  const festival = getFestivalMultiplier(date);
  const season = getSeasonMultiplier(date, location);
  const demand = getDemandMultiplier(demandScore);
  const occupancy = getOccupancyMultiplier(bookingRate);
  const timing = getBookingTimingMultiplier(daysUntilCheckin);

  // Combined multiplier
  let totalMultiplier = weekend * festival.multiplier * season.multiplier * demand * occupancy * timing;

  // Apply caps
  totalMultiplier = Math.min(totalMultiplier, LIMITS.maxMultiplier);
  totalMultiplier = Math.max(totalMultiplier, LIMITS.minMultiplier);

  // Final price
  const finalPrice = Math.round(basePrice * totalMultiplier);

  // Price change from base
  const priceChange = finalPrice - basePrice;
  const percentChange = Math.round(((finalPrice - basePrice) / basePrice) * 100);

  // Determine pricing status
  let status = "normal";
  if (totalMultiplier >= 1.4) status = "surge";
  else if (totalMultiplier >= 1.15) status = "high";
  else if (totalMultiplier <= 0.85) status = "discount";
  else if (totalMultiplier <= 0.95) status = "low";

  return {
    basePrice,
    finalPrice,
    totalMultiplier: Math.round(totalMultiplier * 100) / 100,
    priceChange,
    percentChange,
    status,
    breakdown: {
      weekend: { multiplier: weekend, label: getDayLabel(date) },
      festival: { multiplier: festival.multiplier, name: festival.name },
      season: { multiplier: season.multiplier, label: season.season },
      demand: { multiplier: demand, score: demandScore },
      occupancy: { multiplier: occupancy, rate: bookingRate },
      timing: { multiplier: timing, daysOut: daysUntilCheckin },
    },
    meta: {
      calculatedAt: new Date().toISOString(),
      location,
      date: date.toISOString(),
    },
  };
}

function getDayLabel(date) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}

/**
 * Quick price calculation (for listing cards)
 * Returns just the final price without full breakdown
 */
function getQuickPrice(basePrice, location = "") {
  const now = new Date();
  const weekend = getWeekendMultiplier(now);
  const festival = getFestivalMultiplier(now);
  const season = getSeasonMultiplier(now, location);

  let multiplier = weekend * festival.multiplier * season.multiplier;
  multiplier = Math.min(multiplier, LIMITS.maxMultiplier);
  multiplier = Math.max(multiplier, LIMITS.minMultiplier);

  return {
    finalPrice: Math.round(basePrice * multiplier),
    multiplier: Math.round(multiplier * 100) / 100,
    isSurge: multiplier >= 1.3,
    isDiscount: multiplier < 0.95,
  };
}

// ================= EXPORTS =================
module.exports = {
  calculateDynamicPrice,
  getQuickPrice,
  getWeekendMultiplier,
  getFestivalMultiplier,
  getSeasonMultiplier,
  getDemandMultiplier,
  getOccupancyMultiplier,
  getBookingTimingMultiplier,
  FESTIVALS,
  SEASONS,
  LOCATION_SEASONS,
  LIMITS,
};
