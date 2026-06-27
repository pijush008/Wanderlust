/**
 * ================= REALTIME AVAILABILITY SYSTEM =================
 * 
 * Architecture:
 *   WebSocket (Socket.IO) for bidirectional real-time communication
 *   In-memory Pub/Sub for event broadcasting (Redis pub/sub in production)
 * 
 * How it works:
 *   1. User opens a listing page → joins a "room" for that listing
 *   2. Another user books that listing → server broadcasts "availability:updated"
 *   3. All users viewing that listing get instant notification
 *   4. Their UI updates without page refresh (blocked dates, pricing, status)
 * 
 * Events:
 *   Client → Server:
 *     - "join:listing" (listingId) — Subscribe to listing updates
 *     - "leave:listing" (listingId) — Unsubscribe
 *     - "check:availability" (listingId, dates) — Request availability check
 * 
 *   Server → Client:
 *     - "availability:updated" — Dates just got booked/cancelled
 *     - "availability:result" — Response to availability check
 *     - "pricing:updated" — Dynamic price changed
 *     - "viewers:count" — How many people are viewing this listing
 *     - "booking:conflict" — Someone else is booking same dates
 * 
 * Solves:
 *   - Stale booking data (no more "already booked" after form submit)
 *   - Race conditions visible to user (see when someone else is booking)
 *   - Live viewer count (social proof / urgency)
 */

const { Server } = require("socket.io");
const Booking = require("../models/booking");

let io = null;

// Track viewers per listing (for "X people viewing" feature)
const listingViewers = new Map(); // listingId → Set of socketIds

// ================= INITIALIZE SOCKET.IO =================

function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    // Performance tuning
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // ---- JOIN LISTING ROOM ----
    socket.on("join:listing", (listingId) => {
      if (!listingId) return;

      const room = `listing:${listingId}`;
      socket.join(room);

      // Track viewer
      if (!listingViewers.has(listingId)) {
        listingViewers.set(listingId, new Set());
      }
      listingViewers.get(listingId).add(socket.id);

      // Broadcast viewer count to room
      const viewerCount = listingViewers.get(listingId).size;
      io.to(room).emit("viewers:count", {
        listingId,
        count: viewerCount,
      });

      socket.listingId = listingId; // Store for cleanup on disconnect
    });

    // ---- LEAVE LISTING ROOM ----
    socket.on("leave:listing", (listingId) => {
      if (!listingId) return;
      handleLeaveRoom(socket, listingId);
    });

    // ---- REALTIME AVAILABILITY CHECK ----
    socket.on("check:availability", async (data) => {
      const { listingId, checkIn, checkOut } = data;
      if (!listingId || !checkIn || !checkOut) return;

      try {
        const conflict = await Booking.hasConflict(
          listingId,
          new Date(checkIn),
          new Date(checkOut)
        );

        socket.emit("availability:result", {
          listingId,
          checkIn,
          checkOut,
          available: !conflict,
          conflict: conflict
            ? { checkIn: conflict.checkIn, checkOut: conflict.checkOut }
            : null,
        });
      } catch (err) {
        socket.emit("availability:result", {
          listingId,
          available: false,
          error: "Check failed",
        });
      }
    });

    // ---- DISCONNECT ----
    socket.on("disconnect", () => {
      if (socket.listingId) {
        handleLeaveRoom(socket, socket.listingId);
      }
    });
  });

  console.log(" Realtime: WebSocket server initialized");
  return io;
}

// ================= HELPER: Handle room leave =================
function handleLeaveRoom(socket, listingId) {
  const room = `listing:${listingId}`;
  socket.leave(room);

  if (listingViewers.has(listingId)) {
    listingViewers.get(listingId).delete(socket.id);
    const count = listingViewers.get(listingId).size;

    if (count === 0) {
      listingViewers.delete(listingId);
    } else {
      // Update viewer count for remaining users
      io.to(room).emit("viewers:count", { listingId, count });
    }
  }
}

// ================= BROADCAST FUNCTIONS =================

/**
 * Broadcast when a booking is confirmed
 * All users viewing this listing get notified instantly
 */
function broadcastBookingConfirmed(listingId, bookingData) {
  if (!io) return;

  const room = `listing:${listingId}`;
  io.to(room).emit("availability:updated", {
    type: "booking_confirmed",
    listingId,
    checkIn: bookingData.checkIn,
    checkOut: bookingData.checkOut,
    message: "These dates were just booked",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast when a booking is cancelled (dates become available again)
 */
function broadcastBookingCancelled(listingId, bookingData) {
  if (!io) return;

  const room = `listing:${listingId}`;
  io.to(room).emit("availability:updated", {
    type: "booking_cancelled",
    listingId,
    checkIn: bookingData.checkIn,
    checkOut: bookingData.checkOut,
    message: "Dates are now available",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast when someone starts a booking attempt (lock acquired)
 * Creates urgency for other viewers
 */
function broadcastBookingInProgress(listingId, dates) {
  if (!io) return;

  const room = `listing:${listingId}`;
  io.to(room).emit("booking:conflict", {
    listingId,
    checkIn: dates.checkIn,
    checkOut: dates.checkOut,
    message: "Someone is booking these dates right now",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast pricing update (when dynamic price changes)
 */
function broadcastPricingUpdate(listingId, pricingData) {
  if (!io) return;

  const room = `listing:${listingId}`;
  io.to(room).emit("pricing:updated", {
    listingId,
    ...pricingData,
    timestamp: new Date().toISOString(),
  });
}

// ================= STATS =================
function getRealtimeStats() {
  if (!io) return { connected: 0, rooms: 0, viewers: {} };

  const viewers = {};
  for (const [listingId, sockets] of listingViewers) {
    viewers[listingId] = sockets.size;
  }

  return {
    connected: io.engine.clientsCount || 0,
    rooms: listingViewers.size,
    viewers,
  };
}

// ================= EXPORTS =================
module.exports = {
  initializeSocket,
  broadcastBookingConfirmed,
  broadcastBookingCancelled,
  broadcastBookingInProgress,
  broadcastPricingUpdate,
  getRealtimeStats,
  getIO: () => io,
};
