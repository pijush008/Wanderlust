const Listing = require("../models/listing");

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN
const geocodingClient=mbxGeocoding({accessToken:mapToken})

const { getQuickPrice } = require("../utils/pricingEngine");
const { getCardImage, getShowImage } = require("../utils/imageOptimizer");
const { cache, TTL, listingIndexKey, listingShowKey, invalidateListingCache } = require("../utils/cache");
const { trackActivity, classifyPrice, findSimilarListings } = require("../utils/recommendationEngine");


// INDEX
module.exports.index = async (req, res) => {
  // Check cache for listing index
  const cacheKey = listingIndexKey();
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    return res.render("listings/index.ejs", { allListings: cached });
  }

  const allListings = await Listing.find({});
  
  // Attach dynamic pricing + optimized images to each listing
  const listingsWithPricing = allListings.map((listing) => {
    const pricing = getQuickPrice(listing.price, listing.location);
    const optimizedImage = getCardImage(listing.image?.url || "");
    return {
      ...listing.toObject(),
      dynamicPrice: pricing.finalPrice,
      priceMultiplier: pricing.multiplier,
      isSurge: pricing.isSurge,
      isDiscount: pricing.isDiscount,
      optimizedImage,
    };
  });

  // Cache the processed listings
  await cache.set(cacheKey, listingsWithPricing, TTL.LISTING_INDEX);

  res.render("listings/index.ejs", { allListings: listingsWithPricing });
};

// NEW FORM
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// SHOW
module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested does not exist");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing,
    mapToken:process.env.MAP_TOKEN,
    optimizedImage: getShowImage(listing.image?.url || ""),
   });

  // Track view asynchronously (non-blocking)
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
    }).catch(() => {}); // Silent fail
  }
};


// CREATE
module.exports.createListing = async (req, res) => {
  // Geocode location
  const response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  // Invalid location
  if (!response.body.features.length) {
    req.flash("error", "Invalid location");
    return res.redirect("/listings/new");
  }

  // Create listing
  const newListing = new Listing(req.body.listing);

  // Save geometry (REQUIRED by schema)
  newListing.geometry = {
    type: "Point",
    coordinates: response.body.features[0].geometry.coordinates,
  };

  //  Save image only if uploaded
  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  // Owner
  newListing.owner = req.user._id;

  // Save
  const savedListing = await newListing.save();

  // Invalidate cache
  await invalidateListingCache(savedListing._id.toString());

  req.flash("success", "New listing created successfully!");
  res.redirect(`/listings/${savedListing._id}`);
};


// EDIT FORM
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested does not exist");
    return res.redirect("/listings");
  }

  res.render("listings/edit.ejs", { listing });
};

// UPDATE
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findByIdAndUpdate(
    id,
    { ...req.body.listing },
    { new: true } 
  );

  // update image only if new file uploaded
  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
    await listing.save();
  }

  // Invalidate cache
  await invalidateListingCache(id);

  req.flash("success", "Listing updated successfully");
  res.redirect(`/listings/${id}`);
};

// DELETE
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;

  await Listing.findByIdAndDelete(id);

  // Invalidate cache
  await invalidateListingCache(id);

  req.flash("success", "Listing deleted successfully!");
  res.redirect("/listings");
};
