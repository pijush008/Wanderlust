import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function Stars({ rating, size = "1rem" }) {
  return (
    <span style={{ color: "#f39c12", fontSize: size }}>
      {"★".repeat(rating)}
      <span style={{ color: "#ccc" }}>{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function Reviews({ listingId, reviews, onUpdate }) {
  const { user } = useAuth();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const avg = reviews?.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return toast.show("Please pick a rating", "error");
    setSubmitting(true);
    try {
      await api.post(`/listings/${listingId}/reviews`, { review: { rating, comment } });
      toast.show("Review added!", "success");
      setRating(0);
      setComment("");
      onUpdate?.();
    } catch (err) {
      toast.show(err.response?.data?.error || "Failed", "error");
    }
    setSubmitting(false);
  };

  const handleDelete = async (reviewId) => {
    if (!confirm("Delete this review?")) return;
    try {
      await api.delete(`/listings/${listingId}/reviews/${reviewId}`);
      toast.show("Review deleted", "success");
      onUpdate?.();
    } catch (err) {
      toast.show(err.response?.data?.error || "Failed", "error");
    }
  };

  return (
    <div className="reviews mt-4">
      <div className="d-flex align-items-baseline gap-3 mb-3">
        <h4 className="mb-0">
          <i className="fa-solid fa-star me-2" style={{ color: "#f39c12" }}></i>
          Reviews
        </h4>
        {reviews?.length > 0 && (
          <span className="text-muted">
            <Stars rating={Math.round(avg)} /> {avg} · {reviews.length} review{reviews.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="card mb-3">
          <div className="card-body">
            <h6>Leave a Review</h6>
            <div className="mb-2">
              <label className="small d-block">Rating</label>
              {[1, 2, 3, 4, 5].map((n) => (
                <i
                  key={n}
                  className={`fa-solid fa-star ${(hover || rating) >= n ? "" : "text-muted"}`}
                  style={{
                    color: (hover || rating) >= n ? "#f39c12" : "#ddd",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    marginRight: "4px",
                  }}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                ></i>
              ))}
            </div>
            <div className="mb-2">
              <textarea
                className="form-control"
                rows="3"
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-outline-dark" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      ) : (
        <div className="alert alert-info">
          <Link to="/login">Login</Link> to leave a review
        </div>
      )}

      <div className="row g-3">
        {reviews?.length === 0 && (
          <p className="text-muted">No reviews yet. Be the first!</p>
        )}
        {reviews?.map((r) => (
          <div key={r._id} className="col-md-6">
            <div className="card review-card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">@{r.author?.username || "Deleted User"}</h6>
                    <Stars rating={r.rating} />
                  </div>
                  {user && r.author && user._id === r.author._id && (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(r._id)}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  )}
                </div>
                <p className="mt-2 mb-0">{r.comment}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
