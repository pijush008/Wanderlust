import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bookings")
      .then((r) => setBookings(r.data.bookings))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>;

  return (
    <>
      <h3 className="mt-3"><i className="fa-solid fa-calendar-check me-2"></i>My Bookings</h3>
      {bookings.length === 0 ? (
        <p>No bookings yet</p>
      ) : (
        bookings.map((b) => (
          <div key={b._id} className="card mb-2">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6>{b.listing?.title || "Deleted"}</h6>
                  <small>
                    {new Date(b.checkIn).toLocaleDateString()} – {new Date(b.checkOut).toLocaleDateString()}
                  </small>
                </div>
                <span className={`badge bg-${b.status === "confirmed" ? "success" : "danger"}`}>{b.status}</span>
              </div>
              <p className="mt-2">
                <strong>₹{Number(b.pricing.totalAmount).toLocaleString("en-IN")}</strong> ({b.pricing.nights} nights)
              </p>
              <Link to={`/bookings/${b._id}`} className="btn btn-sm btn-outline-dark">View</Link>
            </div>
          </div>
        ))
      )}
    </>
  );
}
