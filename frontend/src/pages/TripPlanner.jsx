import { useState } from "react";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";

export default function TripPlanner() {
  const toast = useToast();
  const [form, setForm] = useState({ from: "", to: "", budget: "", days: 3, tripType: "friends", travelers: 2 });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/trips/plan", form);
      setPlan(data);
    } catch (err) {
      toast.show(err.response?.data?.error || "Failed", "error");
    }
    setLoading(false);
  };

  return (
    <div className="col-md-10 offset-md-1">
      <h2 className="mt-3"><i className="fa-solid fa-route me-2"></i>Smart Trip Planner</h2>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-2">
              <div className="col-md-6"><label>From</label><input className="form-control" value={form.from} onChange={update("from")} placeholder="Kolkata" required /></div>
              <div className="col-md-6"><label>To</label><input className="form-control" value={form.to} onChange={update("to")} placeholder="Goa" required /></div>
              <div className="col-md-4"><label>Budget (₹)</label><input type="number" className="form-control" value={form.budget} onChange={update("budget")} placeholder="20000" required /></div>
              <div className="col-md-4"><label>Days</label><input type="number" className="form-control" value={form.days} onChange={update("days")} required /></div>
              <div className="col-md-4">
                <label>Type</label>
                <select className="form-select" value={form.tripType} onChange={update("tripType")}>
                  <option value="friends">Friends</option>
                  <option value="couple">Couple</option>
                  <option value="family">Family</option>
                  <option value="solo">Solo</option>
                  <option value="adventure">Adventure</option>
                </select>
              </div>
            </div>
            <button className="btn btn-danger mt-3 w-100" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm"></span> : "Generate Plan"}
            </button>
          </form>

          {plan && (
            <div className="mt-4">
              <h5>{plan.summary.from} → {plan.summary.to}</h5>
              <p>{plan.summary.days} days · ₹{plan.summary.totalEstimated.toLocaleString("en-IN")} estimated</p>
              {plan.itinerary.map((d) => (
                <div key={d.day} className="mb-3">
                  <strong>Day {d.day}: {d.title}</strong>
                  <ul>
                    {d.activities.map((a, i) => (
                      <li key={i}>{a.time} — {a.name} (₹{a.cost})</li>
                    ))}
                  </ul>
                </div>
              ))}
              {plan.tips && (
                <div className="alert alert-info">
                  <strong>Tips:</strong>
                  <ul className="mb-0">{plan.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
