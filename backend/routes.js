const express = require("express");
const { analyzeImage, getUserPhotos } = require("./middleware");
const router = express.Router();

// POST /analyze-image
router.post("/analyze-image", analyzeImage);

// GET /user/photos
router.get("/user/photos", getUserPhotos);

module.exports = router;