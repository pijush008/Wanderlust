/**
 * ================= DISTRIBUTED LOCK MANAGER =================
 * 
 * Prevents double-booking by ensuring only one booking operation
 * can proceed for a given listing + date range at a time.
 * 
 * In production, this would use Redis (SETNX + TTL).
 * This implementation uses MongoDB as the lock store for portability.
 * 
 * Pattern: Pessimistic Locking with TTL-based auto-release
 * 
 * Flow:
 *   1. User A tries to book → acquires lock → proceeds
 *   2. User B tries to book same dates → lock exists → rejected immediately
 *   3. User A completes → releases lock
 *   4. If User A crashes → lock auto-expires after TTL
 */

const mongoose = require("mongoose");

// Lock document schema (stored in MongoDB)
const lockSchema = new mongoose.Schema({
  // Unique key: listingId + date range hash
  lockKey: {
    type: String,
    required: true,
    unique: true,
  },
  // Who holds the lock
  holderId: {
    type: String,
    required: true,
  },
  // Lock metadata
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  checkIn: Date,
  checkOut: Date,
  // Auto-expire: TTL index will remove stale locks
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // MongoDB TTL index
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Lock = mongoose.model("BookingLock", lockSchema);

// ================= LOCK OPERATIONS =================

const DEFAULT_TTL = 30 * 1000; // 30 seconds lock TTL

/**
 * Acquire a lock for a booking operation
 * 
 * @param {String} listingId - The listing being booked
 * @param {Date} checkIn - Check-in date
 * @param {Date} checkOut - Check-out date
 * @param {String} holderId - User/session ID requesting the lock
 * @param {Number} ttl - Lock TTL in milliseconds (default 30s)
 * @returns {Object} { acquired: Boolean, lockId: String|null, reason: String }
 */
async function acquireLock(listingId, checkIn, checkOut, holderId, ttl = DEFAULT_TTL) {
  const lockKey = generateLockKey(listingId, checkIn, checkOut);

  try {
    // Attempt atomic insert (will fail if lock exists)
    const lock = await Lock.findOneAndUpdate(
      {
        lockKey,
        // Only acquire if no existing lock OR existing lock has expired
        $or: [
          { expiresAt: { $lt: new Date() } }, // Expired lock
        ],
      },
      {
        $set: {
          lockKey,
          holderId,
          listingId,
          checkIn,
          checkOut,
          expiresAt: new Date(Date.now() + ttl),
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      acquired: true,
      lockId: lock._id.toString(),
      expiresAt: lock.expiresAt,
    };
  } catch (err) {
    // Duplicate key error = lock already held by someone else
    if (err.code === 11000) {
      // Check who holds it
      const existingLock = await Lock.findOne({ lockKey });
      
      // If it's the same holder, extend the lock
      if (existingLock && existingLock.holderId === holderId) {
        existingLock.expiresAt = new Date(Date.now() + ttl);
        await existingLock.save();
        return {
          acquired: true,
          lockId: existingLock._id.toString(),
          expiresAt: existingLock.expiresAt,
          extended: true,
        };
      }

      return {
        acquired: false,
        lockId: null,
        reason: "LOCK_HELD",
        holder: existingLock ? "another user" : "unknown",
        expiresAt: existingLock ? existingLock.expiresAt : null,
      };
    }

    throw err;
  }
}

/**
 * Release a lock after booking completes or fails
 */
async function releaseLock(listingId, checkIn, checkOut, holderId) {
  const lockKey = generateLockKey(listingId, checkIn, checkOut);

  const result = await Lock.deleteOne({ lockKey, holderId });
  return { released: result.deletedCount > 0 };
}

/**
 * Force-release a lock (admin use or cleanup)
 */
async function forceReleaseLock(lockKey) {
  const result = await Lock.deleteOne({ lockKey });
  return { released: result.deletedCount > 0 };
}

/**
 * Check if a lock exists for given dates
 */
async function isLocked(listingId, checkIn, checkOut) {
  const lockKey = generateLockKey(listingId, checkIn, checkOut);
  const lock = await Lock.findOne({
    lockKey,
    expiresAt: { $gt: new Date() },
  });
  return { locked: !!lock, lock };
}

/**
 * Clean up expired locks (called periodically)
 */
async function cleanupExpiredLocks() {
  const result = await Lock.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return { cleaned: result.deletedCount };
}

// ================= HELPERS =================

function generateLockKey(listingId, checkIn, checkOut) {
  const checkInStr = new Date(checkIn).toISOString().split("T")[0];
  const checkOutStr = new Date(checkOut).toISOString().split("T")[0];
  return `booking:${listingId}:${checkInStr}:${checkOutStr}`;
}

// ================= EXPORTS =================
module.exports = {
  acquireLock,
  releaseLock,
  forceReleaseLock,
  isLocked,
  cleanupExpiredLocks,
  Lock,
};
