import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Signup() {
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(form.username, form.email, form.password);
      toast.show("Welcome to Wanderlust!", "success");
      navigate("/listings");
    } catch (err) {
      toast.show(err.response?.data?.error || "Signup failed", "error");
    }
    setLoading(false);
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="row justify-content-center mt-4">
      <div className="col-md-5 col-lg-4">
        <div className="card" style={{ boxShadow: "var(--shadow-lg)" }}>
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <i className="fa-solid fa-compass" style={{ fontSize: "2.5rem", color: "var(--primary)" }}></i>
              <h2 className="mt-2 mb-1" style={{ fontWeight: 700 }}>Join Wanderlust</h2>
              <p className="text-muted small">Start exploring beautiful places</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input className="form-control" value={form.username} onChange={update("username")} required autoFocus />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email} onChange={update("email")} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" value={form.password} onChange={update("password")} minLength={6} required />
                <small className="text-muted">At least 6 characters</small>
              </div>
              <button className="btn btn-danger w-100" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm"></span> : "Create Account"}
              </button>
              <p className="text-center mt-3 mb-0 small text-muted">
                Have an account? <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>Login</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
