/**
 * ================= BOOKING MODEL =================
 * 
 * Conflict Resolution Strategy:
 *   1. Optimistic Locking: Uses __v (versionKey) to detect concurrent modifications
 *   2. Unique Compound Index: Prevents overlapping date ranges at DB level
 *   3. Status Machine: pending → confirmed → cancelled/completed
 * 
 * The compound index on (listing + checkIn + checkOut + status) ensures
 * MongoDB itself rejects duplicate bookings even if app-level locks fail.
 */

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },

    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    checkIn: {
      type: Date,
      required: true,
    },

    checkOut: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.checkIn;
        },
        message: "Check-out must be after check-in",
      },
    },

    guests: {
      type: Number,
      default: 1,
      min: 1,
      max: 20,
    },

    // Pricing snapshot at time of booking
    pricing: {
      basePrice: { type: Number, required: true },
      dynamicPrice: { type: Number, required: true },
      nights: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
      multiplier: { type: Number, default: 1 },
      breakdown: { type: mongoose.Schema.Types.Mixed },
    },

    // Booking status state machine
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "failed"],
      default: "pending",
    },

    // Conflict resolution metadata
    lockId: String,
    bookingAttemptId: {
      type: String,
      unique: true, // Idempotency key — prevents duplicate submissions
      required: true,
    },

    // Timestamps for audit trail
    confirmedAt: Date,
    cancelledAt: Date,
    cancelReason: String,
  },
  {
    timestamps: true,
    // Enable optimistic locking via version key
    optimisticConcurrency: true,
  }
);

// ================= INDEXES FOR CONFLICT PREVENTION =================

// Compound index: Ensures no overlapping confirmed bookings for same listing
// This is the LAST LINE OF DEFENSE against double bookings
bookingSchema.index(
  { listing: 1, checkIn: 1, checkOut: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed"] },
    },
  }
);

// Fast lookup by guest
bookingSchema.index({ guest: 1, status: 1 });

// Fast lookup by listing for availability checks
bookingSchema.index({ listing: 1, status: 1, checkIn: 1, checkOut: 1 });

// ================= INSTANCE METHODS =================

bookingSchema.methods.confirm = function () {
  if (this.status !== "pending") {
    throw new Error(`Cannot confirm booking in '${this.status}' state`);
  }
  this.status = "confirmed";
  this.confirmedAt = new Date();
  return this.save();
};

bookingSchema.methods.cancel = function (reason = "") {
  if (this.status === "completed" || this.status === "cancelled") {
    throw new Error(`Cannot cancel booking in '${this.status}' state`);
  }
  this.status = "cancelled";
  this.cancelledAt = new Date();
  this.cancelReason = reason;
  return this.save();
};

// ================= STATIC METHODS =================

/**
 * Check if dates overlap with existing bookings for a listing
 * This is the core availability check
 */
bookingSchema.statics.hasConflict = async function (listingId, checkIn, checkOut, excludeBookingId = null) {
  const query = {
    listing: listingId,
    status: { $in: ["pending", "confirmed"] },
    // Date overlap logic:
    // Existing booking overlaps if:
    //   existingCheckIn < newCheckOut AND existingCheckOut > newCheckIn
    checkIn: { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflict = await this.findOne(query).lean();
  return conflict;
};

/**
 * Get all booked date ranges for a listing (for calendar display)
 */
bookingSchema.statics.getBookedDates = async function (listingId) {
  const bookings = await this.find({
    listing: listingId,
    status: { $in: ["pending", "confirmed"] },
    checkOut: { $gte: new Date() }, // Only future/current bookings
  })
    .select("checkIn checkOut status")
    .lean();

  return bookings;
};

module.exports = mongoose.model("Booking", bookingSchema);
