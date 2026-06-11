"use client"

import { auth } from "./firebase"

export async function getFirebaseIdToken() {
  const user = auth?.currentUser
  if (!user) return null

  return user.getIdToken()
}

export function authHeaders(token: string | null, json = false) {
  if (!token) {
    throw new Error("Missing auth token")
  }

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  }
}

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 15000) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, {
      ...init,
      signal: init.signal || controller.signal,
      cache: init.cache || "no-store",
    })
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function readApiError(response: Response, fallbackLabel = "API request") {
  const fallbackMessage = `${fallbackLabel} failed with status ${response.status} ${response.statusText || ""}`.trim()

  try {
    const text = await response.text()
    if (!text) return { message: fallbackMessage, status: response.status }

    try {
      const json = JSON.parse(text)
      return {
        message: json?.message || json?.error || json?.details || json?.hint || fallbackMessage,
        status: response.status,
        ...json,
      }
    } catch {
      return { message: text || fallbackMessage, status: response.status }
    }
  } catch {
    return { message: fallbackMessage, status: response.status }
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
