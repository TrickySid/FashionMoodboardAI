import { connectAuthEmulator, getAuth } from "firebase/auth";
import { app } from "./firebase";

export const auth = getAuth(app);

if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
  connectAuthEmulator(
    auth,
    import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099",
    { disableWarnings: true }
  );
}
