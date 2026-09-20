const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { analyzeImage } = require("./middleware");
const { verifyToken } = require("./auth");
const { validateFashionRequest } = require("./validation");
const { generateFashionRecommendations } = require("./llmClient");

function requireJson(req, res, next) {
  if (!req.is("application/json")) {
    return res.status(415).json({ error: "Content-Type must be application/json" });
  }

  return next();
}

function createUserRateLimit({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => req.user.uid,
    message: { error: message },
  });
}

function createRouter({
  verifyTokenMiddleware = verifyToken,
  analyzeImageHandler = analyzeImage,
  generateRecommendations = generateFashionRecommendations,
} = {}) {
  const router = express.Router();
  const visionRateLimit = createUserRateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 36,
    message: "Image analysis limit reached. Please try again later.",
  });
  const fashionRateLimit = createUserRateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 12,
    message: "Recommendation limit reached. Please try again later.",
  });

  router.post(
    "/analyze-image",
    requireJson,
    verifyTokenMiddleware,
    visionRateLimit,
    analyzeImageHandler
  );

  router.post(
    "/analyze-fashion",
    requireJson,
    verifyTokenMiddleware,
    fashionRateLimit,
    async (req, res) => {
      const validation = validateFashionRequest(req.body);
      if (!validation.ok) {
        return res.status(400).json({ error: validation.error });
      }

      try {
        const llmResult = await generateRecommendations(
          validation.value.prompt,
          validation.value.images.length
        );

        return res.status(200).json({
          recommendations: llmResult.recommendations,
          provider: llmResult.provider,
          model: llmResult.model,
        });
      } catch (error) {
        console.error("Recommendation generation failed", {
          providerStatus: error?.response?.status,
          code: error?.code,
        });
        return res.status(502).json({
          error: "The stylist service is temporarily unavailable. Please try again.",
        });
      }
    }
  );

  return router;
}

module.exports = { createRouter, requireJson, createUserRateLimit };
