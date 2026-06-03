// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
} from "firebase/auth";
import { en } from "@/app/messages/en";

function resolveFirebaseAuthDomain() {
  const configuredAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const configuredSiteHost = configuredSiteUrl
    ? safelyReadHostFromUrl(configuredSiteUrl)
    : null;
  if (configuredSiteHost && configuredSiteHost !== configuredAuthDomain) {
    return configuredSiteHost;
  }

  if (typeof window !== "undefined") {
    const runtimeHost = window.location.host;
    const runtimeHostname = window.location.hostname;
    const isLocalRuntime =
      runtimeHostname === "localhost" ||
      runtimeHostname === "127.0.0.1" ||
      runtimeHostname === "[::1]";

    if (!isLocalRuntime && runtimeHost && runtimeHost !== configuredAuthDomain) {
      return runtimeHost;
    }
  }

  return configuredAuthDomain;
}

function safelyReadHostFromUrl(value) {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
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
    try {
      firebaseAuth = initializeAuth(firebaseApp, {
        persistence: [
          indexedDBLocalPersistence,
          browserLocalPersistence,
          browserSessionPersistence,
        ],
        popupRedirectResolver: browserPopupRedirectResolver,
      });
      firebaseAuthReadyPromise = Promise.resolve();
    } catch (authInitError) {
      console.warn("Firebase advanced auth initialization fell back to getAuth:", authInitError);
      firebaseAuth = getAuth(firebaseApp);
      firebaseAuthReadyPromise = Promise.resolve();
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
