const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { createRouter } = require("./routes");

const DEFAULT_ALLOWED_ORIGINS = [
  "https://fashion-moodboard-ai-a955c.web.app",
  "https://fashion-moodboard-ai-a955c.firebaseapp.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function getAllowedOrigins() {
  const configured = process.env.ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set(configured?.length ? configured : DEFAULT_ALLOWED_ORIGINS);
}

function createApp(routeDependencies) {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type"],
      maxAge: 600,
    })
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 180,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      skip: (req) => req.path === "/health",
      message: { error: "Too many requests. Please try again later." },
    })
  );
  app.use((req, res, next) => {
    if (req.path.startsWith("/analyze-")) {
      res.set("Cache-Control", "no-store");
    }
    next();
  });
  app.use(express.json({ limit: "7mb", strict: true }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use(createRouter(routeDependencies));

  app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  app.use((error, _req, res, _next) => {
    if (error?.type === "entity.too.large") {
      return res.status(413).json({ error: "Request body is too large" });
    }

    if (error instanceof SyntaxError && "body" in error) {
      return res.status(400).json({ error: "Malformed JSON request" });
    }

    console.error("Unhandled request error", {
      name: error?.name,
      code: error?.code,
      message: error?.message,
    });
    return res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

module.exports = { createApp, getAllowedOrigins };
