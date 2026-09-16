const test = require("node:test");
const assert = require("node:assert/strict");
const { extractJsonArray, validateRecommendations } = require("./llmClient");

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
