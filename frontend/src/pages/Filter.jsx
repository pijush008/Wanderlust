import { useState, useEffect } from "react";
import api from "../utils/api";
import ListingCard from "../components/ListingCard";
import PriceHeatmap from "../components/PriceHeatmap";

export default function Filter() {
  const [options, setOptions] = useState({ categories: [], sortOptions: [] });
  const [filters, setFilters] = useState({
    q: "", minPrice: "", maxPrice: "", category: "",
    cancellation: "", instantBook: "", familyFriendly: "", petFriendly: "",
    minGuests: "", sortBy: "",
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/filter/options").then((r) => setOptions(r.data));
    runFilter({});
  }, []);

  const runFilter = async (f) => {
    setLoading(true);
    const params = Object.entries(f).filter(([_, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    const { data } = await api.get(`/filter?${params}`);
    setResults(data.results);
    setLoading(false);
  };

  const handleSubmit = (e) => { e.preventDefault(); runFilter(filters); };
  const update = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const toggle = (k) => () => setFilters({ ...filters, [k]: filters[k] === "true" ? "" : "true" });

  return (
    <>
      <h4 className="mt-3"><i className="fa-solid fa-sliders me-2"></i>Advanced Filters</h4>
      <PriceHeatmap />

      <form className="row g-2 mb-3" onSubmit={handleSubmit}>
        <div className="col-md-3"><input className="form-control" placeholder="Search..." value={filters.q} onChange={update("q")} /></div>
        <div className="col-md-2"><input type="number" className="form-control" placeholder="Min ₹" value={filters.minPrice} onChange={update("minPrice")} /></div>
        <div className="col-md-2"><input type="number" className="form-control" placeholder="Max ₹" value={filters.maxPrice} onChange={update("maxPrice")} /></div>
        <div className="col-md-2">
          <select className="form-select" value={filters.category} onChange={update("category")}>
            <option value="">All Categories</option>
            {options.categories.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
          </select>
        </div>
        <div className="col-md-2">
          <select className="form-select" value={filters.sortBy} onChange={update("sortBy")}>
            <option value="">Sort by</option>
            <option value="price_asc">Price: Low</option>
            <option value="price_desc">Price: High</option>
            <option value="family">Family</option>
            <option value="pet">Pet</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        <div className="col-md-1"><button className="btn btn-danger w-100"><i className="fa-solid fa-filter"></i></button></div>

        <div className="col-12 d-flex flex-wrap gap-3 mt-3">
          <div className="form-check">
            <input type="checkbox" className="form-check-input" id="instantBook" checked={filters.instantBook === "true"} onChange={toggle("instantBook")} />
            <label htmlFor="instantBook" className="form-check-label"><i className="fa-solid fa-bolt me-1" style={{ color: "#ff5a5f" }}></i>Instant Book</label>
          </div>
          <div className="form-check">
            <input type="checkbox" className="form-check-input" id="familyFriendly" checked={filters.familyFriendly === "true"} onChange={toggle("familyFriendly")} />
            <label htmlFor="familyFriendly" className="form-check-label"><i className="fa-solid fa-children me-1" style={{ color: "#27ae60" }}></i>Family-Friendly</label>
          </div>
          <div className="form-check">
            <input type="checkbox" className="form-check-input" id="petFriendly" checked={filters.petFriendly === "true"} onChange={toggle("petFriendly")} />
            <label htmlFor="petFriendly" className="form-check-label"><i className="fa-solid fa-paw me-1" style={{ color: "#8e44ad" }}></i>Pet-Friendly</label>
          </div>
          <select className="form-select form-select-sm" style={{ maxWidth: "180px" }} value={filters.cancellation} onChange={update("cancellation")}>
            <option value="">Any cancellation</option>
            <option value="flexible">🟢 Flexible</option>
            <option value="moderate">🟡 Moderate</option>
            <option value="strict">🔴 Strict</option>
          </select>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border"></div></div>
      ) : (
        <div className="row row-cols-lg-4 row-cols-md-3 g-3">
          {results.map((l) => <ListingCard key={l._id} listing={l} />)}
          {results.length === 0 && <p>No results — try adjusting filters</p>}
        </div>
      )}
    </>
  );
}
