export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file) {
  if (!file || !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, and WebP images are supported.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name} is larger than 5 MB.`;
  }

  if (!file.size) {
    return `${file.name} is empty.`;
  }

  return null;
}

export function imageExtension(file) {
  return {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }[file.type];
}
