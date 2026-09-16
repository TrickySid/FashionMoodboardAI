const axios = require("axios");

const PROVIDERS = {
  nvidia: {
    baseUrl: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVOPENAI_API_KEY,
    model: process.env.NVIDIA_MODEL || "openai/gpt-oss-120b",
  },
  openai: {
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
  },
};

function getLlmConfig() {
  const providerName = (process.env.LLM_PROVIDER || "nvidia").toLowerCase();
  const provider = PROVIDERS[providerName];

  if (!provider) {
    throw new Error(
      `Unsupported LLM_PROVIDER "${providerName}". Use "nvidia" or "openai".`
    );
  }

  if (!provider.apiKey) {
    const keyName =
      providerName === "openai" ? "OPENAI_API_KEY" : "NVOPENAI_API_KEY";
    throw new Error(`Missing ${keyName} for provider "${providerName}".`);
  }

  return {
    providerName,
    ...provider,
  };
}

function extractJsonArray(content = "") {
  if (typeof content !== "string" || !content.trim()) {
    return [];
  }

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return JSON.parse(content);
  } catch (error) {
    return [];
  }
}

function validateRecommendations(value, expectedImageCount) {
  if (!Array.isArray(value) || value.length !== expectedImageCount) {
    return [];
  }

  const imageNumbers = new Set();
  const recommendations = [];

  for (const item of value) {
    if (
      !item ||
      !Number.isInteger(item.imageNumber) ||
      item.imageNumber < 1 ||
      item.imageNumber > expectedImageCount ||
      imageNumbers.has(item.imageNumber) ||
      !Array.isArray(item.recommendations) ||
      item.recommendations.length !== 3
    ) {
      return [];
    }

    const tips = item.recommendations.map((tip) =>
      typeof tip === "string" ? tip.replace(/[\u0000-\u001f\u007f]/g, " ").trim() : ""
    );

    if (tips.some((tip) => !tip || tip.length > 600)) {
      return [];
    }

    imageNumbers.add(item.imageNumber);
    recommendations.push({ imageNumber: item.imageNumber, recommendations: tips });
  }

  return recommendations.sort((a, b) => a.imageNumber - b.imageNumber);
}

async function generateFashionRecommendations(prompt, expectedImageCount) {
  const config = getLlmConfig();

  const tokenLimit =
    config.providerName === "openai"
      ? { max_completion_tokens: 1200 }
      : { max_tokens: 1200 };

  const response = await axios.post(
    `${config.baseUrl}/chat/completions`,
    {
      model: config.model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful fashion stylist. Return clean JSON when requested.",
        },
        { role: "user", content: prompt },
      ],
      ...(config.providerName === "nvidia"
        ? { temperature: 0.7, top_p: 1 }
        : {}),
      ...tokenLimit,
      stream: false,
    },
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 45_000,
      maxBodyLength: 256 * 1024,
      maxContentLength: 2 * 1024 * 1024,
    }
  );

  const rawContent = response?.data?.choices?.[0]?.message?.content?.trim() || "";
  const recommendations = validateRecommendations(
    extractJsonArray(rawContent),
    expectedImageCount
  );

  if (!recommendations.length) {
    throw new Error(
      `${config.providerName} returned no parseable recommendation content.`
    );
  }

  return {
    provider: config.providerName,
    model: config.model,
    recommendations,
  };
}

module.exports = {
  extractJsonArray,
  generateFashionRecommendations,
  getLlmConfig,
  validateRecommendations,
};
