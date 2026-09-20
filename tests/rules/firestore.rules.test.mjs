import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  deleteDoc,
} from "firebase/firestore";

const PROJECT_ID = "demo-fashion-moodboard";
const USER_A = "user-a";
const USER_B = "user-b";
let testEnv;

function styleProfile() {
  return {
    summary: "Tailored styling direction, black-leaning palette.",
    dominantLabels: [{ name: "Blazer", score: 3 }],
    preferredColors: [{ name: "Black", score: 3 }],
    recurringPieces: [{ name: "Blazer", score: 3 }],
    stylingThemes: [{ name: "Tailored", score: 3 }],
    sourceLooks: 3,
    memoryStatus: "emerging",
    confidence: "low",
  };
}

function recommendation(userId = USER_A) {
  return {
    userId,
    recommendations: {
      images: [1, 2, 3].map((imageNumber) => ({
        image: `Image ${imageNumber}`,
        imageUrl: `https://example.test/look-${imageNumber}.jpg`,
        labels: [{ description: "Blazer", confidence: 92.5 }],
      })),
      fashionRecommendations: "Three-look editorial report.",
      recommendationItems: [1, 2, 3].map((imageNumber) => ({
        imageNumber,
        recommendations: ["Tip one", "Tip two", "Tip three"],
      })),
    },
    styleProfileSnapshot: styleProfile(),
    timestamp: serverTimestamp(),
  };
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: await readFile(new URL("../../firestore.rules", import.meta.url), "utf8"),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

describe("Firestore user documents", () => {
  test("unauthenticated clients cannot read or write user documents", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "users", USER_A)));
    await assertFails(setDoc(doc(db, "users", USER_A), { name: "Anonymous" }));
  });

  test("users can create and update allowed fields only on their own document", async () => {
    const dbA = testEnv.authenticatedContext(USER_A, { email: "a@example.test" }).firestore();

    await assertSucceeds(setDoc(doc(dbA, "users", USER_A), {
      name: "User A",
      email: "a@example.test",
    }));
    await assertSucceeds(updateDoc(doc(dbA, "users", USER_A), {
      styleProfileMemory: styleProfile(),
      styleProfileUpdatedAt: serverTimestamp(),
    }));
    await assertFails(updateDoc(doc(dbA, "users", USER_A), { role: "admin" }));
    await assertFails(setDoc(doc(dbA, "users", USER_B), { name: "User B" }));
    await assertFails(getDoc(doc(dbA, "users", USER_B)));
  });
});

describe("Firestore recommendation ownership", () => {
  test("unauthenticated clients cannot read or create recommendations", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "userRecommendations", "rec-a")));
    await assertFails(setDoc(doc(db, "userRecommendations", "rec-a"), recommendation()));
  });

  test("first recommendation succeeds without a pre-existing user document", async () => {
    const dbA = testEnv.authenticatedContext(USER_A, { email: "a@example.test" }).firestore();
    await assertSucceeds(
      setDoc(doc(dbA, "userRecommendations", "first-rec"), recommendation())
    );
  });

  test("ownership, immutable records, and constrained history queries are enforced", async () => {
    const dbA = testEnv.authenticatedContext(USER_A, { email: "a@example.test" }).firestore();
    const dbB = testEnv.authenticatedContext(USER_B, { email: "b@example.test" }).firestore();
    const refA = doc(dbA, "userRecommendations", "rec-a");

    await assertSucceeds(setDoc(refA, recommendation(USER_A)));
    await assertFails(setDoc(doc(dbA, "userRecommendations", "forged"), recommendation(USER_B)));
    await assertSucceeds(getDoc(refA));
    await assertFails(getDoc(doc(dbB, "userRecommendations", "rec-a")));
    await assertFails(updateDoc(refA, { timestamp: serverTimestamp() }));
    await assertFails(deleteDoc(refA));

    const ownHistory = query(
      collection(dbA, "userRecommendations"),
      where("userId", "==", USER_A)
    );
    await assertSucceeds(getDocs(ownHistory));
    await assertFails(getDocs(collection(dbA, "userRecommendations")));
  });

  test("timestamp and recommendation payload validation reject malformed writes", async () => {
    const dbA = testEnv.authenticatedContext(USER_A, { email: "a@example.test" }).firestore();
    const fixedTimestamp = recommendation();
    fixedTimestamp.timestamp = Timestamp.fromMillis(1);
    await assertFails(
      setDoc(doc(dbA, "userRecommendations", "fixed-time"), fixedTimestamp)
    );

    const malformed = recommendation();
    malformed.recommendations.images = malformed.recommendations.images.slice(0, 2);
    await assertFails(
      setDoc(doc(dbA, "userRecommendations", "malformed"), malformed)
    );

    const missingSnapshot = recommendation();
    delete missingSnapshot.styleProfileSnapshot;
    await assertSucceeds(
      setDoc(doc(dbA, "userRecommendations", "missing-profile"), missingSnapshot)
    );
  });
});

test("Firestore rules suite initialized", () => {
  assert.ok(testEnv);
});
