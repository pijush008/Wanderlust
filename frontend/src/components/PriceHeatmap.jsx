import { useState, useEffect } from "react";
import api from "../utils/api";

const HEAT_COLORS = {
  very_high: "#e74c3c",
  high: "#e67e22",
  medium: "#f1c40f",
  low: "#27ae60",
  very_low: "#3498db",
};

export default function PriceHeatmap() {
  const [heatmap, setHeatmap] = useState([]);

  useEffect(() => {
    api.get("/filter/heatmap")
      .then((r) => setHeatmap(r.data.heatmap || []))
      .catch(() => {});
  }, []);

  if (heatmap.length === 0) return null;

  return (
    <div className="mb-3">
      <h6><i className="fa-solid fa-fire me-1"></i>Price Heatmap (by location)</h6>
      <div className="d-flex flex-wrap gap-2">
        {heatmap.slice(0, 12).map((loc) => (
          <div
            key={loc.location}
            className="heatmap-chip"
            style={{
              background: `${HEAT_COLORS[loc.heatLevel]}20`,
              border: `1px solid ${HEAT_COLORS[loc.heatLevel]}`,
              padding: "4px 10px",
              borderRadius: "16px",
              fontSize: "0.75rem",
            }}
          >
            <strong style={{ color: HEAT_COLORS[loc.heatLevel] }}>{loc.location}</strong>{" "}
            <small>₹{loc.avgPrice.toLocaleString("en-IN")}/avg</small>
          </div>
        ))}
      </div>
    </div>
  );
}
