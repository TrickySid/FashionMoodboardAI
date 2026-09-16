require("dotenv").config();

const { createApp } = require("./app");
const { getLlmConfig } = require("./llmClient");

const app = createApp();
const port = Number.parseInt(process.env.PORT || "5000", 10);

if (require.main === module) {
  try {
    const llmConfig = getLlmConfig();
    console.log(
      `LLM configured: provider=${llmConfig.providerName}, model=${llmConfig.model}`
    );
  } catch (error) {
    console.warn(`LLM configuration warning: ${error.message}`);
  }

  const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  server.requestTimeout = 70_000;
  server.headersTimeout = 75_000;
  server.keepAliveTimeout = 65_000;
}

module.exports = app;
