const vision = require("@google-cloud/vision");
const axios = require("axios");

const client = new vision.ImageAnnotatorClient();

async function analyzeImage(req, res) {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: "Image data is required" });
  }

  try {
    const [result] = await client.annotateImage({
      image: { content: imageBase64 },
      features: [
        { type: "LABEL_DETECTION", maxResults: 10 },
        { type: "IMAGE_PROPERTIES" },
      ],
    });

    const labels = result.labelAnnotations || [];
    const colors =
      result.imagePropertiesAnnotation?.dominantColors?.colors || [];
    res.status(200).json({ labels, colors });
  } catch (error) {
    console.error("Error analyzing image:", error.message);
    res.status(500).json({ error: "Failed to analyze image" });
  }
}

async function getUserPhotos(req, res) {
  const userId = req.query.userId;
  const token = req.headers.authorization;
  if (!userId || !token) {
    return res.status(400).json({ error: "Missing userId or token" });
  }

  try {
    const url = `https://graph.facebook.com/${userId}/photos?access_token=${token}`;
    const { data } = await axios.get(url);
    res.json({ photos: data });
  } catch (error) {
    console.error("Error fetching user photos:", error.message);
    res.status(500).json({ error: "Failed to fetch user photos" });
  }
}

module.exports = { analyzeImage, getUserPhotos };