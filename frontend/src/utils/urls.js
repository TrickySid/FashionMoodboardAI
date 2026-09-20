const TRUSTED_IMAGE_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "fashion-moodboard-ai-a955c.firebasestorage.app",
]);

const EMULATOR_HOSTS = new Set(["127.0.0.1", "localhost"]);

export function isManagedStorageUrl(value) {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    if (url.protocol === "https:" && TRUSTED_IMAGE_HOSTS.has(url.hostname)) {
      return true;
    }

    return import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true"
      && url.protocol === "http:"
      && EMULATOR_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function safeImageUrl(value, fallback = "/assets/default-avatar.jpg") {
  if (typeof value !== "string") return fallback;
  if (value.startsWith("/assets/")) return value;
  return isManagedStorageUrl(value) ? new URL(value).href : fallback;
}
