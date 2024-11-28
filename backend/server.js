const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(bodyParser.json({ limit: "10mb" })); // Support large base64 images
app.use(cors());

const GOOGLE_API_KEY = "AIzaSyDAMP-wg5uq0lyhZbIuobIMUJ9qUfNHq4w"; // Replace with your key

// API endpoint to analyze images
app.post("/analyze-image", async (req, res) => {
  const { imageBase64 } = req.body;

  try {
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
      {
        requests: [
          {
            image: { content: imageBase64 },
            features: [
              { type: "LABEL_DETECTION", maxResults: 10 },
              { type: "IMAGE_PROPERTIES" },
            ],
          },
        ],
      }
    );

    const labels = response.data.responses[0].labelAnnotations || [];
    const colors =
      response.data.responses[0].imagePropertiesAnnotation.dominantColors
        .colors || [];
    res.status(200).json({ labels, colors });
  } catch (error) {
    console.error("Error analyzing image:", error);
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
