import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { createVerify } from "crypto"
import { normalizeUserIdentity } from "@/app/lib/userIdentity"
import { SecurityError } from "./security"

const FIREBASE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

type FirebaseTokenPayload = {
  aud: string
  email?: string
  exp: number
  iat: number
  iss: string
  sub: string
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

/**
 * Creates a Supabase admin client using the service role key
 * This client bypasses RLS policies and should only be used in trusted server environments
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "")
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase credentials not configured")
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })
}

export async function getUserIdentityFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization")

  if (!authorization?.startsWith("Bearer ")) {
    throw new ApiError("Missing auth token", 401)
  }

  const token = authorization.slice("Bearer ".length)
  const supabaseIdentity = await getSupabaseIdentityFromToken(token)

  if (supabaseIdentity) {
    return supabaseIdentity
  }

  const payload = await verifyFirebaseToken(token)

  if (!payload.email) {
    throw new ApiError("Firebase token is missing email", 401)
  }

  return normalizeUserIdentity(payload.email)
}

async function getSupabaseIdentityFromToken(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "")
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    })

    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user?.email) {
      return null
    }

    return normalizeUserIdentity(data.user.email)
  } catch {
    return null
  }
}

export function toApiErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof SecurityError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  if (error instanceof ApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  const isDevelopment = process.env.NODE_ENV !== "production"
  const message = isDevelopment && error instanceof Error ? error.message : fallbackMessage
  return NextResponse.json({ message }, { status: 500 })
}

/**
 * Verifies a Firebase JWT token using RS256 signature verification
 * Validates token format, claims (aud, iss, exp, iat), and cryptographic signature
 */
export async function verifyFirebaseToken(token: string): Promise<FirebaseTokenPayload> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".")

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new ApiError("Invalid Firebase token format", 401)
  }

  const header = parseFirebaseTokenPart<{ alg?: string; kid?: string }>(encodedHeader)
  const payload = parseFirebaseTokenPart<FirebaseTokenPayload>(encodedPayload)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()

  if (!projectId) {
    throw new Error("Firebase project id is not configured")
  }

  if (header.alg !== "RS256" || !header.kid) {
    throw new ApiError("Unsupported Firebase token header", 401)
  }

  if (payload.aud !== projectId) {
    throw new ApiError("Firebase token audience mismatch", 401)
  }

  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new ApiError("Firebase token issuer mismatch", 401)
  }

  if (!payload.sub) {
    throw new ApiError("Firebase token subject is missing", 401)
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp <= now || payload.iat > now) {
    throw new ApiError("Firebase token is expired or invalid", 401)
  }

  const certificates = await fetchFirebaseCertificates()
  const certificate = certificates[header.kid]

  if (!certificate) {
    throw new ApiError("Firebase signing certificate not found", 401)
  }

  const verifier = createVerify("RSA-SHA256")
  verifier.update(`${encodedHeader}.${encodedPayload}`)
  verifier.end()

  const isValid = verifier.verify(certificate, base64UrlToBuffer(encodedSignature))
  if (!isValid) {
    throw new ApiError("Firebase token signature verification failed", 401)
  }

  return payload
}

/**
 * Fetches Firebase signing certificates from Google's public endpoint
 * Certificates are cached by Next.js for 1 hour via revalidate
 */
async function fetchFirebaseCertificates(): Promise<Record<string, string>> {
  const response = await fetch(FIREBASE_CERTS_URL, {
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error("Unable to fetch Firebase signing certificates")
  }

  return (await response.json()) as Record<string, string>
}


function parseFirebaseTokenPart<T>(value: string): T {
  try {
    return JSON.parse(base64UrlDecode(value)) as T
  } catch {
    throw new ApiError("Invalid Firebase token payload", 401)
  }
}

/**
 * Decodes a base64url encoded string to plain text
 */
function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/")
  while (base64.length % 4 !== 0) {
    base64 += "="
  }
  return Buffer.from(base64, "base64").toString("utf8")
}

/**
 * Converts a base64url encoded string to a Buffer for cryptographic operations
 */
function base64UrlToBuffer(input: string): Buffer {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/")
  while (base64.length % 4 !== 0) {
    base64 += "="
  }
  return Buffer.from(base64, "base64")
}
