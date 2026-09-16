import { describe, expect, it } from "vitest";
import { normalizeAnalyzedLabels } from "./visionLabels";

describe("normalizeAnalyzedLabels", () => {
  it("keeps percentage confidence from the normalized API response", () => {
    expect(
      normalizeAnalyzedLabels([{ description: "Blazer", confidence: 92.5 }])
    ).toEqual([{ description: "Blazer", confidence: 92.5 }]);
  });

  it("converts legacy Vision scores to percentages during backend rollout", () => {
    expect(
      normalizeAnalyzedLabels([{ description: "Blazer", score: 0.925 }])
    ).toEqual([{ description: "Blazer", confidence: 92.5 }]);
  });
});
