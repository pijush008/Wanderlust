import { useState, useEffect } from "react";
import api from "../utils/api";

export default function ReviewSummary({ listingId, reviewCount }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/ai/reviews/${listingId}/summary`);
      setSummary(data.summary || "Not enough reviews to summarize");
    } catch (err) {
      setSummary("AI summary unavailable");
    }
    setLoading(false);
  };

  if (reviewCount < 3) return null;

  return (
    <div className="card mb-3 ai-summary-card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0"><i className="fa-solid fa-wand-magic-sparkles me-2"></i>AI Review Summary</h6>
          {!summary && (
            <button className="btn btn-sm btn-outline-dark" onClick={generate} disabled={loading}>
              {loading ? "Generating..." : "Summarize Reviews"}
            </button>
          )}
        </div>
        {summary && (
          <div className="mt-2" style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>{summary}</div>
        )}
      </div>
    </div>
  );
}
