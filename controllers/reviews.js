
const Review = require("../models/review");
const Listing = require("../models/listing");
module.exports.createReview=async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();

    req.flash("success", "Successfully created a new review!");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview =async (req, res) => {
    const { id, reviewId } = req.params;
    
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Successfully deleted review!");
    res.redirect(`/listings/${id}`);
};