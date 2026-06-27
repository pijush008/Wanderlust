import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

export default function Recommendations() {
  const [recs, setRecs] = useState([]);
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/recommendations")
      .then((r) => { setRecs(r.data.recommendations); setMethod(r.data.method); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>;

  return (
    <>
      <h3 className="mt-3"><i className="fa-solid fa-sparkles me-2"></i>Recommended For You</h3>
      <p className="text-muted">{method} filtering</p>
      <div className="row row-cols-lg-4 row-cols-md-3 g-3">
        {recs.map((r) => (
          <div key={r._id} className="col">
            <Link to={`/listings/${r._id}`} className="text-decoration-none text-dark">
              <div className="card listing-card">
                <img src={r.image} alt={r.title} style={{ height: "18rem", objectFit: "cover" }} />
                <div className="card-body">
                  <strong>{r.title}</strong><br />
                  <small><i className="fa-solid fa-location-dot"></i> {r.location}</small>
                  <p><strong>₹{Number(r.price).toLocaleString("en-IN")}</strong>/night</p>
                  <small className="text-muted">{r.reason}</small>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
