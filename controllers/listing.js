

const Listing = require("../models/listing");
const { listingSchema } = require('../schema.js');
// ADDED: Import ExpressError for proper error handling
const ExpressError = require('../utils/ExpressError.js');

// FIXED: Added comprehensive error handling and timeout prevention
module.exports.index = async (req, res) => {
    // ADDED: Try-catch block to handle database errors
    try {
        // ADDED: Debug logging to track execution
        console.log("Starting listings query...");
        console.log("MongoDB connection state:", require('mongoose').connection.readyState);
        
        const { category } = req.query;
        let allListings;

        if (category) {
            // ADDED: Debug logging for category queries
            console.log(`Querying listings for category: ${category}`);
            // FIXED: Added maxTimeMS to prevent "buffering timed out" error
            allListings = await Listing.find({ category: category })
                .maxTimeMS(30000); // ADDED: 30 second timeout
        } else {
            // ADDED: Debug logging for all listings query
            console.log("Querying all listings...");
            // FIXED: Added maxTimeMS to prevent the main timeout error
            allListings = await Listing.find({})
                .maxTimeMS(30000); // ADDED: 30 second timeout
        }

        // ADDED: Success logging
        console.log(`Successfully found ${allListings.length} listings`);
        res.render("listings/index", { allListings, selectedCategory: category });
        
    } catch (error) {
        // ADDED: Error logging for debugging
        console.error("Error in index method:", error);
        
        // ADDED: Handle specific timeout errors gracefully
        if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
            req.flash("error", "Database connection timeout. Please try refreshing the page.");
            return res.render("listings/index", { allListings: [], selectedCategory: null });
        }
        
        // ADDED: Handle other database errors
        req.flash("error", "Error loading listings. Please try again.");
        res.render("listings/index", { allListings: [], selectedCategory: null });
    }
};

// NO CHANGES: This method was already correct
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

// FIXED: Added error handling and timeout prevention
module.exports.showListing = async (req, res) => {
    // ADDED: Try-catch block for error handling
    try {
        const { id } = req.params;
        // ADDED: Debug logging
        console.log(`Fetching listing with ID: ${id}`);
        
        // FIXED: Added maxTimeMS to prevent timeout
        const listing = await Listing.findById(id)
            .populate({
                path: "reviews",
                populate: { path: "author" }
            })
            .populate("owner")
            .maxTimeMS(30000); // ADDED: Timeout prevention

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        // ADDED: Success logging
        console.log("Listing fetched successfully");
        res.render("listings/show.ejs", { listing });
        
    } catch (error) {
        // ADDED: Error logging and graceful handling
        console.error("Error in showListing:", error);
        req.flash("error", "Error loading listing details. Please try again.");
        res.redirect("/listings");
    }
};

// FIXED: Improved error handling and validation
module.exports.createListing = async (req, res, next) => {
    // ADDED: Try-catch block for comprehensive error handling
    try {
        // FIXED: Better validation error handling
        const { error } = listingSchema.validate(req.body);
        if (error) {
            const msg = error.details.map(el => el.message).join(", ");
            req.flash("error", msg);
            return res.redirect("/listings/new");
        }

        // ADDED: File upload validation
        if (!req.file) {
            req.flash("error", "Image is required!");
            return res.redirect("/listings/new");
        }

        let url = req.file.path;
        let filename = req.file.filename;

        // ADDED: Debug logging
        console.log("Creating new listing...");
        
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = { url, filename };
        
        // FIXED: Added timeout for save operation
        await newListing.save({ maxTimeMS: 30000 });

        // ADDED: Success logging
        console.log("New listing created successfully");
        req.flash("success", "Successfully created a new listing!");
        res.redirect("/listings");
        
    } catch (error) {
        // ADDED: Error logging and handling
        console.error("Error creating listing:", error);
        req.flash("error", "Error creating listing. Please try again.");
        res.redirect("/listings/new");
    }
};

// FIXED: Added error handling and timeout prevention
module.exports.renderEditForm = async (req, res) => {
    // ADDED: Try-catch block
    try {
        const { id } = req.params;
        // ADDED: Debug logging
        console.log(`Loading edit form for listing ID: ${id}`);
        
        // FIXED: Added maxTimeMS to prevent timeout
        const listing = await Listing.findById(id).maxTimeMS(30000);
        
        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        // FIXED: Added safety check for image URL
        let originalImageUrl = "";
        if (listing.image && listing.image.url) {
            originalImageUrl = listing.image.url.replace("/upload", "/upload/h_300,w_250");
        }
        
        res.render("listings/edit.ejs", { listing, originalImageUrl });
        
    } catch (error) {
        // ADDED: Error logging and handling
        console.error("Error in renderEditForm:", error);
        req.flash("error", "Error loading edit form. Please try again.");
        res.redirect("/listings");
    }
};

// FIXED: Added comprehensive error handling and timeout prevention
module.exports.updateListing = async (req, res) => {
    // ADDED: Try-catch block
    try {
        let { id } = req.params;
        // ADDED: Debug logging
        console.log(`Updating listing with ID: ${id}`);
        
        // FIXED: Added maxTimeMS and proper options
        let listing = await Listing.findByIdAndUpdate(
            id, 
            { ...req.body.listing }, 
            { new: true, maxTimeMS: 30000 } // ADDED: Return updated document and timeout
        );

        // ADDED: Check if listing exists
        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        // FIXED: Better file upload handling
        if (typeof req.file !== "undefined") {
            let url = req.file.path;
            let filename = req.file.filename;
            listing.image = { url, filename };
            // FIXED: Added timeout for save operation
            await listing.save({ maxTimeMS: 30000 });
        }

        // ADDED: Success logging
        console.log("Listing updated successfully");
        req.flash("success", "Successfully updated listing!");
        res.redirect(`/listings/${id}`);
        
    } catch (error) {
        // ADDED: Error logging and handling
        console.error("Error updating listing:", error);
        req.flash("error", "Error updating listing. Please try again.");
        res.redirect("/listings");
    }
};

// FIXED: Added error handling and timeout prevention
module.exports.deleteListing = async (req, res) => {
    // ADDED: Try-catch block
    try {
        const { id } = req.params;
        // ADDED: Debug logging
        console.log(`Deleting listing with ID: ${id}`);
        
        // FIXED: Added maxTimeMS to prevent timeout
        const deletedListing = await Listing.findByIdAndDelete(id, { maxTimeMS: 30000 });
        
        // ADDED: Check if listing existed
        if (!deletedListing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }
        
        // ADDED: Success logging
        console.log("Listing deleted successfully");
        req.flash("success", "Listing deleted successfully!");
        res.redirect("/listings");
        
    } catch (error) {
        // ADDED: Error logging and handling
        console.error("Error deleting listing:", error);
        req.flash("error", "Error deleting listing. Please try again.");
        res.redirect("/listings");
    }
};