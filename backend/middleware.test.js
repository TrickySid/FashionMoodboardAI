const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeVisionLabels } = require("./middleware");

test("normalizeVisionLabels converts Vision scores to 0-100 confidence", () => {
  assert.deepEqual(
    normalizeVisionLabels([
      { description: "Blazer", score: 0.925 },
      { description: "Monochrome", score: 1 },
    ]),
    [
      { description: "Blazer", confidence: 92.5 },
      { description: "Monochrome", confidence: 100 },
    ]
  );
});
