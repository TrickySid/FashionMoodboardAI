const TRUSTED_IMAGE_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "fashion-moodboard-ai-a955c.firebasestorage.app",
]);

export function safeImageUrl(value, fallback = "/assets/default-avatar.jpg") {
  if (typeof value !== "string") return fallback;
  if (value.startsWith("/assets/")) return value;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && TRUSTED_IMAGE_HOSTS.has(url.hostname)
      ? url.href
      : fallback;
  } catch {
    return fallback;
  }
}
