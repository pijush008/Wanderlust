const Listing = require("../models/listing");
const { findNearbyListings, getNearbyPOI, clusterListings } = require("../utils/geoService");
const { cache, TTL } = require("../utils/cache");

// ================= NEARBY POI FOR A LISTING =================
module.exports.getNearbyPOI = async (req, res) => {
  const { id } = req.params;

  const cacheKey = `poi:${id}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json({ ...cached, fromCache: true });

  const listing = await Listing.findById(id).select("location geometry").lean();
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  const poi = getNearbyPOI(listing.location, listing.geometry?.coordinates);

  const result = { listingId: id, location: listing.location, poi };
  await cache.set(cacheKey, result, TTL.TRENDING);

  res.json(result);
};

// ================= NEARBY LISTINGS =================
module.exports.getNearbyListings = async (req, res) => {
  const { id } = req.params;
  const { radius = 50, limit = 8 } = req.query;

  const listing = await Listing.findById(id).select("geometry").lean();
  if (!listing || !listing.geometry?.coordinates) {
    return res.status(404).json({ error: "Listing not found or no coordinates" });
  }

  const [lng, lat] = listing.geometry.coordinates;

  try {
    const nearby = await findNearbyListings(lng, lat, parseInt(radius), parseInt(limit), id);
    res.json({ listingId: id, nearby, radius: parseInt(radius) });
  } catch (err) {
    // If geo index doesn't exist yet, return empty
    res.json({ listingId: id, nearby: [], radius: parseInt(radius), note: "Geo index may need creation" });
  }
};

// ================= MAP CLUSTERS (for index page map view) =================
module.exports.getMapClusters = async (req, res) => {
  const { zoom = 10 } = req.query;

  const cacheKey = `clusters:${zoom}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json({ clusters: cached, fromCache: true });

  const listings = await Listing.find({})
    .select("title location price geometry image")
    .lean();

  const clusters = clusterListings(listings, parseInt(zoom));

  await cache.set(cacheKey, clusters, TTL.LISTING_INDEX);

  res.json({ clusters, total: listings.length });
};

// ================= ALL LISTINGS AS MAP MARKERS =================
module.exports.getMapMarkers = async (req, res) => {
  const cacheKey = "map:markers";
  const cached = await cache.get(cacheKey);
  if (cached) return res.json({ markers: cached, fromCache: true });

  const listings = await Listing.find({ "geometry.coordinates": { $exists: true } })
    .select("title location price geometry image")
    .lean();

  const markers = listings
    .filter((l) => l.geometry?.coordinates?.length === 2)
    .map((l) => ({
      id: l._id,
      title: l.title,
      location: l.location,
      price: l.price,
      coordinates: l.geometry.coordinates,
      image: l.image?.url,
    }));

  await cache.set(cacheKey, markers, TTL.LISTING_INDEX);

  res.json({ markers, total: markers.length });
};
