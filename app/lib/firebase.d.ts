declare module "@/app/lib/firebase" {
  export type AuthUser = {
    uid: string
    email: string | null
    displayName: string
    photoURL: string
    getIdToken: () => Promise<string | null>
  }

  export const isFirebaseConfigured: boolean
  export const firebaseErrorMessage: string
  export const app: null
  export const db: null
  export const provider: null
  export const authReady: Promise<AuthUser | null>

  export const auth: {
    readonly currentUser: AuthUser | null
    signOut: () => Promise<void>
    onAuthStateChanged: (callback: (user: AuthUser | null) => void) => () => void
  }

  export function requireFirebaseAuth(): typeof auth
  export function requireGoogleProvider(): never
}
