const CATEGORIES = {
  restaurants: { icon: "fa-utensils", color: "#e74c3c", label: "Restaurants" },
  hospitals: { icon: "fa-hospital", color: "#3498db", label: "Hospitals" },
  railway_stations: { icon: "fa-train", color: "#2c3e50", label: "Railway Stations" },
  tourist_attractions: { icon: "fa-camera", color: "#27ae60", label: "Attractions" },
};

export default function NearbyPOI({ poi }) {
  if (!poi) return null;

  const hasAny = Object.values(poi).some((arr) => Array.isArray(arr) && arr.length > 0);
  if (!hasAny) {
    return <p className="text-muted">No nearby places data available for this location.</p>;
  }

  return (
    <div className="row g-3">
      {Object.entries(CATEGORIES).map(([key, cfg]) => {
        const items = poi[key] || [];
        if (items.length === 0) return null;
        return (
          <div key={key} className="col-md-6">
            <div className="poi-category">
              <h6 className="poi-category-title">
                <i className={`fa-solid ${cfg.icon}`} style={{ color: cfg.color }}></i> {cfg.label}
              </h6>
              <ul className="poi-list">
                {items.slice(0, 4).map((item, i) => (
                  <li key={i} className="poi-item">
                    <div style={{ flex: 1 }}>
                      <span className="poi-name">{item.name}</span>
                      {item.cuisine && <small className="text-muted d-block">{item.cuisine}</small>}
                      {item.phone && <small className="text-muted d-block">{item.phone}</small>}
                    </div>
                    {item.distance != null && (
                      <span className="poi-distance">{item.distance} km</span>
                    )}
                    {item.rating && <span className="poi-rating">★ {item.rating}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
