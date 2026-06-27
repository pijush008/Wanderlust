import { useState, useEffect } from "react";
import api from "../utils/api";
import ListingCard from "../components/ListingCard";

const FILTERS = [
  { cat: "trending", icon: "fa-fire", label: "Trending" },
  { cat: "mountains", icon: "fa-mountain-city", label: "Mountains" },
  { cat: "beaches", icon: "fa-umbrella-beach", label: "Beaches" },
  { cat: "iconic_cities", icon: "fa-city", label: "Cities" },
  { cat: "castles", icon: "fa-fort-awesome", label: "Castles" },
  { cat: "camping", icon: "fa-campground", label: "Camping" },
  { cat: "farms", icon: "fa-tractor", label: "Farms" },
  { cat: "homes", icon: "fa-house", label: "Homes" },
  { cat: "boats", icon: "fa-sailboat", label: "Boats" },
  { cat: "rooms", icon: "fa-hotel", label: "Rooms" },
];

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => {
    api.get("/listings")
      .then((r) => setListings(r.data.listings))
      .finally(() => setLoading(false));
  }, []);

  const filtered = !activeFilter || activeFilter === "trending"
    ? listings
    : listings.filter((l) => (l.category || "homes") === activeFilter);

  return (
    <>
      {/* Category Filters */}
      <div id="filters">
        {FILTERS.map((f) => (
          <div
            key={f.cat}
            className={`filter ${activeFilter === f.cat ? "filter-active" : ""}`}
            onClick={() => setActiveFilter(activeFilter === f.cat ? null : f.cat)}
          >
            <i className={`fa-solid ${f.icon}`}></i>
            <p>{f.label}</p>
          </div>
        ))}
      </div>

      {/* Listing Count */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0 text-muted">
          {loading ? "Loading..." : `${filtered.length} ${filtered.length === 1 ? "place" : "places"} to stay`}
          {activeFilter && activeFilter !== "trending" && (
            <span className="ms-2 badge bg-light text-dark" style={{ textTransform: "capitalize" }}>
              {activeFilter.replace("_", " ")}
            </span>
          )}
        </h6>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5">
          <i className="fa-solid fa-house-circle-xmark" style={{ fontSize: "3rem", color: "#ccc" }}></i>
          <h5 className="mt-3">No listings in this category yet</h5>
          <p className="text-muted">Try a different category</p>
        </div>
      ) : (
        <div className="row row-cols-xl-4 row-cols-lg-3 row-cols-md-2 row-cols-1 g-4">
          {filtered.map((l) => <ListingCard key={l._id} listing={l} />)}
        </div>
      )}
    </>
  );
}
