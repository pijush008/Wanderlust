import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`)
      .then((r) => setBooking(r.data.booking))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handlePay = async () => {
    if (typeof window.Razorpay === "undefined") {
      toast.show("Payment system not loaded. Refresh the page.", "error");
      return;
    }

    setProcessing(true);

    try {
      // 1. Create order on backend
      const { data: orderData } = await api.post("/payments/create-order", { bookingId });

      // 2. Open Razorpay modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "Wanderlust",
        description: orderData.booking.title,
        image: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        prefill: {
          name: orderData.booking.guest,
          email: orderData.booking.email,
          method: "upi",
        },
        // Configure payment methods — show UPI/QR prominently
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI / QR Code",
                instruments: [
                  { method: "upi", flows: ["qr", "intent", "collect"] },
                ],
              },
              other: {
                name: "Other payment methods",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" },
                ],
              },
            },
            sequence: ["block.upi", "block.other"],
            preferences: { show_default_blocks: false },
          },
        },
        theme: { color: "#ff385c" },
        handler: async (response) => {
          // 3. Verify on backend
          try {
            const verify = await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.show("Payment successful!", "success");
            navigate(`/payments/${verify.data.paymentId}/receipt`);
          } catch (err) {
            toast.show(err.response?.data?.error || "Payment verification failed", "error");
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.show("Payment cancelled", "warning");
            setProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", async (response) => {
        toast.show("Payment failed: " + response.error.description, "error");
        await api.post("/payments/failed", {
          razorpay_order_id: response.error.metadata?.order_id,
          error_code: response.error.code,
          error_description: response.error.description,
        }).catch(() => {});
        setProcessing(false);
      });

      rzp.open();
    } catch (err) {
      toast.show(err.response?.data?.error || "Could not start payment", "error");
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>;
  if (!booking) return <p>Booking not found</p>;

  return (
    <div className="row justify-content-center mt-4">
      <div className="col-md-7 col-lg-6">
        <h2 className="mb-3"><i className="fa-solid fa-credit-card me-2"></i>Confirm & Pay</h2>

        <div className="card mb-3">
          <div className="card-body">
            <div className="d-flex gap-3 mb-3">
              <img
                src={booking.listing?.image?.url}
                alt={booking.listing?.title}
                style={{ width: 100, height: 80, objectFit: "cover", borderRadius: 8 }}
              />
              <div>
                <h6 className="mb-1">{booking.listing?.title}</h6>
                <small className="text-muted">
                  <i className="fa-solid fa-location-dot"></i> {booking.listing?.location}
                </small>
              </div>
            </div>

            <hr />

            <div className="d-flex justify-content-between">
              <span>Check-in</span>
              <strong>{new Date(booking.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <span>Check-out</span>
              <strong>{new Date(booking.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <span>Guests</span>
              <strong>{booking.guests}</strong>
            </div>

            <hr />

            <div className="d-flex justify-content-between">
              <span>₹{booking.pricing.dynamicPrice.toLocaleString("en-IN")} × {booking.pricing.nights} nights</span>
              <span>₹{(booking.pricing.dynamicPrice * booking.pricing.nights).toLocaleString("en-IN")}</span>
            </div>

            <hr />

            <div className="d-flex justify-content-between">
              <strong style={{ fontSize: "1.1rem" }}>Total (INR)</strong>
              <strong style={{ fontSize: "1.1rem", color: "var(--primary)" }}>
                ₹{booking.pricing.totalAmount.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        </div>

        <button className="btn btn-danger btn-lg w-100" onClick={handlePay} disabled={processing}>
          {processing ? (
            <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
          ) : (
            <><i className="fa-solid fa-lock me-2"></i>Pay ₹{booking.pricing.totalAmount.toLocaleString("en-IN")} via Razorpay</>
          )}
        </button>

        <p className="text-center text-muted small mt-3">
          <i className="fa-solid fa-shield-halved me-1"></i>
          Secured by Razorpay · <strong>Test mode</strong>
          <br />
          <span className="d-block mt-1">
            <strong>QR / UPI:</strong> Scan QR or use UPI ID <code>success@razorpay</code>
            <br />
            <strong>Card:</strong> <code>4718 6091 0820 4366</code> · any future expiry · any CVV
          </span>
        </p>
      </div>
    </div>
  );
}
