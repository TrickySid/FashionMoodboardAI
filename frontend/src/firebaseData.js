import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { app } from "./firebase";

export const db = getFirestore(app);
export const storage = getStorage(app);

if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
  const host = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || "127.0.0.1";
  connectFirestoreEmulator(
    db,
    host,
    Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8085)
  );
  connectStorageEmulator(
    storage,
    host,
    Number(import.meta.env.VITE_STORAGE_EMULATOR_PORT || 9199)
  );
}
