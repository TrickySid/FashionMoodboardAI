require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");
const routes = require("./routes");

const app = express();
app.use(bodyParser.json({ limit: "10mb" }));
app.use(cors());

// Use routes from routes.js
app.use("/", routes);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
            (label) =>
              `${label.description} (${label.score ? (label.score * 100).toFixed(1) : label.confidence}% confidence)`
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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));