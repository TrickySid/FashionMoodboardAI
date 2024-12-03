const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(bodyParser.json({ limit: "10mb" })); // Support large base64 images
app.use(cors());

const GOOGLE_API_KEY = "google_api_key";
const OPENAI_API_KEY = "sk-proj-openai_api_key";

app.get("/", (req, res) => {
  res.send("Fashion Moodboard AI");
});
// Analyze images using Google Vision API
app.post("/analyze-image", async (req, res) => {
  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Image data is required" });
  }

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

    const labels = response.data.responses[0]?.labelAnnotations || [];
    const colors =
      response.data.responses[0]?.imagePropertiesAnnotation?.dominantColors
        ?.colors || [];
    res.status(200).json({ labels, colors });
  } catch (error) {
    console.error(
      "Error analyzing image:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

// Generate fashion recommendations using ChatGPT
app.post("/analyze-fashion", async (req, res) => {
  const { images } = req.body;

  if (!images || !Array.isArray(images)) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  const prompt = `
You are a fashion stylist. Analyze the following images based on their labels and confidence scores. Provide recommendations for improving the outfits or looks, including tips for enhancing confidence:
${images
  .map(
    (img, i) =>
      `Image ${i + 1}: ${img.labels
        .map(
          (label) => `${label.description} (${label.confidence}% confidence)`
        )
        .join(", ")}`
  )
  .join("\n")}

Respond with clear, actionable fashion tips for the user to look better and improve their looks.
`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful fashion stylist." },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const recommendations = response.data.choices[0].message.content.trim();
    res.status(200).json({ recommendations });
  } catch (error) {
    console.error(
      "Error generating recommendations:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

const PORT = process.env.PORT || 8080; // Use the PORT environment variable or default to 8080
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));