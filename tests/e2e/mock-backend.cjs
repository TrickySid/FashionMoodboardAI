process.env.ALLOWED_ORIGINS = "http://127.0.0.1:4173";

const { createApp } = require("../../backend/app");
const { createAnalyzeImage } = require("../../backend/middleware");

function verifyTestToken(req, res, next) {
  const authorization = req.headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  req.user = { uid: "emulator-user" };
  return next();
}

const analyzeImageHandler = createAnalyzeImage(() => ({
  async annotateImage() {
    await new Promise((resolve) => setTimeout(resolve, 120));
    return [{
      labelAnnotations: [
        { description: "Blazer", score: 0.94 },
        { description: "Formal wear", score: 0.88 },
        { description: "Black", score: 0.82 },
      ],
      imagePropertiesAnnotation: {
        dominantColors: { colors: [] },
      },
    }];
  },
}));

async function generateRecommendations(_prompt, imageCount) {
  await new Promise((resolve) => setTimeout(resolve, 180));
  return {
    provider: "local-test",
    model: "deterministic-fashion-stylist",
    recommendations: Array.from({ length: imageCount }, (_, index) => ({
      imageNumber: index + 1,
      recommendations: [
        "Sharpen the blazer line with a clean monochrome shirt.",
        "Add silver accessories and a structured watch for contrast.",
        "Finish with polished shoes to anchor the tailored outfit.",
      ],
    })),
  };
}

const app = createApp({
  verifyTokenMiddleware: verifyTestToken,
  analyzeImageHandler,
  generateRecommendations,
});

function startMockBackend(port = 5001) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, "127.0.0.1", () => resolve(server));
    server.once("error", reject);
  });
}

function closeMockBackend(server) {
  server.closeAllConnections();
  return new Promise((resolve) => server.close(resolve));
}

module.exports = { startMockBackend, closeMockBackend };

if (require.main === module) {
  startMockBackend().then((server) => {
    console.log("Local mocked backend listening on port 5001");
    const close = async () => {
      await closeMockBackend(server);
      process.exit(0);
    };
    process.on("SIGINT", close);
    process.on("SIGTERM", close);
  });
}
