import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then((r) => setBooking(r.data.booking))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm("Cancel this booking?")) return;
    await api.post(`/bookings/${id}/cancel`, { reason: "User cancelled" });
    toast.show("Booking cancelled", "success");
    navigate("/bookings");
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>;
  if (!booking) return <p>Not found</p>;

  return (
    <>
      <div className="text-center mt-3">
        <i className="fa-solid fa-circle-check" style={{ fontSize: "4rem", color: "#28a745" }}></i>
        <h2>Booking Confirmed!</h2>
      </div>
      <div className="card mt-3">
        <div className="card-body">
          <h4>{booking.listing.title}</h4>
          <p>{booking.listing.location}, {booking.listing.country}</p>
          <p><strong>Check-in:</strong> {new Date(booking.checkIn).toLocaleDateString()}</p>
          <p><strong>Check-out:</strong> {new Date(booking.checkOut).toLocaleDateString()}</p>
          <p><strong>Total:</strong> ₹{Number(booking.pricing.totalAmount).toLocaleString("en-IN")}</p>
          {booking.status === "confirmed" && (
            <div className="d-flex gap-2 mt-3">
              <Link to={`/pay/${booking._id}`} className="btn btn-danger">
                <i className="fa-solid fa-credit-card me-2"></i>Pay Now
              </Link>
              <button className="btn btn-outline-danger" onClick={handleCancel}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
