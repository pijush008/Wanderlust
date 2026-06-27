import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.show("Welcome back!", "success");
      navigate("/listings");
    } catch (err) {
      toast.show(err.response?.data?.error || "Login failed", "error");
    }
    setLoading(false);
  };

  return (
    <div className="row justify-content-center mt-4">
      <div className="col-md-5 col-lg-4">
        <div className="card" style={{ boxShadow: "var(--shadow-lg)" }}>
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <i className="fa-solid fa-compass" style={{ fontSize: "2.5rem", color: "var(--primary)" }}></i>
              <h2 className="mt-2 mb-1" style={{ fontWeight: 700 }}>Welcome Back</h2>
              <p className="text-muted small">Log in to continue your journey</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button className="btn btn-danger w-100" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm"></span> : "Login"}
              </button>
              <p className="text-center mt-3 mb-0 small text-muted">
                No account? <Link to="/signup" style={{ color: "var(--primary)", fontWeight: 600 }}>Sign up</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
