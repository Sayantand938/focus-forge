// src/shared/lib/firebase.ts
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  type Firestore,
} from "firebase/firestore";
import { toast } from "sonner";

// Read environment variables from import.meta.env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);

// --- THIS IS THE NEW, CORRECT WAY TO ENABLE OFFLINE PERSISTENCE ---
// We now initialize Firestore with persistence settings from the start.
let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({}),
  });
  console.log("[Firebase] Firestore offline persistence enabled successfully.");
} catch (error) {
  console.error("[Firebase] Failed to initialize Firestore with persistence:", error);
  toast.error("Offline Mode Failed", {
    description: "Could not initialize the local database. Data may not save correctly offline.",
  });
  // Fallback to in-memory Firestore instance if persistence fails
  db = initializeFirestore(app, {});
}


export { app, auth, db };