import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);

  const handleLogout = () => {
    logout();
    toast.show("Logged out successfully", "success");
    navigate("/listings");
    setCollapsed(true);
  };

  return (
    <nav className="navbar navbar-expand-lg sticky-top">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/listings" onClick={() => setCollapsed(true)}>
          <i className="fa-solid fa-compass"></i>
          <span className="ms-2 d-none d-sm-inline" style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)" }}>
            wanderlust
          </span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${!collapsed ? "show" : ""}`}>
          <SearchBar />

          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item">
              <Link className="nav-link" to="/listings" onClick={() => setCollapsed(true)}>Explore</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/filter" onClick={() => setCollapsed(true)}>
                <i className="fa-solid fa-sliders me-1"></i>Filters
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/trips" onClick={() => setCollapsed(true)}>
                <i className="fa-solid fa-route me-1"></i>Plan
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/ai" onClick={() => setCollapsed(true)}>
                <i className="fa-solid fa-robot me-1"></i>AI
              </Link>
            </li>

            {user ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/listings/new" onClick={() => setCollapsed(true)}>
                    <i className="fa-solid fa-plus me-1"></i>Host
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/recommendations" onClick={() => setCollapsed(true)}>
                    <i className="fa-solid fa-sparkles me-1"></i>For You
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/bookings" onClick={() => setCollapsed(true)}>Bookings</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/waitlist" onClick={() => setCollapsed(true)}>Waitlist</Link>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                    <i className="fa-solid fa-arrow-right-from-bracket me-1"></i>Logout
                  </a>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login" onClick={() => setCollapsed(true)}><b>Log in</b></Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link btn btn-danger ms-lg-2 text-white" to="/signup" onClick={() => setCollapsed(true)} style={{ borderRadius: "20px", padding: "0.4rem 1rem" }}>
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
