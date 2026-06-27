import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    const t = setTimeout(() => {
      api.get(`/search/autocomplete?q=${encodeURIComponent(query)}`)
        .then((r) => setSuggestions(r.data.suggestions || []));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const handleFocus = async () => {
    setOpen(true);
    if (!query && trending.length === 0) {
      const { data } = await api.get("/search/trending");
      setTrending(data.trending || []);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  const selectSuggestion = (s) => {
    if (s.type === "listing" && s.id) navigate(`/listings/${s.id}`);
    else { setQuery(s.text); navigate(`/search?q=${encodeURIComponent(s.text)}`); }
    setOpen(false);
  };

  const handleKey = (e) => {
    const items = query ? suggestions : trending;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(active + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(active - 1, -1)); }
    else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      const item = items[active];
      if (query) selectSuggestion(item);
      else { setQuery(item._id); navigate(`/search?q=${encodeURIComponent(item._id)}`); setOpen(false); }
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <form ref={ref} className="search-form position-relative d-flex flex-grow-1 me-lg-3 my-2 my-lg-0" onSubmit={handleSubmit}>
      <div className="position-relative flex-grow-1" style={{ maxWidth: "400px" }}>
        <input
          className="form-control search-input"
          type="search"
          placeholder="Search destinations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKey}
          autoComplete="off"
        />
        {open && (
          <div className="autocomplete-dropdown" style={{ display: "block" }}>
            {!query && trending.length > 0 && (
              <>
                <div className="autocomplete-header"><i className="fa-solid fa-fire me-1"></i>Trending</div>
                {trending.map((t, i) => (
                  <div
                    key={t._id}
                    className={`autocomplete-item ${active === i ? "active" : ""}`}
                    onClick={() => { setQuery(t._id); navigate(`/search?q=${encodeURIComponent(t._id)}`); setOpen(false); }}
                  >
                    <i className="fa-solid fa-fire-flame-curved autocomplete-icon" style={{ color: "#ff5a5f" }}></i>
                    <div className="autocomplete-text">{t._id}<span className="autocomplete-subtext">{t.country}</span></div>
                    <span className="autocomplete-count">{t.count}</span>
                  </div>
                ))}
              </>
            )}
            {query && suggestions.length > 0 && (
              <>
                <div className="autocomplete-header">Suggestions</div>
                {suggestions.map((s, i) => (
                  <div
                    key={`${s.type}-${s.text}-${i}`}
                    className={`autocomplete-item ${active === i ? "active" : ""}`}
                    onClick={() => selectSuggestion(s)}
                  >
                    <i className={`fa-solid ${s.icon} autocomplete-icon`}></i>
                    <div className="autocomplete-text">{s.text}{s.subtext && <span className="autocomplete-subtext">{s.subtext}</span>}</div>
                    {s.count && <span className="autocomplete-count">{s.count}</span>}
                  </div>
                ))}
              </>
            )}
            {query && suggestions.length === 0 && (
              <div className="autocomplete-empty">No suggestions found</div>
            )}
          </div>
        )}
      </div>
      <button className="btn btn-danger ms-2" type="submit" style={{ borderRadius: "999px", width: "44px", height: "44px", padding: 0 }}>
        <i className="fa-solid fa-magnifying-glass"></i>
      </button>
    </form>
  );
}
