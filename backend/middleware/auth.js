const jwt = require("jsonwebtoken");
const User = require("../models/user");

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRY = "7d";

// Generate token
function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// Verify token middleware (required)
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Optional auth (doesn't fail if no token, just sets req.user if present)
async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      const token = header.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    }
  } catch (err) {
    // Silent — optional
  }
  next();
}

// Listing owner check
async function isOwner(req, res, next) {
  const Listing = require("../models/listing");
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  if (!listing.owner.equals(req.user._id)) {
    return res.status(403).json({ error: "Not authorized" });
  }
  next();
}

module.exports = { generateToken, requireAuth, optionalAuth, isOwner };
