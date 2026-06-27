export default function Footer() {
  return (
    <footer className="f-info">
      <div className="container">
        <div className="row gy-3">
          <div className="col-md-4">
            <h6 style={{ fontWeight: 700 }}>
              <i className="fa-solid fa-compass me-2" style={{ color: "var(--primary)" }}></i>
              Wanderlust
            </h6>
            <p className="text-muted small">Travel made simple — find unique stays anywhere in India.</p>
          </div>
          <div className="col-md-4">
            <h6 style={{ fontWeight: 700 }}>Quick Links</h6>
            <div className="d-flex flex-column gap-1">
              <a href="/listings" className="small text-muted">Explore</a>
              <a href="/trips" className="small text-muted">Plan a Trip</a>
              <a href="/ai" className="small text-muted">AI Assistant</a>
            </div>
          </div>
          <div className="col-md-4">
            <h6 style={{ fontWeight: 700 }}>Connect</h6>
            <div className="f-info-socials" style={{ justifyContent: "flex-start", gap: "0.5rem" }}>
              <i className="fa-brands fa-facebook"></i>
              <i className="fa-brands fa-instagram"></i>
              <i className="fa-brands fa-twitter"></i>
              <i className="fa-brands fa-linkedin"></i>
            </div>
          </div>
        </div>
        <hr className="my-3" style={{ opacity: 0.2 }} />
        <p className="text-center text-muted small mb-0">© 2026 Wanderlust. Built with ❤️</p>
      </div>
    </footer>
  );
}
