import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

export default function SimilarListings({ listingId }) {
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    api.get(`/recommendations/similar/${listingId}`)
      .then((r) => setSimilar(r.data.similar || []))
      .catch(() => {});
  }, [listingId]);

  if (similar.length === 0) return null;

  return (
    <div className="mt-4">
      <h4><i className="fa-solid fa-thumbs-up me-2"></i>You may also like</h4>
      <div className="row row-cols-md-3 g-3 mt-2">
        {similar.map((s) => (
          <div key={s._id} className="col">
            <Link to={`/listings/${s._id}`} className="text-decoration-none text-dark">
              <div className="card listing-card">
                <img src={s.image} alt={s.title} style={{ height: "12rem", objectFit: "cover" }} />
                <div className="card-body">
                  <strong>{s.title}</strong><br />
                  <small className="text-muted"><i className="fa-solid fa-location-dot"></i> {s.location}</small>
                  <p className="mb-0 mt-1"><strong>₹{Number(s.price).toLocaleString("en-IN")}</strong>/night</p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
