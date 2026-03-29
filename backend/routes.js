const express = require("express");
const { analyzeImage, getUserPhotos } = require("./middleware");
const { verifyToken } = require("./auth");
const router = express.Router();

// POST /analyze-image
router.post("/analyze-image", verifyToken, analyzeImage);

// GET /user/photos
router.get("/user/photos", verifyToken, getUserPhotos);

module.exports = router;