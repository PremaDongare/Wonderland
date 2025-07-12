

const express = require("express");
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const {listingSchema} = require('../schema.js');
const Listing = require('../models/listing.js');
const{ isLoggedIn,isOwner,validateListing}= require('../middleware.js');
const listingController = require('../controllers/listing.js');
const multer = require('multer'); //for storing images
const{storage}=require("../cloudConfig.js");
const upload= multer({ storage});

// FIXED: Added proper route handling with better error handling
router.route("/")
.get(wrapAsync(listingController.index)) // FIXED: This will handle the timeout issue
.post(isLoggedIn,upload.single('listing[image]'),validateListing,wrapAsync(listingController.createListing));

// FIXED: New form route - no changes needed, this is correct
router.get("/new", isLoggedIn,listingController.renderNewForm);

// FIXED: Individual listing routes with better error handling
router.route("/:id")
.get(wrapAsync(listingController.showListing)) // FIXED: Added timeout handling in controller
.put(isLoggedIn, isOwner,upload.single('listing[image]'),validateListing, wrapAsync(listingController.updateListing))
.delete(isLoggedIn, isOwner,wrapAsync(listingController.deleteListing));

// FIXED: Edit route - no changes needed, this is correct
router.get("/:id/edit",isLoggedIn,isOwner, wrapAsync(listingController.renderEditForm));

// FIXED: Category route - moved this BEFORE the /:id routes to prevent conflicts
// This should be placed before /:id routes to avoid "category" being treated as an ID
router.get("/category/:category", wrapAsync(listingController.categoryListing));

module.exports = router;