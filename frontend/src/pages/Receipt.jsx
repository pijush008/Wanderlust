import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../utils/api";

export default function Receipt() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/payments/${id}/receipt`)
      .then((r) => setPayment(r.data.payment))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>;
  if (!payment) return <p>Receipt not found</p>;

  const b = payment.booking;
  const amountInr = (payment.amount / 100).toLocaleString("en-IN");

  const handlePrint = () => window.print();

  return (
    <div className="row justify-content-center mt-4">
      <div className="col-md-8 col-lg-7">
        <div className="text-center mb-4">
          <i className="fa-solid fa-circle-check" style={{ fontSize: "4rem", color: "#10b981" }}></i>
          <h2 className="mt-2">Payment Successful</h2>
          <p className="text-muted">Your booking is confirmed</p>
        </div>

        <div className="card receipt-card" id="printable-receipt">
          <div className="card-body p-4 p-md-5">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
              <div>
                <h4 style={{ color: "var(--primary)", fontWeight: 700 }}>
                  <i className="fa-solid fa-compass me-2"></i>Wanderlust
                </h4>
                <small className="text-muted">Payment Receipt</small>
              </div>
              <div className="text-end">
                <small className="text-muted">Receipt No.</small>
                <div><code style={{ fontSize: "0.85rem" }}>{payment.receipt}</code></div>
              </div>
            </div>

            {/* Booking details */}
            <h6 className="text-muted mb-2" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>
              BOOKING DETAILS
            </h6>
            <div className="row mb-4">
              <div className="col-md-8">
                <h5 className="mb-1">{b.listing?.title}</h5>
                <p className="text-muted mb-0">
                  <i className="fa-solid fa-location-dot"></i> {b.listing?.location}, {b.listing?.country}
                </p>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-6">
                <small className="text-muted">Check-in</small>
                <div><strong>{new Date(b.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong></div>
              </div>
              <div className="col-6">
                <small className="text-muted">Check-out</small>
                <div><strong>{new Date(b.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong></div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-6">
                <small className="text-muted">Guests</small>
                <div><strong>{b.guests}</strong></div>
              </div>
              <div className="col-6">
                <small className="text-muted">Nights</small>
                <div><strong>{b.pricing.nights}</strong></div>
              </div>
            </div>

            {/* Price breakdown */}
            <h6 className="text-muted mb-2" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>
              PRICE BREAKDOWN
            </h6>
            <table className="table table-sm mb-4">
              <tbody>
                <tr>
                  <td>Base price (per night)</td>
                  <td className="text-end">₹{b.pricing.basePrice.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td>Dynamic price (per night) <small className="text-muted">×{b.pricing.multiplier}</small></td>
                  <td className="text-end">₹{b.pricing.dynamicPrice.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td>× {b.pricing.nights} nights</td>
                  <td className="text-end">₹{(b.pricing.dynamicPrice * b.pricing.nights).toLocaleString("en-IN")}</td>
                </tr>
                <tr className="border-top">
                  <td><strong>Total Paid</strong></td>
                  <td className="text-end"><strong style={{ color: "var(--primary)", fontSize: "1.1rem" }}>₹{amountInr}</strong></td>
                </tr>
              </tbody>
            </table>

            {/* Payment details */}
            <h6 className="text-muted mb-2" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>
              PAYMENT DETAILS
            </h6>
            <div className="row">
              <div className="col-md-6 mb-2">
                <small className="text-muted">Status</small>
                <div><span className="badge bg-success">Captured</span></div>
              </div>
              <div className="col-md-6 mb-2">
                <small className="text-muted">Paid on</small>
                <div><strong>{new Date(payment.capturedAt || payment.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong></div>
              </div>
              <div className="col-12 mb-2">
                <small className="text-muted">Razorpay Payment ID</small>
                <div><code style={{ fontSize: "0.8rem" }}>{payment.razorpayPaymentId}</code></div>
              </div>
              <div className="col-12 mb-2">
                <small className="text-muted">Razorpay Order ID</small>
                <div><code style={{ fontSize: "0.8rem" }}>{payment.razorpayOrderId}</code></div>
              </div>
            </div>

            <hr />
            <p className="text-center text-muted small mb-0">
              Thank you for booking with Wanderlust!<br />
              For any queries, contact support@wanderlust.com
            </p>
          </div>
        </div>

        <div className="d-flex gap-2 mt-3 no-print">
          <button className="btn btn-dark" onClick={handlePrint}>
            <i className="fa-solid fa-print me-2"></i>Print / Save PDF
          </button>
          <Link to={`/bookings/${b._id}`} className="btn btn-outline-dark">
            View Booking
          </Link>
          <Link to="/bookings" className="btn btn-outline-secondary">
            All Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}
