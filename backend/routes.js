const express = require("express");
const { analyzeImage, getUserPhotos } = require("./middleware");
const router = express.Router();

router.post("/analyze", analyzeImage);
router.get("/user/photos", getUserPhotos);

module.exports = router;
