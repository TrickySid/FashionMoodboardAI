import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB4gtotkzc4Jr-JxoK1HmWsFHnAwLQR3q8",
  authDomain: "fashion-moodboard-ai-a955c.firebaseapp.com",
  databaseURL: "https://fashion-moodboard-ai-a955c-default-rtdb.firebaseio.com",
  projectId: "fashion-moodboard-ai-a955c",
  storageBucket: "fashion-moodboard-ai-a955c.firebasestorage.app",
  messagingSenderId: "306572635431",
  appId: "1:306572635431:web:f677c5055e4ca8f83d8d02",
  measurementId: "G-L1NNFQ69VE",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Analytics blocked by browser extension");
}

const auth = getAuth(app);
const storage = getStorage(app);

export { db, analytics, auth, storage };