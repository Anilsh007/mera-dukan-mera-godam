// lib/firebase.js
import { en } from "@/app/messages/en";
import { isSupabaseConfigured, supabase } from "./supabase";

function mapSupabaseUser(user) {
  if (!user) return null;

  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email || "",
    photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
    phoneNumber: user.phone ?? user.user_metadata?.phone ?? null,
    async getIdToken() {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    },
  };
}

let currentUser = null;
const authReady = (async () => {
  if (typeof window === "undefined" || !isSupabaseConfigured) return null;

  try {
    const { data } = await supabase.auth.getSession();
    currentUser = mapSupabaseUser(data.session?.user ?? null);
    return currentUser;
  } catch (error) {
    console.warn("Supabase auth session bootstrap failed:", error);
    currentUser = null;
    return null;
  }
})();

export const isFirebaseConfigured = isSupabaseConfigured;
export const firebaseErrorMessage = isSupabaseConfigured ? "" : en.auth.firebaseNotConfigured;
export const app = null;
export const db = null;
export const provider = null;
export { authReady };

export const auth = {
  get currentUser() {
    return currentUser;
  },
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  },
  onAuthStateChanged(callback) {
    let active = true;
    let subscription = null;

    authReady
      .then(() => {
        if (!active) return;

        callback(currentUser);

        const result = supabase.auth.onAuthStateChange((_event, session) => {
          currentUser = mapSupabaseUser(session?.user ?? null);
          if (active) {
            callback(currentUser);
          }
        });

        subscription = result.data.subscription;
      })
      .catch(() => {
        if (active) {
          callback(currentUser);
        }
      });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  },
};

export function requireFirebaseAuth() {
  return auth;
}

export function requireGoogleProvider() {
  throw new Error(firebaseErrorMessage || en.auth.googleProviderUnavailable);
}
