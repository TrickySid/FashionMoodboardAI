import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB4gtotkzc4Jr-JxoK1HmWsFHnAwLQR3q8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fashion-moodboard-ai-a955c.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://fashion-moodboard-ai-a955c-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fashion-moodboard-ai-a955c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fashion-moodboard-ai-a955c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "306572635431",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:306572635431:web:f677c5055e4ca8f83d8d02",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-L1NNFQ69VE",
};

const app = initializeApp(firebaseConfig);

if (import.meta.env.PROD) {
  import("firebase/analytics")
    .then(async ({ getAnalytics, isSupported }) => {
      if (await isSupported()) getAnalytics(app);
    })
    .catch(() => {
      // Analytics is optional and may be blocked by browser privacy controls.
    });
}

export { app };
