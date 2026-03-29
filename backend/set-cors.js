require('dotenv').config();
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: "fashion-moodboard-ai-a955c.firebasestorage.app"
});

async function configureCors() {
  try {
    const bucket = admin.storage().bucket();
    
    // Set CORS configuration
    await bucket.setCorsConfiguration([
      {
        origin: ["*"], // Allow all origins for dev, can restrict later
        method: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD"],
        responseHeader: ["*"], // Allow all headers
        maxAgeSeconds: 3600,
      },
    ]);
    
    console.log("Successfully configured CORS for the Firebase Storage bucket!");
  } catch (error) {
    console.error("Failed to set CORS:", error.message);
  }
}

configureCors();
