require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");
const routes = require("./routes");

const app = express();

app.use(bodyParser.json({ limit: "10mb" }));
app.use(
  cors({
    origin: "*",
    methods: ["POST", "GET", "OPTIONS"],
  })
);

// Use routes from routes.js
app.use("/", routes);

const NVOPENAI_API_KEY = process.env.NVOPENAI_API_KEY;
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

console.log("ENV CHECK: NVOPENAI_API_KEY is", !!NVOPENAI_API_KEY);
console.log("ENV CHECK: key prefix:", NVOPENAI_API_KEY?.slice(0, 5));

app.post("/analyze-fashion", async (req, res) => {
  const { images } = req.body;

  if (!images || !Array.isArray(images)) {
    console.warn("Invalid input for /analyze-fashion:", req.body);
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
      `${NVIDIA_BASE_URL}/chat/completions`,
      {
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: "You are a helpful fashion stylist." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        top_p: 1,
        max_tokens: 1024,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${NVOPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("NVIDIA raw response:", JSON.stringify(response.data, null, 2));

    const recommendations =
      response?.data?.choices?.[0]?.message?.content?.trim() || "";

    if (!recommendations) {
      console.error("NVIDIA returned empty recommendations.");
      return res.status(500).json({ error: "NVIDIA returned no content" });
    }

    res.status(200).json({ recommendations });
  } catch (error) {
    console.error(
      "Error generating recommendations:",
      error?.response?.data || error.message || error
    );
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));