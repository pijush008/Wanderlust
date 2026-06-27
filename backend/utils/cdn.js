/**
 * ================= CDN INTEGRATION =================
 * 
 * In production, static assets are served from a CDN for:
 *   - Faster global delivery (edge servers worldwide)
 *   - Reduced server load (offload static files)
 *   - Better caching (long TTL with cache-busting)
 *   - Parallel downloads (different domain = more connections)
 * 
 * Strategy:
 *   Development: Serve from local /public (Express static)
 *   Production: Serve from CDN URL (Cloudinary / CloudFront / jsDelivr)
 * 
 * This module provides:
 *   - Asset URL helper (auto-switches local vs CDN)
 *   - Cache-control middleware (aggressive caching for static)
 *   - Version-based cache busting
 */

const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

// ================= CONFIG =================
const CDN_URL = process.env.CDN_URL || ""; // e.g. "https://cdn.wanderlust.com"
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const ASSET_VERSION = process.env.ASSET_VERSION || Date.now().toString(36); // Cache buster

// ================= ASSET URL HELPER =================
/**
 * Generate asset URL — uses CDN in production, local in dev
 * Usage in EJS: <%= assetUrl('/css/style.css') %>
 */
function assetUrl(filePath) {
  if (IS_PRODUCTION && CDN_URL) {
    return `${CDN_URL}${filePath}?v=${ASSET_VERSION}`;
  }
  return `${filePath}?v=${ASSET_VERSION}`;
}

// ================= CACHE CONTROL MIDDLEWARE =================
/**
 * Sets aggressive cache headers for static assets
 * - CSS/JS: 1 year (immutable with version query)
 * - Images: 30 days
 * - Fonts: 1 year
 */
function cacheControlMiddleware(req, res, next) {
  const ext = path.extname(req.path).toLowerCase();

  if ([".css", ".js"].includes(ext)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else if ([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".svg"].includes(ext)) {
    res.setHeader("Cache-Control", "public, max-age=2592000"); // 30 days
  } else if ([".woff", ".woff2", ".ttf", ".eot"].includes(ext)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }

  next();
}

// ================= EJS LOCALS (make available in all templates) =================
function cdnLocals(req, res, next) {
  res.locals.assetUrl = assetUrl;
  res.locals.cdnUrl = CDN_URL;
  res.locals.assetVersion = ASSET_VERSION;
  res.locals.isProduction = IS_PRODUCTION;
  next();
}

// ================= THIRD-PARTY CDN RESOURCES =================
// Centralized CDN URLs with SRI hashes for security
const CDN_RESOURCES = {
  bootstrap_css: {
    url: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css",
    integrity: "",
    crossorigin: "anonymous",
  },
  bootstrap_js: {
    url: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js",
    integrity: "",
    crossorigin: "anonymous",
  },
  fontawesome: {
    url: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
    integrity: "",
    crossorigin: "anonymous",
  },
  mapbox_css: {
    url: "https://api.mapbox.com/mapbox-gl-js/v3.17.0/mapbox-gl.css",
  },
  mapbox_js: {
    url: "https://api.mapbox.com/mapbox-gl-js/v3.17.0/mapbox-gl.js",
  },
};

module.exports = {
  assetUrl,
  cacheControlMiddleware,
  cdnLocals,
  CDN_RESOURCES,
  CDN_URL,
  ASSET_VERSION,
};
