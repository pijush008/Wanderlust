const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Razorpay identifiers
    razorpayOrderId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: String,

    // Amount details (in paise to avoid floats)
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: ["created", "captured", "failed", "refunded"],
      default: "created",
    },

    method: String,
    receipt: String,
    notes: { type: Map, of: String },
    capturedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
