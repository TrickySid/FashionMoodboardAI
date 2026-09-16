const {
  applicationDefault,
  getApps,
  initializeApp,
} = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

let firebaseAuth;

function getFirebaseAuth() {
  if (firebaseAuth) return firebaseAuth;

  const firebaseApp = getApps()[0] || initializeApp({
    credential: applicationDefault(),
    ...(process.env.FIREBASE_DATABASE_URL
      ? { databaseURL: process.env.FIREBASE_DATABASE_URL }
      : {}),
  });
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
      const decodedToken = await verifyIdToken(idToken, true);
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

const verifyToken = createVerifyToken((token, checkRevoked) =>
  getFirebaseAuth().verifyIdToken(token, checkRevoked)
);

module.exports = { createVerifyToken, extractBearerToken, verifyToken };
