/**
 * ================= USER ACTIVITY MODEL =================
 * 
 * Tracks user interactions for the recommendation engine.
 * Every view, booking, search, and review builds the user's preference profile.
 * 
 * This is the "User History" component of the recommendation architecture.
 */

const mongoose = require("mongoose");

const userActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // What happened
    action: {
      type: String,
      enum: ["view", "book", "search", "review", "wishlist", "share"],
      required: true,
    },

    // Which listing (for view, book, review, wishlist)
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
    },

    // Listing snapshot (for faster recommendations without joins)
    listingData: {
      location: String,
      country: String,
      category: String,
      priceRange: String,   // "budget" | "mid" | "premium" | "luxury"
      price: Number,
    },

    // Search query (for search actions)
    searchQuery: String,

    // Engagement signals
    duration: Number,       // Time spent viewing (seconds)
    rating: Number,         // Review rating given (1-5)

    // Context
    device: String,         // "mobile" | "desktop"
    sessionId: String,
  },
  { timestamps: true }
);

// Indexes for fast recommendation queries
userActivitySchema.index({ user: 1, action: 1, createdAt: -1 });
userActivitySchema.index({ listing: 1, action: 1 });
userActivitySchema.index({ "listingData.location": 1, action: 1 });
userActivitySchema.index({ "listingData.category": 1, action: 1 });

module.exports = mongoose.model("UserActivity", userActivitySchema);
