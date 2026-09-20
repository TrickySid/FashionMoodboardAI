import { after, before, beforeEach, describe, test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteObject,
  getBytes,
  ref,
  uploadBytes,
} from "firebase/storage";

const PROJECT_ID = "demo-fashion-moodboard";
const USER_A = "user-a";
const USER_B = "user-b";
const ONE_PIXEL_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
let testEnv;

function objectRef(context, path) {
  return ref(context.storage(), path);
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: {
      rules: await readFile(new URL("../../storage.rules", import.meta.url), "utf8"),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearStorage();
});

after(async () => {
  await testEnv.cleanup();
});

describe("Storage authentication and ownership", () => {
  test("unauthenticated clients cannot upload, read, or delete", async () => {
    const dbA = testEnv.authenticatedContext(USER_A);
    const publicClient = testEnv.unauthenticatedContext();
    const path = `user-uploads/${USER_A}/looks/look.jpg`;

    await assertSucceeds(uploadBytes(objectRef(dbA, path), ONE_PIXEL_PNG, {
      contentType: "image/jpeg",
    }));
    await assertFails(uploadBytes(objectRef(publicClient, path), ONE_PIXEL_PNG, {
      contentType: "image/jpeg",
    }));
    await assertFails(getBytes(objectRef(publicClient, path)));
    await assertFails(deleteObject(objectRef(publicClient, path)));
  });

  test("users cannot access another user's objects", async () => {
    const contextA = testEnv.authenticatedContext(USER_A);
    const contextB = testEnv.authenticatedContext(USER_B);
    const path = `user-uploads/${USER_B}/looks/look.png`;

    await assertSucceeds(uploadBytes(objectRef(contextB, path), ONE_PIXEL_PNG, {
      contentType: "image/png",
    }));
    await assertFails(uploadBytes(objectRef(contextA, path), ONE_PIXEL_PNG, {
      contentType: "image/png",
    }));
    await assertFails(getBytes(objectRef(contextA, path)));
    await assertFails(deleteObject(objectRef(contextA, path)));
  });
});

describe("Storage upload constraints and real application paths", () => {
  test("JPEG, PNG, and WebP outfit uploads are allowed and deletable", async () => {
    const contextA = testEnv.authenticatedContext(USER_A);

    for (const [extension, contentType] of [
      ["jpg", "image/jpeg"],
      ["png", "image/png"],
      ["webp", "image/webp"],
    ]) {
      const path = `user-uploads/${USER_A}/looks/look-${extension}.${extension}`;
      const reference = objectRef(contextA, path);
      await assertSucceeds(uploadBytes(reference, ONE_PIXEL_PNG, { contentType }));
      await assertSucceeds(getBytes(reference));
      await assertSucceeds(deleteObject(reference));
    }
  });

  test("avatar upload, replacement, read, and deletion are allowed for the owner", async () => {
    const contextA = testEnv.authenticatedContext(USER_A);
    const first = objectRef(contextA, `user-uploads/${USER_A}/profile/avatar-first.webp`);
    const replacement = objectRef(contextA, `user-uploads/${USER_A}/profile/avatar-second.webp`);

    await assertSucceeds(uploadBytes(first, ONE_PIXEL_PNG, { contentType: "image/webp" }));
    await assertSucceeds(uploadBytes(replacement, ONE_PIXEL_PNG, { contentType: "image/webp" }));
    await assertSucceeds(getBytes(replacement));
    await assertSucceeds(deleteObject(first));
    await assertSucceeds(deleteObject(replacement));
  });

  test("oversized and unsupported uploads are rejected", async () => {
    const contextA = testEnv.authenticatedContext(USER_A);
    const oversized = new Uint8Array(5 * 1024 * 1024 + 1);

    await assertFails(uploadBytes(
      objectRef(contextA, `user-uploads/${USER_A}/looks/oversized.jpg`),
      oversized,
      { contentType: "image/jpeg" }
    ));
    await assertFails(uploadBytes(
      objectRef(contextA, `user-uploads/${USER_A}/looks/not-image.gif`),
      ONE_PIXEL_PNG,
      { contentType: "image/gif" }
    ));
  });
});
