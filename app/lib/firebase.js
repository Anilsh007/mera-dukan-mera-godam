// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function hasValidFirebaseConfig(config) {
  const requiredValues = [config.apiKey, config.authDomain, config.projectId, config.appId];
  const hasRequiredValues = requiredValues.every((value) => typeof value === "string" && value.trim().length > 0);
  const apiKey = String(config.apiKey || "").trim();

  return hasRequiredValues &&
    apiKey.startsWith("AIza") &&
    !apiKey.includes("your_") &&
    !apiKey.includes("undefined") &&
    apiKey.toLowerCase() !== "test";
}

export const isFirebaseConfigured = hasValidFirebaseConfig(firebaseConfig);

let firebaseApp = null;
let firebaseAuth = null;
let googleProvider = null;
let firebaseConfigError = "";

if (isFirebaseConfigured) {
  try {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    setPersistence(firebaseAuth, browserLocalPersistence).catch((error) => {
      console.warn("Firebase auth persistence could not be enabled:", error);
    });

    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: "select_account",
    });
  } catch (error) {
    firebaseConfigError = error instanceof Error ? error.message : "Firebase could not be initialized.";
  }
} else {
  firebaseConfigError =
    "Firebase client configuration is missing or invalid. Please set real NEXT_PUBLIC_FIREBASE_* values in .env.local and restart the server. The API key should start with AIza.";
}

export const app = firebaseApp;
export const db = null;
export const auth = firebaseAuth;
export const provider = googleProvider;
export const firebaseErrorMessage = firebaseConfigError;

export function requireFirebaseAuth() {
  if (!auth) {
    throw new Error(firebaseErrorMessage || "Firebase Auth is not available.");
  }
  return auth;
}

export function requireGoogleProvider() {
  if (!provider) {
    throw new Error(firebaseErrorMessage || "Google sign-in is not available.");
  }
  return provider;
}
