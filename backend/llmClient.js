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
    console.error("Failed to parse LLM JSON:", error);
    return [];
  }
}

async function generateFashionRecommendations(prompt) {
  const config = getLlmConfig();

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
      temperature: 0.7,
      top_p: 1,
      max_tokens: 1024,
      stream: false,
    },
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const rawContent = response?.data?.choices?.[0]?.message?.content?.trim() || "";
  const recommendations = extractJsonArray(rawContent);

  if (!recommendations.length) {
    throw new Error(
      `${config.providerName} returned no parseable recommendation content.`
    );
  }

  return {
    provider: config.providerName,
    model: config.model,
    recommendations,
    raw: response.data,
  };
}

module.exports = { generateFashionRecommendations, getLlmConfig };
