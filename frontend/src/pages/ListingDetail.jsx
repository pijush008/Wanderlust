import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import MapView from "../components/MapView";
import NearbyPOI from "../components/NearbyPOI";
import Reviews from "../components/Reviews";
import PricingWidget from "../components/PricingWidget";
import RealtimeIndicator from "../components/RealtimeIndicator";
import SimilarListings from "../components/SimilarListings";
import ReviewSummary from "../components/ReviewSummary";
import WeatherWidget from "../components/WeatherWidget";

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [availability, setAvailability] = useState(null);
  const [poi, setPoi] = useState(null);

  const loadListing = useCallback(() => {
    return api.get(`/listings/${id}`).then((r) => setListing(r.data.listing));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    loadListing()
      .then(() => api.get(`/maps/${id}/poi`).then((r) => setPoi(r.data.poi)).catch(() => {}))
      .finally(() => setLoading(false));
  }, [id, loadListing]);

  useEffect(() => {
    if (!checkIn || !checkOut) { setAvailability(null); return; }
    const t = setTimeout(() => {
      api.get(`/listings/${id}/availability?checkIn=${checkIn}&checkOut=${checkOut}`)
        .then((r) => setAvailability(r.data));
    }, 300);
    return () => clearTimeout(t);
  }, [checkIn, checkOut, id]);

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/listings/${id}/book`, { checkIn, checkOut, guests });
      toast.show(data.message, "success");
      navigate(`/pay/${data.booking._id}`);
    } catch (err) {
      toast.show(err.response?.data?.error || "Booking failed", "error");
    }
  };

  const handleJoinWaitlist = async () => {
    if (!checkIn || !checkOut) return toast.show("Pick dates first", "error");
    try {
      const { data } = await api.post(`/waitlist/${id}/join`, { checkIn, checkOut, guests });
      toast.show(data.message, "success");
    } catch (err) {
      toast.show(err.response?.data?.error || "Failed", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this listing?")) return;
    await api.delete(`/listings/${id}`);
    toast.show("Listing deleted", "success");
    navigate("/listings");
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>;
  if (!listing) return <p>Listing not found</p>;

  const isOwner = user && listing.owner?._id === user._id;
  const showWaitlist = availability && !availability.available;

  return (
    <div className="row">
      <div className="col-md-8 offset-md-2">
        <RealtimeIndicator listingId={id} />

        <h2 className="mt-3">{listing.title}</h2>

        <div className="card mb-3">
          <img
            src={listing.image?.url}
            className="card-img-top"
            style={{ height: "50vh", objectFit: "cover", borderRadius: "12px 12px 0 0" }}
            alt={listing.title}
            loading="lazy"
          />
          <div className="card-body">
            <i>Owned by – {listing.owner?.username || "Unknown"}</i>
            <p className="mt-2">{listing.description}</p>
            <p><i className="fa-solid fa-location-dot"></i> {listing.location}, {listing.country}</p>
            <p><strong>Base price:</strong> ₹{Number(listing.price).toLocaleString("en-IN")}/night</p>
          </div>
        </div>

        {/* Live Weather */}
        <WeatherWidget listingId={id} />

        {/* Dynamic Pricing Widget */}
        <PricingWidget listingId={id} />

        {/* Booking form */}
        {user && !isOwner && (
          <div className="card booking-form-card mb-3">
            <div className="card-body">
              <h5><i className="fa-solid fa-calendar-plus me-2"></i>Book This Place</h5>
              <form onSubmit={handleBook}>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="small">Check-in</label>
                    <input type="date" className="form-control" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} min={new Date().toISOString().split("T")[0]} required />
                  </div>
                  <div className="col-6">
                    <label className="small">Check-out</label>
                    <input type="date" className="form-control" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="small">Guests</label>
                  <select className="form-select" value={guests} onChange={(e) => setGuests(e.target.value)}>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                {availability && (
                  <div className={`alert ${availability.available ? "alert-success" : "alert-danger"} py-2`}>
                    {availability.available
                      ? `✓ Available — ₹${availability.pricing.totalAmount.toLocaleString("en-IN")} total (${availability.pricing.nights} nights)`
                      : "Not available — join the waitlist below"}
                  </div>
                )}
                <button type="submit" className="btn btn-danger w-100" disabled={availability && !availability.available}>Reserve</button>
                {showWaitlist && (
                  <button type="button" className="btn btn-outline-warning w-100 mt-2" onClick={handleJoinWaitlist}>
                    <i className="fa-solid fa-clock-rotate-left me-1"></i>Join Waitlist
                  </button>
                )}
              </form>
            </div>
          </div>
        )}

        {isOwner && (
          <div className="mb-3 d-flex gap-2">
            <Link className="btn btn-dark" to={`/listings/${id}/edit`}>Edit</Link>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        )}

        {!user && (
          <div className="alert alert-info">
            <Link to="/login">Login</Link> to book this place
          </div>
        )}

        {/* AI Review Summary */}
        <ReviewSummary listingId={id} reviewCount={listing.reviews?.length || 0} />

        {/* Map + POI */}
        <div className="mt-4">
          <h3><i className="fa-solid fa-map-location-dot me-2"></i>Where you'll be</h3>
          <MapView listing={listing} poi={poi} />
        </div>

        {poi && (
          <div className="nearby-poi mt-4">
            <h5><i className="fa-solid fa-map-pin me-2"></i>What's Nearby</h5>
            <NearbyPOI poi={poi} />
          </div>
        )}

        {/* Reviews */}
        <Reviews listingId={id} reviews={listing.reviews} onUpdate={loadListing} />

        {/* Similar listings */}
        <SimilarListings listingId={id} />
      </div>
    </div>
  );
}
