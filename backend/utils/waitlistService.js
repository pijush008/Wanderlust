/**
 * ================= WAITLIST SERVICE =================
 * 
 * Event-driven waitlist processing:
 * 
 *   Booking Cancelled
 *        │
 *        ▼
 *   processWaitlist(listingId, checkIn, checkOut)
 *        │
 *        ├── Find next user in FIFO queue
 *        ├── Mark as "notified"
 *        ├── Set expiry timer (15 minutes to book)
 *        ├── Send WebSocket notification
 *        └── If user doesn't book → notify next in queue
 * 
 * Concepts:
 *   - FIFO Queue: First user to join gets first chance
 *   - Event-Driven: Cancellation event triggers processing
 *   - TTL Expiry: Notified users have 15 min window
 *   - Auto-cascade: If one user expires, next gets notified
 */

const Waitlist = require("../models/waitlist");
const { broadcastBookingCancelled } = require("./realtime");

const NOTIFICATION_WINDOW = 15 * 60 * 1000; // 15 minutes to book

// ================= PROCESS WAITLIST (triggered on cancellation) =================

/**
 * Called when a booking is cancelled — notifies next user in queue
 * This is the core event-driven handler
 */
async function processWaitlist(listingId, checkIn, checkOut) {
  const nextUser = await Waitlist.getNextInQueue(listingId, checkIn, checkOut);

  if (!nextUser) {
    console.log("[Waitlist] No one waiting for these dates");
    return { notified: false, reason: "QUEUE_EMPTY" };
  }

  // Mark as notified with expiry window
  nextUser.status = "notified";
  nextUser.notifiedAt = new Date();
  nextUser.expiresAt = new Date(Date.now() + NOTIFICATION_WINDOW);
  await nextUser.save();

  console.log(`[Waitlist] Notified user ${nextUser.user?.username || nextUser.user} — position #${nextUser.position}`);

  // Schedule expiry check (if user doesn't book in time, notify next)
  scheduleExpiryCheck(listingId, checkIn, checkOut, nextUser._id);

  return {
    notified: true,
    user: nextUser.user,
    position: nextUser.position,
    expiresAt: nextUser.expiresAt,
  };
}

// ================= EXPIRY CHECK =================

/**
 * After notification window expires, check if user booked.
 * If not, mark as expired and notify next in queue.
 */
function scheduleExpiryCheck(listingId, checkIn, checkOut, waitlistEntryId) {
  setTimeout(async () => {
    try {
      const entry = await Waitlist.findById(waitlistEntryId);
      if (!entry) return;

      // If still in "notified" state (didn't book), expire and cascade
      if (entry.status === "notified") {
        entry.status = "expired";
        await entry.save();
        console.log(`[Waitlist] Entry #${entry.position} expired — cascading to next`);

        // Notify next user in queue
        await processWaitlist(listingId, checkIn, checkOut);
      }
    } catch (err) {
      console.error("[Waitlist] Expiry check error:", err.message);
    }
  }, NOTIFICATION_WINDOW);
}

// ================= MARK AS BOOKED =================

/**
 * Called when a waitlisted user successfully books
 */
async function markAsBooked(userId, listingId, checkIn, checkOut) {
  const entry = await Waitlist.findOne({
    user: userId,
    listing: listingId,
    status: "notified",
    checkIn: { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) },
  });

  if (entry) {
    entry.status = "booked";
    await entry.save();
    return { success: true };
  }

  return { success: false };
}

// ================= CANCEL WAITLIST ENTRY =================

/**
 * User voluntarily leaves the waitlist
 */
async function leaveWaitlist(userId, waitlistId) {
  const entry = await Waitlist.findOne({
    _id: waitlistId,
    user: userId,
    status: { $in: ["waiting", "notified"] },
  });

  if (!entry) return { success: false, reason: "NOT_FOUND" };

  entry.status = "cancelled";
  await entry.save();

  return { success: true };
}

// ================= GET WAITLIST INFO =================

/**
 * Get waitlist status for a listing + dates (for UI display)
 */
async function getWaitlistInfo(listingId, checkIn, checkOut, userId = null) {
  const count = await Waitlist.getWaitlistCount(listingId, checkIn, checkOut);

  let userPosition = null;
  if (userId) {
    const userEntry = await Waitlist.findOne({
      listing: listingId,
      user: userId,
      status: { $in: ["waiting", "notified"] },
      checkIn: { $lt: new Date(checkOut) },
      checkOut: { $gt: new Date(checkIn) },
    });

    if (userEntry) {
      userPosition = {
        position: userEntry.position,
        status: userEntry.status,
        expiresAt: userEntry.expiresAt,
      };
    }
  }

  return { count, userPosition };
}

// ================= EXPORTS =================
module.exports = {
  processWaitlist,
  markAsBooked,
  leaveWaitlist,
  getWaitlistInfo,
  NOTIFICATION_WINDOW,
};
