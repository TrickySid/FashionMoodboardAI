import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4gtotkzc4Jr-JxoK1HmWsFHnAwLQR3q8",
  authDomain: "fashion-moodboard-ai-a955c.firebaseapp.com",
  projectId: "fashion-moodboard-ai-a955c",
  storageBucket: "fashion-moodboard-ai-a955c.firebasestorage.app",
  messagingSenderId: "306572635431",
  appId: "1:306572635431:web:f677c5055e4ca8f83d8d02",
  measurementId: "G-L1NNFQ69VE",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Analytics using the modular SDK
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { db, analytics };
