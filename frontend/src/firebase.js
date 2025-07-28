import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB4gtotkzc4Jr-JxoK1HmWsFHnAwLQR3q8",
  authDomain: "fashion-moodboard-ai-a955c.firebaseapp.com",
  databaseURL: "https://fashion-moodboard-ai-a955c-default-rtdb.firebaseio.com",
  projectId: "fashion-moodboard-ai-a955c",
  storageBucket: "fashion-moodboard-ai-a955c.appspot.com",
  messagingSenderId: "306572635431",
  appId: "1:306572635431:web:f677c5055e4ca8f83d8d02",
  measurementId: "G-L1NNFQ69VE",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { db, analytics, auth };