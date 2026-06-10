// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
} from "firebase/auth";
import { en } from "@/app/messages/en";

function resolveFirebaseAuthDomain() {
  const configuredAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const configuredHelperDomain = process.env.NEXT_PUBLIC_FIREBASE_HELPER_DOMAIN || configuredAuthDomain;

  const isLocalEnv = process.env.NODE_ENV !== "production";
  if (isLocalEnv) {
    return configuredAuthDomain || configuredHelperDomain;
  }

  return configuredAuthDomain || configuredHelperDomain;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: resolveFirebaseAuthDomain(),
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
let firebaseAuthReadyPromise = Promise.resolve();

if (isFirebaseConfigured) {
  try {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);

    if (typeof window !== "undefined") {
      firebaseAuthReadyPromise = setPersistence(firebaseAuth, indexedDBLocalPersistence)
        .catch((indexedDbError) => {
          console.warn("IndexedDB auth persistence unavailable, falling back to local persistence:", indexedDbError);
          return setPersistence(firebaseAuth, browserLocalPersistence);
        })
        .catch((localError) => {
          console.warn("Local auth persistence unavailable, falling back to session persistence:", localError);
          return setPersistence(firebaseAuth, browserSessionPersistence);
        })
        .catch((sessionError) => {
          console.warn("Firebase auth persistence could not be enabled:", sessionError);
        });
    }

    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: "select_account",
    });
  } catch (error) {
    firebaseConfigError = error instanceof Error ? error.message : en.auth.firebaseInitFailed;
  }
} else {
  firebaseConfigError = en.auth.firebaseNotConfigured;
}

export const app = firebaseApp;
export const db = null;
export const auth = firebaseAuth;
export const provider = googleProvider;
export const firebaseErrorMessage = firebaseConfigError;
export const authReady = firebaseAuthReadyPromise;

export function requireFirebaseAuth() {
  if (!auth) {
    throw new Error(firebaseErrorMessage || en.auth.firebaseAuthUnavailable);
  }
  return auth;
}

export function requireGoogleProvider() {
  if (!provider) {
    throw new Error(firebaseErrorMessage || en.auth.googleProviderUnavailable);
  }
  return provider;
}





