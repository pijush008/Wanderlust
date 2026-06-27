/**
 * ================= WAITLIST MODEL =================
 * 
 * Queue-based system: When a listing is booked for certain dates,
 * other interested users can join a waitlist. If the booking is
 * cancelled, the next user in queue gets auto-notified.
 * 
 * Concepts:
 *   - FIFO Queue (first-come, first-served)
 *   - Event-driven (cancellation triggers notification)
 *   - Priority queue (optional priority for premium users)
 * 
 * State Machine:
 *   waiting → notified → booked (success)
 *   waiting → notified → expired (didn't book in time)
 *   waiting → cancelled (user left waitlist)
 */

const mongoose = require("mongoose");

const waitlistSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Desired dates
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },

    // Queue position (lower = earlier in queue)
    position: {
      type: Number,
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ["waiting", "notified", "booked", "expired", "cancelled"],
      default: "waiting",
    },

    // When user was notified (slot became available)
    notifiedAt: Date,

    // Expiry: user has X minutes to book after notification
    expiresAt: Date,

    // Guests requested
    guests: {
      type: Number,
      default: 1,
    },

    // Optional note
    note: String,
  },
  { timestamps: true }
);

// Indexes
waitlistSchema.index({ listing: 1, checkIn: 1, checkOut: 1, status: 1, position: 1 });
waitlistSchema.index({ user: 1, status: 1 });
waitlistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: "notified" } });

// ================= STATIC METHODS =================

/**
 * Add user to waitlist for a listing + dates
 */
waitlistSchema.statics.joinWaitlist = async function (listingId, userId, checkIn, checkOut, guests = 1) {
  // Check if already on waitlist
  const existing = await this.findOne({
    listing: listingId,
    user: userId,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    status: { $in: ["waiting", "notified"] },
  });

  if (existing) {
    return { success: false, reason: "ALREADY_ON_WAITLIST", entry: existing };
  }

  // Get next position in queue
  const lastEntry = await this.findOne({
    listing: listingId,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    status: { $in: ["waiting", "notified"] },
  }).sort({ position: -1 });

  const position = lastEntry ? lastEntry.position + 1 : 1;

  const entry = await this.create({
    listing: listingId,
    user: userId,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    position,
    guests,
    status: "waiting",
  });

  return { success: true, entry, position };
};

/**
 * Get the next user in queue for given listing + dates
 */
waitlistSchema.statics.getNextInQueue = async function (listingId, checkIn, checkOut) {
  return this.findOne({
    listing: listingId,
    status: "waiting",
    // Overlapping dates (same logic as booking conflict)
    checkIn: { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) },
  })
    .sort({ position: 1 })
    .populate("user");
};

/**
 * Get waitlist count for a listing + dates
 */
waitlistSchema.statics.getWaitlistCount = async function (listingId, checkIn, checkOut) {
  return this.countDocuments({
    listing: listingId,
    status: "waiting",
    checkIn: { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) },
  });
};

/**
 * Get user's waitlist entries
 */
waitlistSchema.statics.getUserWaitlist = async function (userId) {
  return this.find({ user: userId, status: { $in: ["waiting", "notified"] } })
    .populate("listing")
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model("Waitlist", waitlistSchema);
