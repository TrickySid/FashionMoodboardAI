export function normalizeAnalyzedLabels(labels = []) {
  return labels.map((label) => ({
    description: label.description || "Unknown",
    confidence: Number(
      label.confidence ?? Number(label.score || 0) * 100
    ),
  }));
}
