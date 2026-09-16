import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { app } from "./firebase";

export const db = getFirestore(app);
export const storage = getStorage(app);
