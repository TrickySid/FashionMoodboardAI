const vision = require("@google-cloud/vision");
const { validateImageRequest } = require("./validation");

let client;

function getVisionClient() {
  if (!client) client = new vision.ImageAnnotatorClient();
  return client;
}

function normalizeVisionLabels(labelAnnotations = []) {
  return labelAnnotations.map((label) => ({
    description: label.description || "Unknown",
    confidence: Number(label.score || 0) * 100,
  }));
}

function createAnalyzeImage(getClient = getVisionClient) {
  return async function analyzeImageHandler(req, res) {
    const validation = validateImageRequest(req.body);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    try {
      const [result] = await getClient().annotateImage(
        {
          image: { content: validation.value.buffer },
          features: [
            { type: "LABEL_DETECTION", maxResults: 10 },
            { type: "IMAGE_PROPERTIES" },
          ],
        },
        { timeout: 30_000 }
      );

      const labels = normalizeVisionLabels(result.labelAnnotations);
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
      });
      return res.status(502).json({
        error: "Image analysis is temporarily unavailable. Please try again.",
      });
    }
  };
}

const analyzeImage = createAnalyzeImage();

module.exports = { analyzeImage, createAnalyzeImage, normalizeVisionLabels };
