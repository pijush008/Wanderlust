const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: String,
  filename: String,
});

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    image: {
      type: imageSchema,
      default: {
        url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        filename: "default-image",
      },
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    location: {
      type: String,
      required: true,
    },

    country: {
      type: String,
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    geometry:{
type:{
type:String,
enum:["Point"],
required:true,
},
coordinates:{
type:[Number],
required:true,
},
    },

    // ================= ADVANCED FILTER FIELDS =================
    category: {
      type: String,
      enum: [
        "mountains", "arctic", "farms", "beaches", "castles",
        "camping", "rooms", "iconic_cities", "boats", "domes", "homes",
      ],
      default: "homes",
    },

    // Cancellation policy
    cancellationPolicy: {
      type: String,
      enum: ["flexible", "moderate", "strict"],
      default: "moderate",
    },

    // Instant booking (no host approval needed)
    instantBook: {
      type: Boolean,
      default: false,
    },

    // Family-friendly features
    familyFriendly: {
      childSafe: { type: Boolean, default: false },
      hasHighChair: { type: Boolean, default: false },
      hasCrib: { type: Boolean, default: false },
      kidsActivities: { type: Boolean, default: false },
      familyScore: { type: Number, default: 0, min: 0, max: 100 },
    },

    // Pet-friendly features
    petFriendly: {
      allowed: { type: Boolean, default: false },
      hasPetBed: { type: Boolean, default: false },
      hasYard: { type: Boolean, default: false },
      petFee: { type: Number, default: 0 },
      petScore: { type: Number, default: 0, min: 0, max: 100 },
    },

    // Amenities (for scoring)
    amenities: {
      type: [String],
      default: [],
    },

    // Max guests
    maxGuests: {
      type: Number,
      default: 4,
      min: 1,
      max: 20,
    },
  },
  { timestamps: true }
);

// ================= TEXT INDEX FOR SEARCH =================
listingSchema.index({
  title: "text",
  description: "text",
  location: "text",
  country: "text",
});

// ================= GEO INDEX FOR NEARBY QUERIES =================
listingSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("Listing", listingSchema);
