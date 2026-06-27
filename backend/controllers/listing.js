const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const { getQuickPrice } = require("../utils/pricingEngine");
const { getCardImage, getShowImage } = require("../utils/imageOptimizer");
const { cache, TTL, listingIndexKey, invalidateListingCache } = require("../utils/cache");
const { trackActivity, classifyPrice } = require("../utils/recommendationEngine");

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// GET /api/listings
exports.index = async (req, res) => {
  const { category } = req.query;
  const cacheKey = listingIndexKey() + (category || "");
  const cached = await cache.get(cacheKey);
  if (cached) return res.json({ listings: cached, fromCache: true });

  const query = category && category !== "all" ? { category } : {};
  const allListings = await Listing.find(query);

  const enriched = allListings.map((l) => {
    const pricing = getQuickPrice(l.price, l.location);
    return {
      ...l.toObject(),
      dynamicPrice: pricing.finalPrice,
      priceMultiplier: pricing.multiplier,
      isSurge: pricing.isSurge,
      isDiscount: pricing.isDiscount,
      optimizedImage: getCardImage(l.image?.url || ""),
    };
  });

  await cache.set(cacheKey, enriched, TTL.LISTING_INDEX);
  res.json({ listings: enriched });
};

// GET /api/listings/:id
exports.show = async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) return res.status(404).json({ error: "Listing not found" });

  const optimizedImage = getShowImage(listing.image?.url || "");

  // Track view (non-blocking)
  if (req.user) {
    trackActivity(req.user._id, "view", {
      listingId: listing._id,
      listingData: {
        location: listing.location,
        country: listing.country,
        category: listing.category || "homes",
        priceRange: classifyPrice(listing.price),
        price: listing.price,
      },
    }).catch(() => {});
  }

  res.json({ listing, optimizedImage, mapToken });
};

// POST /api/listings
exports.create = async (req, res) => {
  const { title, description, price, location, country, image } = req.body;

  if (!title || !description || !price || !location || !country) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const response = await geocodingClient
    .forwardGeocode({ query: location, limit: 1 })
    .send();

  if (!response.body.features.length) {
    return res.status(400).json({ error: "Invalid location" });
  }

  const listing = new Listing({
    title,
    description,
    price,
    location,
    country,
    owner: req.user._id,
    geometry: {
      type: "Point",
      coordinates: response.body.features[0].geometry.coordinates,
    },
  });

  // Image: uploaded file OR provided URL
  if (req.file) {
    listing.image = { url: req.file.path, filename: req.file.filename };
  } else if (image) {
    listing.image = { url: image, filename: "user-provided" };
  }

  await listing.save();
  await invalidateListingCache(listing._id.toString());

  res.status(201).json({ listing });
};

// PUT /api/listings/:id
exports.update = async (req, res) => {
  const listing = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  if (req.file) {
    listing.image = { url: req.file.path, filename: req.file.filename };
    await listing.save();
  }

  await invalidateListingCache(req.params.id);
  res.json({ listing });
};

// DELETE /api/listings/:id
exports.destroy = async (req, res) => {
  await Listing.findByIdAndDelete(req.params.id);
  await invalidateListingCache(req.params.id);
  res.json({ deleted: true });
};
