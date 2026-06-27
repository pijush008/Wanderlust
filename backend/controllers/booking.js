const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { calculateDynamicPrice } = require("../utils/pricingEngine");
const { acquireLock, releaseLock } = require("../utils/lockManager");
const { v4: uuidv4 } = require("uuid");
const { broadcastBookingConfirmed, broadcastBookingCancelled, broadcastBookingInProgress } = require("../utils/realtime");
const { processWaitlist, markAsBooked } = require("../utils/waitlistService");

// POST /api/listings/:id/book
exports.create = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut, guests } = req.body;
  const userId = req.user._id.toString();

  if (!checkIn || !checkOut) return res.status(400).json({ error: "Dates required" });

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  if (checkInDate < today) return res.status(400).json({ error: "Check-in cannot be in the past" });
  if (checkOutDate <= checkInDate) return res.status(400).json({ error: "Check-out must be after check-in" });

  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  if (nights > 30) return res.status(400).json({ error: "Max 30 nights" });

  let lockResult;
  try {
    lockResult = await acquireLock(id, checkInDate, checkOutDate, userId, 30000);
    if (!lockResult.acquired) {
      return res.status(409).json({ error: "Another user is booking these dates. Try again." });
    }
  } catch (err) {
    return res.status(500).json({ error: "Booking system busy" });
  }

  broadcastBookingInProgress(id, { checkIn: checkInDate, checkOut: checkOutDate });

  try {
    const conflict = await Booking.hasConflict(id, checkInDate, checkOutDate);
    if (conflict) {
      await releaseLock(id, checkInDate, checkOutDate, userId);
      return res.status(409).json({ error: "Dates already booked", conflict });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      await releaseLock(id, checkInDate, checkOutDate, userId);
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.owner.toString() === userId) {
      await releaseLock(id, checkInDate, checkOutDate, userId);
      return res.status(400).json({ error: "Cannot book your own listing" });
    }

    const daysUntilCheckin = Math.ceil((checkInDate - new Date()) / (1000 * 60 * 60 * 24));
    const pricing = calculateDynamicPrice({
      basePrice: listing.price,
      location: listing.location,
      date: checkInDate,
      demandScore: Math.min(listing.reviews.length * 10 + 15, 100),
      bookingRate: Math.min(listing.reviews.length * 0.15, 0.95),
      daysUntilCheckin,
    });

    const totalAmount = pricing.finalPrice * nights;

    const booking = new Booking({
      listing: id,
      guest: userId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: parseInt(guests) || 1,
      pricing: {
        basePrice: listing.price,
        dynamicPrice: pricing.finalPrice,
        nights,
        totalAmount,
        multiplier: pricing.totalMultiplier,
        breakdown: pricing.breakdown,
      },
      status: "confirmed",
      confirmedAt: new Date(),
      lockId: lockResult.lockId,
      bookingAttemptId: uuidv4(),
    });

    await booking.save();
    await releaseLock(id, checkInDate, checkOutDate, userId);

    broadcastBookingConfirmed(id, { checkIn: checkInDate, checkOut: checkOutDate, nights });
    markAsBooked(userId, id, checkInDate, checkOutDate).catch(() => {});

    res.status(201).json({ booking, message: `Booking confirmed for ₹${totalAmount.toLocaleString("en-IN")}` });
  } catch (err) {
    await releaseLock(id, checkInDate, checkOutDate, userId);
    if (err.code === 11000) {
      return res.status(409).json({ error: "Dates just booked by someone else" });
    }
    console.error("Booking error:", err);
    res.status(500).json({ error: "Booking failed" });
  }
};

// GET /api/bookings/:bookingId
exports.show = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate("listing")
    .populate("guest");
  if (!booking) return res.status(404).json({ error: "Not found" });

  if (
    booking.guest._id.toString() !== req.user._id.toString() &&
    booking.listing.owner.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ error: "Not authorized" });
  }
  res.json({ booking });
};

// GET /api/bookings
exports.myBookings = async (req, res) => {
  const bookings = await Booking.find({ guest: req.user._id })
    .populate("listing")
    .sort({ createdAt: -1 });
  res.json({ bookings });
};

// POST /api/bookings/:bookingId/cancel
exports.cancel = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) return res.status(404).json({ error: "Not found" });
  if (booking.guest.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: "Not your booking" });
  }
  try {
    await booking.cancel(req.body.reason || "Cancelled by guest");
    broadcastBookingCancelled(booking.listing.toString(), { checkIn: booking.checkIn, checkOut: booking.checkOut });
    processWaitlist(booking.listing.toString(), booking.checkIn, booking.checkOut).catch(() => {});
    res.json({ cancelled: true, booking });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/listings/:id/availability
exports.checkAvailability = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut } = req.query;
  if (!checkIn || !checkOut) return res.status(400).json({ error: "Dates required" });

  const conflict = await Booking.hasConflict(id, new Date(checkIn), new Date(checkOut));
  if (conflict) return res.json({ available: false, conflict });

  const listing = await Listing.findById(id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  const pricing = calculateDynamicPrice({
    basePrice: listing.price,
    location: listing.location,
    date: new Date(checkIn),
    demandScore: Math.min(listing.reviews.length * 10 + 15, 100),
    bookingRate: Math.min(listing.reviews.length * 0.15, 0.95),
    daysUntilCheckin: Math.max(1, Math.ceil((new Date(checkIn) - new Date()) / (1000 * 60 * 60 * 24))),
  });

  res.json({
    available: true,
    pricing: {
      pricePerNight: pricing.finalPrice,
      nights,
      totalAmount: pricing.finalPrice * nights,
      multiplier: pricing.totalMultiplier,
      status: pricing.status,
    },
  });
};

// GET /api/listings/:id/booked-dates
exports.getBookedDates = async (req, res) => {
  const bookings = await Booking.getBookedDates(req.params.id);
  const blockedDates = [];
  for (const b of bookings) {
    const cur = new Date(b.checkIn), end = new Date(b.checkOut);
    while (cur < end) { blockedDates.push(cur.toISOString().split("T")[0]); cur.setDate(cur.getDate() + 1); }
  }
  res.json({ blockedDates, bookings });
};
