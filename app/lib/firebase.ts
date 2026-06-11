import { en } from "@/app/messages/en"
import { isSupabaseConfigured, supabase } from "./supabase"

export type AuthUser = {
  uid: string
  email: string | null
  displayName: string
  photoURL: string
  phoneNumber: string | null
  getIdToken: () => Promise<string | null>
}

function mapSupabaseUser(user: {
  id: string
  email?: string | null
  phone?: string | null
  user_metadata?: Record<string, unknown> | null
} | null): AuthUser | null {
  if (!user) return null

  const metadata = user.user_metadata || {}
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name : ""
  const name = typeof metadata.name === "string" ? metadata.name : ""
  const avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : ""
  const picture = typeof metadata.picture === "string" ? metadata.picture : ""
  const metadataPhone = typeof metadata.phone === "string" ? metadata.phone : null

  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: fullName || name || user.email || "",
    photoURL: avatarUrl || picture || "",
    phoneNumber: user.phone ?? metadataPhone,
    async getIdToken() {
      const { data } = await supabase.auth.getSession()
      return data.session?.access_token || null
    },
  }
}

let currentUser: AuthUser | null = null

const authReady = (async () => {
  if (typeof window === "undefined" || !isSupabaseConfigured) return null

  try {
    const { data } = await supabase.auth.getSession()
    currentUser = mapSupabaseUser(data.session?.user ?? null)
    return currentUser
  } catch (error) {
    console.warn("Supabase auth session bootstrap failed:", error)
    currentUser = null
    return null
  }
})()

export const isFirebaseConfigured = isSupabaseConfigured
export const firebaseErrorMessage = isSupabaseConfigured ? "" : en.auth.firebaseNotConfigured
export const app = null
export const db = null
export const provider = null
export { authReady }

export const auth = {
  get currentUser() {
    return currentUser
  },
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  },
  onAuthStateChanged(callback: (user: AuthUser | null) => void) {
    let active = true
    let subscription: { unsubscribe: () => void } | null = null

    authReady
      .then(() => {
        if (!active) return

        callback(currentUser)

        const result = supabase.auth.onAuthStateChange((_event, session) => {
          currentUser = mapSupabaseUser(session?.user ?? null)
          if (active) {
            callback(currentUser)
          }
        })

        subscription = result.data.subscription
      })
      .catch(() => {
        if (active) {
          callback(currentUser)
        }
      })

    return () => {
      active = false
      subscription?.unsubscribe()
    }
  },
}

export function requireFirebaseAuth() {
  return auth
}

export function requireGoogleProvider(): never {
  throw new Error(firebaseErrorMessage || en.auth.googleProviderUnavailable)
}
