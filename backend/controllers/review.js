const Review = require("../models/review");
const Listing = require("../models/listing");

// POST /api/listings/:id/reviews
exports.create = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  const review = new Review({
    ...req.body,
    author: req.user._id,
  });

  listing.reviews.push(review);
  await review.save();
  await listing.save();

  res.status(201).json({ review });
};

// DELETE /api/listings/:id/reviews/:reviewId
exports.destroy = async (req, res) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review) return res.status(404).json({ error: "Review not found" });

  if (!review.author.equals(req.user._id)) {
    return res.status(403).json({ error: "Not your review" });
  }

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  res.json({ deleted: true });
};
