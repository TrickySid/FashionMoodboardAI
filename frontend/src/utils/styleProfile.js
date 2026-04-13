const COLOR_WORDS = [
  "black",
  "white",
  "red",
  "navy",
  "blue",
  "green",
  "beige",
  "tan",
  "grey",
  "gray",
  "cream",
  "burgundy",
  "maroon",
  "gold",
  "silver",
  "charcoal",
  "olive",
  "teal",
  "peach",
  "crimson",
  "khaki",
  "lavender",
  "mint",
  "coral",
  "mustard",
  "brown",
  "camel",
  "ivory",
];

const ITEM_WORDS = [
  "blazer",
  "shirt",
  "trousers",
  "pants",
  "dress",
  "skirt",
  "heels",
  "boots",
  "loafers",
  "sneakers",
  "coat",
  "jacket",
  "bag",
  "watch",
  "accessories",
  "accessory",
  "jewelry",
  "scarf",
  "knitwear",
  "denim",
  "suit",
  "tailoring",
];

const THEME_WORDS = [
  "minimal",
  "minimalist",
  "tailored",
  "structured",
  "editorial",
  "monochrome",
  "classic",
  "modern",
  "streetwear",
  "soft",
  "polished",
  "bold",
  "relaxed",
  "sharp",
  "elevated",
  "luxury",
];

const STOP_LABELS = new Set([
  "person",
  "human",
  "standing",
  "photo shoot",
  "photography",
  "portrait",
  "smile",
  "fashion model",
  "outerwear",
  "sleeve",
  "waist",
  "gesture",
]);

const toTitleCase = (value = "") =>
  value.replace(/\b\w/g, (letter) => letter.toUpperCase());

const incrementCounter = (counter, key, amount = 1) => {
  if (!key) {
    return;
  }

  counter[key] = (counter[key] || 0) + amount;
};

const extractTerms = (text = "", allowedTerms = []) => {
  const normalized = text.toLowerCase();
  return allowedTerms.filter((term) => normalized.includes(term));
};

const getTopEntries = (counter, count = 4, minimum = 1) =>
  Object.entries(counter)
    .filter(([, value]) => value >= minimum)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key, value]) => ({ name: toTitleCase(key), score: value }));

export const getRecommendationTextForImage = (session, imageNumber) => {
  const items = session?.recommendations?.recommendationItems;
  if (Array.isArray(items)) {
    const match = items.find((item) => item.imageNumber === imageNumber);
    if (match?.recommendations?.length) {
      return match.recommendations.join(" ");
    }
  }

  const text = session?.recommendations?.fashionRecommendations;
  if (!text) {
    return "";
  }

  const lines = text.split("\n");
  const targetPrefix = `Image ${imageNumber}`;

  for (const line of lines) {
    if (line.trim().startsWith(targetPrefix)) {
      return line
        .replace(new RegExp(`^${targetPrefix}\\s*[:\\-]\\s*`), "")
        .trim();
    }
  }

  return text;
};

export const buildStyleProfileMemory = (sessions = []) => {
  const labelCounter = {};
  const colorCounter = {};
  const itemCounter = {};
  const themeCounter = {};
  let sourceLooks = 0;

  sessions.forEach((session) => {
    const images = session?.recommendations?.images || [];

    images.forEach((image, imageIndex) => {
      sourceLooks += 1;

      (image.labels || []).forEach((label) => {
        const description = (label.description || "").toLowerCase().trim();
        if (!description || STOP_LABELS.has(description)) {
          return;
        }

        incrementCounter(labelCounter, description);

        extractTerms(description, COLOR_WORDS).forEach((term) =>
          incrementCounter(colorCounter, term)
        );
        extractTerms(description, ITEM_WORDS).forEach((term) =>
          incrementCounter(itemCounter, term)
        );
      });

      const recommendationText = getRecommendationTextForImage(
        session,
        imageIndex + 1
      ).toLowerCase();

      extractTerms(recommendationText, COLOR_WORDS).forEach((term) =>
        incrementCounter(colorCounter, term, 2)
      );
      extractTerms(recommendationText, ITEM_WORDS).forEach((term) =>
        incrementCounter(itemCounter, term, 2)
      );
      extractTerms(recommendationText, THEME_WORDS).forEach((term) =>
        incrementCounter(themeCounter, term, 2)
      );
    });
  });

  const dominantLabels = getTopEntries(labelCounter, 5, 2);
  const preferredColors = getTopEntries(colorCounter, 5, 2);
  const recurringPieces = getTopEntries(itemCounter, 6, 2);
  const stylingThemes = getTopEntries(themeCounter, 4, 2);

  if (!sourceLooks) {
    return {
      summary:
        "No persistent style memory yet. Analyze a few looks to build an editorial profile over time.",
      dominantLabels: [],
      preferredColors: [],
      recurringPieces: [],
      stylingThemes: [],
      sourceLooks: 0,
      memoryStatus: "new",
      confidence: "low",
    };
  }

  const leadingTheme = stylingThemes[0]?.name || "Editorial";
  const leadingColor = preferredColors[0]?.name || "Monochrome";
  const leadingPiece = recurringPieces[0]?.name || dominantLabels[0]?.name;
  const memoryStatus = sourceLooks >= 9 ? "established" : "emerging";

  const summaryParts = [
    `${leadingTheme} styling direction`,
    `${leadingColor.toLowerCase()}-leaning palette`,
  ];

  if (leadingPiece) {
    summaryParts.push(`repeat pull toward ${leadingPiece.toLowerCase()} pieces`);
  }

  return {
    summary: `Your profile is reading as ${summaryParts.join(", ")}.`,
    dominantLabels,
    preferredColors,
    recurringPieces,
    stylingThemes,
    sourceLooks,
    memoryStatus,
    confidence: sourceLooks >= 9 ? "high" : sourceLooks >= 4 ? "medium" : "low",
  };
};
