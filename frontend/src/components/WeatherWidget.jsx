import { useState, useEffect } from "react";
import api from "../utils/api";

export default function WeatherWidget({ listingId }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/weather/${listingId}`)
      .then((r) => setWeather(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [listingId]);

  if (loading) {
    return (
      <div className="weather-widget card mb-3">
        <div className="card-body text-center py-3">
          <div className="spinner-border spinner-border-sm"></div>
          <span className="ms-2">Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) return null;

  const { current, forecast } = weather;

  return (
    <div className="weather-widget card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            <i className="fa-solid fa-cloud-sun me-2" style={{ color: current.color }}></i>
            Live Weather — {weather.location}
          </h5>
          <small className="text-muted">
            Updated {new Date(weather.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </small>
        </div>

        {/* Current weather */}
        <div className="row align-items-center mb-3">
          <div className="col-auto">
            <i className={`fa-solid ${current.icon}`} style={{ fontSize: "3.5rem", color: current.color }}></i>
          </div>
          <div className="col">
            <div className="d-flex align-items-baseline gap-2">
              <span style={{ fontSize: "2.5rem", fontWeight: 700 }}>{current.temperature}°</span>
              <span className="text-muted">C</span>
            </div>
            <div className="text-muted small">{current.condition}</div>
            <div className="small">Feels like {current.feelsLike}°C</div>
          </div>
          <div className="col-auto">
            <div className="weather-detail">
              <i className="fa-solid fa-droplet me-1" style={{ color: "#3498db" }}></i>
              {current.humidity}% humidity
            </div>
            <div className="weather-detail">
              <i className="fa-solid fa-wind me-1" style={{ color: "#7f8c8d" }}></i>
              {current.windSpeed} km/h wind
            </div>
            <div className="weather-detail">
              <i className={`fa-solid fa-${current.isDay ? "sun" : "moon"} me-1`} style={{ color: current.isDay ? "#f39c12" : "#34495e" }}></i>
              {current.isDay ? "Daytime" : "Night"}
            </div>
          </div>
        </div>

        {/* 5-day forecast */}
        <div className="border-top pt-3">
          <small className="text-muted fw-bold d-block mb-2">5-Day Forecast</small>
          <div className="d-flex gap-2 justify-content-between">
            {forecast.map((day) => (
              <div key={day.date} className="weather-forecast-day">
                <div className="small fw-bold">{day.day}</div>
                <i className={`fa-solid ${day.icon}`} style={{ fontSize: "1.5rem", margin: "4px 0", color: "#666" }}></i>
                <div className="small"><strong>{day.max}°</strong> / {day.min}°</div>
                {day.rainChance > 30 && (
                  <div className="small text-info">
                    <i className="fa-solid fa-droplet"></i> {day.rainChance}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
