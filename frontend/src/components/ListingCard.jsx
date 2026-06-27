import { Link } from "react-router-dom";

export default function ListingCard({ listing }) {
  const dynamic = listing.dynamicPrice && listing.dynamicPrice !== listing.price;
  const img = listing.optimizedImage?.src || listing.image?.url || listing.image;

  return (
    <div className="col listing-col" data-category={listing.category || "homes"}>
      <Link to={`/listings/${listing._id}`} className="text-decoration-none text-dark">
        <div className="card listing-card position-relative">
          <div style={{ overflow: "hidden", borderRadius: "var(--radius-lg)" }}>
            <img
              src={img}
              className="card-img-top"
              alt={listing.title}
              style={{ height: "20rem", objectFit: "cover", width: "100%" }}
              loading="lazy"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80";
              }}
            />
          </div>

          {listing.isSurge && (
            <span className="price-badge surge-badge">
              <i className="fa-solid fa-bolt"></i> Surge
            </span>
          )}
          {listing.isDiscount && (
            <span className="price-badge discount-badge">
              <i className="fa-solid fa-tag"></i> Deal
            </span>
          )}

          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <strong style={{ fontSize: "0.95rem", lineHeight: "1.3" }}>
                {listing.title}
              </strong>
            </div>
            <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: "2px" }}>
              <i className="fa-solid fa-location-dot me-1"></i>
              {listing.location}, {listing.country}
            </div>
            <div className="mt-2">
              {dynamic ? (
                <>
                  <span className="dynamic-price">₹{Number(listing.dynamicPrice).toLocaleString("en-IN")}</span>
                  <span className="base-price-strike">₹{Number(listing.price).toLocaleString("en-IN")}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}> / night</span>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 700 }}>₹{Number(listing.price).toLocaleString("en-IN")}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}> / night</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
