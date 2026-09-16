import { describe, expect, it } from "vitest";
import { imageExtension, MAX_IMAGE_BYTES, validateImageFile } from "./imageFiles";

function imageFile(overrides = {}) {
  return {
    name: "look.jpg",
    type: "image/jpeg",
    size: 1024,
    ...overrides,
  };
}

describe("image file validation", () => {
  it("accepts supported images under 5 MB", () => {
    expect(validateImageFile(imageFile())).toBeNull();
  });

  it("rejects spoof-prone unsupported MIME types", () => {
    expect(validateImageFile(imageFile({ type: "image/svg+xml" }))).toMatch(/Only JPEG/);
  });

  it("rejects oversized and empty files", () => {
    expect(validateImageFile(imageFile({ size: MAX_IMAGE_BYTES + 1 }))).toMatch(/larger than 5 MB/);
    expect(validateImageFile(imageFile({ size: 0 }))).toMatch(/empty/);
  });

  it("maps accepted MIME types to safe extensions", () => {
    expect(imageExtension(imageFile({ type: "image/webp" }))).toBe("webp");
  });
});
