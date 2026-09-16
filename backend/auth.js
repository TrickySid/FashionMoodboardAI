const {
  applicationDefault,
  getApps,
  initializeApp,
} = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

let firebaseAuth;
const FIREBASE_APP_NAME = "fashion-moodboard-backend";

function getFirebaseProjectId(env = process.env) {
  const projectId = env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID is required for Firebase token verification");
  }

  return projectId;
}

function getFirebaseAuth() {
  if (firebaseAuth) return firebaseAuth;

  const firebaseApp = getApps().find((app) => app.name === FIREBASE_APP_NAME)
    || initializeApp(
      {
        credential: applicationDefault(),
        projectId: getFirebaseProjectId(),
        ...(process.env.FIREBASE_DATABASE_URL
          ? { databaseURL: process.env.FIREBASE_DATABASE_URL }
          : {}),
      },
      FIREBASE_APP_NAME
    );
  firebaseAuth = getAuth(firebaseApp);
  return firebaseAuth;
}

function extractBearerToken(authHeader) {
  if (typeof authHeader !== "string") return null;
  const match = authHeader.match(/^Bearer ([^\s]+)$/);
  return match?.[1] || null;
}

function createVerifyToken(verifyIdToken) {
  return async function verifyTokenMiddleware(req, res, next) {
    const idToken = extractBearerToken(req.headers.authorization);
    if (!idToken) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }

    try {
      const decodedToken = await verifyIdToken(idToken);
      req.user = decodedToken;
      return next();
    } catch (error) {
      console.warn("Firebase token verification failed", {
        code: error?.code,
      });
      return res.status(401).json({ error: "Authentication required" });
    }
  };
}

const verifyToken = createVerifyToken((token) =>
  getFirebaseAuth().verifyIdToken(token)
);

module.exports = {
  createVerifyToken,
  extractBearerToken,
  getFirebaseProjectId,
  verifyToken,
};
