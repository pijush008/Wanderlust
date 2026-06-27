const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/payment");
const Booking = require("../models/booking");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create-order
exports.createOrder = async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ error: "bookingId required" });

  const booking = await Booking.findById(bookingId).populate("listing");
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.guest.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: "Not your booking" });
  }

  // Convert ₹ to paise (Razorpay needs integer paise)
  const amountInPaise = Math.round(booking.pricing.totalAmount * 100);
  if (amountInPaise < 100) {
    return res.status(400).json({ error: "Amount must be at least ₹1" });
  }

  const receipt = `bkg_${booking._id.toString().slice(-10)}_${Date.now().toString().slice(-6)}`;

  try {
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString(),
        listingTitle: booking.listing.title,
      },
    });

    // Save payment record (status: created)
    await Payment.create({
      booking: booking._id,
      user: req.user._id,
      razorpayOrderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      receipt,
      status: "created",
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // Safe to send — public key
      booking: {
        id: booking._id,
        title: booking.listing.title,
        guest: req.user.username,
        email: req.user.email,
        total: booking.pricing.totalAmount,
      },
    });
  } catch (err) {
    console.error("Razorpay create order error:", err.statusCode, err.error);
    if (err.statusCode === 401) return res.status(401).json({ error: "Razorpay auth failed" });
    res.status(500).json({ error: "Could not create order" });
  }
};

// POST /api/payments/verify
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment fields" });
  }

  // Verify HMAC-SHA256 signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    // Mark as failed but don't reveal why
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { status: "failed", razorpayPaymentId: razorpay_payment_id }
    );
    return res.status(400).json({ error: "Invalid signature — payment not verified" });
  }

  // Signature valid — mark as captured
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "captured",
      capturedAt: new Date(),
    },
    { new: true }
  ).populate({ path: "booking", populate: { path: "listing" } });

  if (!payment) return res.status(404).json({ error: "Payment record not found" });

  res.json({
    success: true,
    paymentId: payment._id,
    razorpayPaymentId: razorpay_payment_id,
    booking: payment.booking,
  });
};

// GET /api/payments/:id/receipt
exports.getReceipt = async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate({ path: "booking", populate: { path: "listing" } })
    .populate("user");
  if (!payment) return res.status(404).json({ error: "Receipt not found" });
  if (payment.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: "Not authorized" });
  }
  res.json({ payment });
};

// POST /api/payments/failed (log failed attempts)
exports.markFailed = async (req, res) => {
  const { razorpay_order_id, error_code, error_description } = req.body;
  if (!razorpay_order_id) return res.status(400).json({ error: "Missing order id" });
  await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    { status: "failed", notes: new Map([["error_code", error_code || ""], ["error_description", error_description || ""]]) }
  );
  res.json({ logged: true });
};
