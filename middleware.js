const Listing=require("./models/listing.js")
const Review=require("./models/review.js")
const ExpressError=require("./utils/ExpressError.js")
const {listingSchema,reviewSchema }=require("./schema.js")

module.exports.isLoggedIn=(req,res,next)=>{
     if(! req.isAuthenticated()){
      req.session.redirectUrl=req.originalUrl

        req.flash("error","you must be logged in to create listings")
       return res.redirect("/login")
    } 
    next()
}

module.exports.saveRedirectUrl=(req,res,next)=>{
   if(req.session.redirectUrl){
      res.locals.redirectUrl=req.session.redirectUrl
   }
   next()
}


// listing edit validation
module.exports.isOwner = async (req, res, next) => {
   let { id } = req.params;
   let listing = await Listing.findById(id);

   // CRITICAL: Check if the owner's ID equals the logged-in user's ID (req.user._id).
   // If they are NOT equal, then flash the error and redirect.
   if (!listing.owner.equals(req.user._id)) {
       req.flash("error", "You do not have permission to edit this listing.");
       return res.redirect(`/listings/${id}`);
   }
   
   next();
}

// for delete comment verifiaction 
module.exports.isReviewAuthor = async (req, res, next) => {
   let { id , reviewId} = req.params;
   let review = await Review.findById(reviewId)
   
   // Use req.user._id here
   if (!review.author.equals(req.user._id)) { 
       req.flash("error", "You don't have permission to delete another person's review.")
       return res.redirect(`/listings/${id}`)
   }
   next();
}


module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);

    if (error) {
        let errMsg=error.details.map((el)=> el.message).join(",");
        throw new ExpressError( 400,errMsg);
    } else {
        next();
    }
};

// for validate the route
module.exports.validateReview= (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);

    if (error) {
        let errMsg=error.details.map((el)=> el.message).join(",");
        throw new ExpressError( 400,errMsg);
    } else {
        next();
    }
};