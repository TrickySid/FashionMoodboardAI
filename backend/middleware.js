const { Vision } = require("@google-cloud/vision");
const vision = new Vision.ImageAnnotatorClient();
const axios = require("axios");

async function analyzeImage(req, res) {
  const imagePath = req.body.imagePath;
  const [result] = await vision.labelDetection(imagePath);
  const labels = result.labelAnnotations;
  res.json({ labels });
}

async function getUserPhotos(req, res) {
  const userId = req.query.userId;
  const token = req.headers.authorization;
  const url = `https://graph.facebook.com/${userId}/photos?access_token=${token}`;
  const { data } = await axios.get(url);
  res.json({ photos: data });
}

module.exports = { analyzeImage, getUserPhotos };
