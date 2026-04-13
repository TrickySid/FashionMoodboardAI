require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { verifyToken } = require("./auth");
const routes = require("./routes");
const { generateFashionRecommendations, getLlmConfig } = require("./llmClient");

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

try {
  const llmConfig = getLlmConfig();
  console.log("ENV CHECK: LLM provider is", llmConfig.providerName);
  console.log("ENV CHECK: LLM model is", llmConfig.model);
  console.log("ENV CHECK: API key present:", !!llmConfig.apiKey);
} catch (error) {
  console.warn("ENV CHECK: LLM config issue:", error.message);
}

app.post("/analyze-fashion", verifyToken, async (req, res) => {
  const { images, styleProfile } = req.body;

  if (!images || !Array.isArray(images)) {
    console.warn("Invalid input for /analyze-fashion:", req.body);
    return res.status(400).json({ error: "Invalid input data" });
  }

  const styleProfileContext =
    styleProfile && styleProfile.sourceLooks
      ? `
Known user style memory:
- Summary: ${styleProfile.summary}
- Preferred colors: ${(styleProfile.preferredColors || []).map((entry) => entry.name).join(", ") || "None yet"}
- Recurring pieces: ${(styleProfile.recurringPieces || []).map((entry) => entry.name).join(", ") || "None yet"}
- Styling themes: ${(styleProfile.stylingThemes || []).map((entry) => entry.name).join(", ") || "None yet"}

Use this memory to personalize recommendations when it fits the uploaded looks. Keep the advice fresh, but grounded in the user's established taste.
`
      : `
No prior style memory is available yet. Infer taste only from the current upload set.
`;

  const prompt = `
You are a professional fashion stylist. Analyze the following images based on their labels and confidence scores. Provide specific, actionable fashion recommendations for each image.

${styleProfileContext}

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

Respond ONLY with a JSON array in the following format:
[
  {
    "imageNumber": 1,
    "recommendations": ["Tip 1", "Tip 2", "Tip 3"]
  },
  ...
]
`;

  try {
    const llmResult = await generateFashionRecommendations(prompt);

    console.log(
      `LLM raw response from ${llmResult.provider}/${llmResult.model}:`,
      JSON.stringify(llmResult.raw, null, 2)
    );

    res.status(200).json({
      recommendations: llmResult.recommendations,
      provider: llmResult.provider,
      model: llmResult.model,
    });
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
