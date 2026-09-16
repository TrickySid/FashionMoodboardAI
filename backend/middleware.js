const vision = require("@google-cloud/vision");
const { validateImageRequest } = require("./validation");

let client;

function getVisionClient() {
  if (!client) client = new vision.ImageAnnotatorClient();
  return client;
}

async function analyzeImage(req, res) {
  const validation = validateImageRequest(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const [result] = await getVisionClient().annotateImage(
      {
        image: { content: validation.value.buffer },
        features: [
          { type: "LABEL_DETECTION", maxResults: 10 },
          { type: "IMAGE_PROPERTIES" },
        ],
      },
      { timeout: 30_000 }
    );

    const labels = (result.labelAnnotations || []).map((label) => ({
      description: label.description || "Unknown",
      score: Number(label.score || 0),
    }));
    const colors = (
      result.imagePropertiesAnnotation?.dominantColors?.colors || []
    )
      .slice(0, 10)
      .map((entry) => ({
        color: entry.color,
        score: Number(entry.score || 0),
        pixelFraction: Number(entry.pixelFraction || 0),
      }));

    return res.status(200).json({ labels, colors });
  } catch (error) {
    console.error("Vision analysis failed", {
      code: error?.code,
      message: error?.message,
    });
    return res.status(502).json({
      error: "Image analysis is temporarily unavailable. Please try again.",
    });
  }
}

module.exports = { analyzeImage };
