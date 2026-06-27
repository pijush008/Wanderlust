import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../utils/api";
import ListingCard from "../components/ListingCard";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) { setLoading(false); return; }
    setLoading(true);
    api.get(`/search?q=${encodeURIComponent(q)}`)
      .then((r) => setResults(r.data.results))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <>
      <h4 className="mt-3">Search results for "{q}"</h4>
      <p className="text-muted">{results.length} listing(s) found</p>
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border"></div></div>
      ) : (
        <div className="row row-cols-lg-4 row-cols-md-3 row-cols-sm-1 g-3">
          {results.map((l) => <ListingCard key={l._id} listing={l} />)}
        </div>
      )}
    </>
  );
}
