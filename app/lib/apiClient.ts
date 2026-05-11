"use client"

import { auth } from "./firebase"

export async function getFirebaseIdToken() {
  const user = auth.currentUser
  if (!user) return null

  return user.getIdToken()
}

export function authHeaders(token: string, json = false) {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  }
}

export async function readApiError(response: Response, fallbackLabel = "API request") {
  try {
    return await response.json()
  } catch {
    return {
      message: `${fallbackLabel} failed with status ${response.status}`,
    }
  }
}

export function isMissingTableError(error: unknown, tableName: string) {
  if (!error || typeof error !== "object") return false

  const details = error as { code?: string; message?: string }
  const message = details.message || ""

  return (
    details.code === "42P01" ||
    (new RegExp(tableName, "i").test(message) && /does not exist|schema cache/i.test(message))
  )
}
