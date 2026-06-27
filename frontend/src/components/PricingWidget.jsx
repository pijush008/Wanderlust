import { useState, useEffect } from "react";
import api from "../utils/api";

const STATUS_MAP = {
  surge: { text: "⚡ Surge Pricing", class: "bg-danger" },
  high: { text: "📈 High Demand", class: "bg-warning text-dark" },
  normal: { text: "✓ Normal", class: "bg-success" },
  low: { text: "📉 Low Season", class: "bg-info" },
  discount: { text: "🏷️ Discounted", class: "bg-primary" },
};

export default function PricingWidget({ listingId }) {
  const [data, setData] = useState(null);
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    api.get(`/pricing/${listingId}/breakdown`).then((r) => setData(r.data)).catch(() => {});
    api.get(`/pricing/${listingId}/analytics`).then((r) => setForecast(r.data.forecast || [])).catch(() => {});
  }, [listingId]);

  if (!data) return null;

  const s = STATUS_MAP[data.status] || STATUS_MAP.normal;
  const breakdown = data.breakdown;

  return (
    <div className="pricing-widget card mb-3">
      <div className="card-body">
        <h5 className="card-title"><i className="fa-solid fa-chart-line me-2"></i>Dynamic Pricing</h5>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <span className="text-muted">Today's Price</span>
            <h3 className="mb-0">₹{Number(data.finalPrice).toLocaleString("en-IN")}</h3>
          </div>
          <div className="text-end">
            <span className={`badge ${s.class}`}>{s.text}</span>
            <div className="text-muted small">
              {data.percentChange >= 0 ? "+" : ""}{data.percentChange}% from base
            </div>
          </div>
        </div>

        <table className="table table-sm table-borderless mb-3">
          <tbody>
            <tr><td>Base Price</td><td className="text-end">₹{Number(data.basePrice).toLocaleString("en-IN")}</td></tr>
            <tr><td>{breakdown.weekend.label}</td><td className={`text-end ${breakdown.weekend.multiplier > 1 ? "text-danger" : ""}`}>×{breakdown.weekend.multiplier}</td></tr>
            {breakdown.festival.name && <tr><td>🎉 {breakdown.festival.name}</td><td className="text-end text-danger fw-bold">×{breakdown.festival.multiplier}</td></tr>}
            <tr><td>Season ({breakdown.season.label})</td><td className="text-end">×{breakdown.season.multiplier}</td></tr>
            <tr><td>Demand</td><td className="text-end">×{breakdown.demand.multiplier}</td></tr>
            <tr><td>Occupancy</td><td className="text-end">×{breakdown.occupancy.multiplier}</td></tr>
            <tr className="border-top"><td><strong>Final</strong></td><td className="text-end"><strong>₹{Number(data.finalPrice).toLocaleString("en-IN")}</strong></td></tr>
          </tbody>
        </table>

        {forecast.length > 0 && (
          <div>
            <small className="text-muted fw-bold">7-Day Forecast</small>
            <div className="d-flex gap-1 mt-1">
              {forecast.map((day) => {
                const cls = day.status === "surge" ? "forecast-surge"
                  : day.status === "high" ? "forecast-high"
                  : day.status === "discount" ? "forecast-discount"
                  : "forecast-normal";
                return (
                  <div key={day.date} className={`forecast-day ${cls}`}>
                    <div className="forecast-day-label">{day.day.slice(0, 3)}</div>
                    <div className="forecast-day-price">₹{(day.price / 1000).toFixed(1)}k</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
