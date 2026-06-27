const Waitlist = require("../models/waitlist");
const Listing = require("../models/listing");
const { getWaitlistInfo, leaveWaitlist } = require("../utils/waitlistService");
const { broadcastBookingInProgress } = require("../utils/realtime");

// ================= JOIN WAITLIST =================
module.exports.joinWaitlist = async (req, res) => {
  const { id } = req.params; // listing ID
  const { checkIn, checkOut, guests } = req.body;
  const userId = req.user._id;

  if (!checkIn || !checkOut) {
    return res.status(400).json({ error: "Check-in and check-out dates required" });
  }

  // Verify listing exists
  const listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  // Can't waitlist your own listing
  if (listing.owner.toString() === userId.toString()) {
    return res.status(400).json({ error: "Cannot join waitlist for your own listing" });
  }

  const result = await Waitlist.joinWaitlist(id, userId, checkIn, checkOut, parseInt(guests) || 1);

  if (!result.success) {
    return res.status(409).json({
      error: "Already on waitlist",
      position: result.entry.position,
      status: result.entry.status,
    });
  }

  res.json({
    success: true,
    message: `You're #${result.position} on the waitlist`,
    position: result.position,
    waitlistId: result.entry._id,
  });
};

// ================= LEAVE WAITLIST =================
module.exports.leaveWaitlist = async (req, res) => {
  const { waitlistId } = req.params;
  const userId = req.user._id;

  const result = await leaveWaitlist(userId, waitlistId);

  if (!result.success) {
    return res.status(404).json({ error: "Waitlist entry not found" });
  }

  res.json({ success: true, message: "Removed from waitlist" });
};

// ================= GET MY WAITLIST =================
module.exports.myWaitlist = async (req, res) => {
  const entries = await Waitlist.getUserWaitlist(req.user._id);

  res.render("waitlist/index", { entries });
};

// ================= GET WAITLIST STATUS (API) =================
module.exports.getStatus = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut } = req.query;

  if (!checkIn || !checkOut) {
    return res.json({ count: 0, userPosition: null });
  }

  const userId = req.user ? req.user._id : null;
  const info = await getWaitlistInfo(id, checkIn, checkOut, userId);

  res.json(info);
};

// ================= GET WAITLIST FOR LISTING (owner view) =================
module.exports.listingWaitlist = async (req, res) => {
  const { id } = req.params;

  const entries = await Waitlist.find({
    listing: id,
    status: { $in: ["waiting", "notified"] },
  })
    .populate("user", "username email")
    .sort({ position: 1 });

  res.json({
    listingId: id,
    totalWaiting: entries.length,
    queue: entries.map((e) => ({
      position: e.position,
      user: e.user?.username || "Unknown",
      checkIn: e.checkIn,
      checkOut: e.checkOut,
      status: e.status,
      joinedAt: e.createdAt,
      expiresAt: e.expiresAt,
    })),
  });
};
