const test = require("node:test");
const assert = require("node:assert/strict");
process.env.NVOPENAI_API_KEY = "test-only-key";

const {
  createRecommendationGenerator,
  extractJsonArray,
  validateRecommendations,
} = require("./llmClient");

test("extractJsonArray handles a fenced or prefixed provider response", () => {
  const value = extractJsonArray('Result:\n```json\n[{"imageNumber":1,"recommendations":["A","B","C"]}]\n```');
  assert.equal(value.length, 1);
});

test("validateRecommendations rejects missing, duplicate, and oversized entries", () => {
  const validItem = (imageNumber) => ({
    imageNumber,
    recommendations: ["Tip one", "Tip two", "Tip three"],
  });

  assert.equal(validateRecommendations([validItem(1)], 3).length, 0);
  assert.equal(validateRecommendations([validItem(1), validItem(1)], 2).length, 0);
  assert.equal(
    validateRecommendations([
      { imageNumber: 1, recommendations: ["A", "B"] },
    ], 1).length,
    0
  );
});

test("validateRecommendations normalizes and sorts valid output", () => {
  const value = validateRecommendations(
    [
      { imageNumber: 2, recommendations: [" D ", "E", "F"] },
      { imageNumber: 1, recommendations: ["A", "B", "C"] },
    ],
    2
  );

  assert.deepEqual(value.map((item) => item.imageNumber), [1, 2]);
  assert.equal(value[1].recommendations[0], "D");
});

test("recommendation client bounds provider requests and validates the response", async () => {
  let requestConfig;
  const generator = createRecommendationGenerator({
    async post(_url, _body, config) {
      requestConfig = config;
      return {
        data: {
          choices: [{
            message: {
              content: JSON.stringify([
                { imageNumber: 1, recommendations: ["A", "B", "C"] },
              ]),
            },
          }],
        },
      };
    },
  });

  const result = await generator("bounded prompt", 1);
  assert.equal(result.recommendations.length, 1);
  assert.equal(requestConfig.timeout, 45_000);
  assert.equal(requestConfig.maxBodyLength, 256 * 1024);
  assert.equal(requestConfig.maxContentLength, 2 * 1024 * 1024);
});

test("recommendation client rejects missing and malformed model output", async () => {
  for (const response of [
    {},
    { data: { choices: [] } },
    { data: { choices: [{ message: { content: "not json" } }] } },
    {
      data: {
        choices: [{
          message: {
            content: JSON.stringify([
              { imageNumber: 1, recommendations: ["Only one tip"] },
            ]),
          },
        }],
      },
    },
  ]) {
    const generator = createRecommendationGenerator({
      async post() {
        return response;
      },
    });
    await assert.rejects(generator("prompt", 1), /no parseable recommendation/);
  }
});
