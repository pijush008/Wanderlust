import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView({ listing, poi }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!listing?.geometry?.coordinates || !mapContainer.current) return;

    const coordinates = listing.geometry.coordinates;

    if (mapRef.current) mapRef.current.remove();

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: coordinates,
      zoom: 12,
    });

    mapRef.current = map;

    // Main listing marker
    new mapboxgl.Marker({ color: "#ff5a5f" })
      .setLngLat(coordinates)
      .setPopup(
        new mapboxgl.Popup({ offset: 15 }).setHTML(
          `<h6 style="margin:0">${listing.title}</h6><small>Exact location after booking</small>`
        )
      )
      .addTo(map);

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // POI markers
    if (poi) {
      const colors = {
        restaurants: "#e74c3c",
        hospitals: "#3498db",
        railway_stations: "#2c3e50",
        tourist_attractions: "#27ae60",
      };

      for (const [category, items] of Object.entries(poi)) {
        items?.forEach((item) => {
          if (!item.lat || !item.lng) return;
          const el = document.createElement("div");
          el.style.cssText = `width:12px;height:12px;border-radius:50%;background:${colors[category]};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);`;
          new mapboxgl.Marker(el)
            .setLngLat([item.lng, item.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 10 }).setHTML(
                `<strong>${item.name}</strong>${item.rating ? `<br>★ ${item.rating}` : ""}${
                  item.distance != null ? `<br>${item.distance} km away` : ""
                }`
              )
            )
            .addTo(map);
        });
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [listing, poi]);

  return <div ref={mapContainer} style={{ height: "400px", width: "100%", borderRadius: "12px" }} />;
}
