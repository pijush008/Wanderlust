import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";

export default function Waitlist() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get("/waitlist")
      .then((r) => setEntries(r.data.entries || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleLeave = async (waitlistId) => {
    if (!confirm("Leave the waitlist for this listing?")) return;
    try {
      await api.post(`/waitlist/${waitlistId}/leave`);
      toast.show("Removed from waitlist", "success");
      load();
    } catch (err) {
      toast.show(err.response?.data?.error || "Failed", "error");
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>;

  return (
    <>
      <h3 className="mt-3"><i className="fa-solid fa-clock-rotate-left me-2"></i>My Waitlist</h3>
      {entries.length === 0 ? (
        <div className="text-center py-5">
          <i className="fa-solid fa-hourglass-empty" style={{ fontSize: "3rem", color: "#ccc" }}></i>
          <h5 className="mt-3">No waitlist entries</h5>
          <p className="text-muted">When a listing you want is fully booked, join the waitlist.</p>
          <Link to="/listings" className="btn btn-dark">Browse Listings</Link>
        </div>
      ) : (
        <div className="row g-3">
          {entries.map((e) => (
            <div key={e._id} className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6>{e.listing?.title || "Listing"}</h6>
                      <small className="text-muted"><i className="fa-solid fa-location-dot"></i> {e.listing?.location}</small>
                    </div>
                    <span className={`badge ${e.status === "notified" ? "bg-success" : "bg-secondary"}`}>
                      {e.status === "waiting" ? `#${e.position} in queue` : "🎉 Slot Available!"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <small>
                      <i className="fa-solid fa-calendar"></i>{" "}
                      {new Date(e.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} –{" "}
                      {new Date(e.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </small>
                  </div>
                  {e.status === "notified" && e.expiresAt && (
                    <div className="alert alert-success py-2 mt-2 mb-0">
                      <strong>Your turn!</strong> Book before {new Date(e.expiresAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                  <div className="mt-2 d-flex gap-2">
                    {e.status === "notified" && (
                      <Link to={`/listings/${e.listing?._id}`} className="btn btn-sm btn-danger">Book Now</Link>
                    )}
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => handleLeave(e._id)}>
                      Leave Waitlist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
