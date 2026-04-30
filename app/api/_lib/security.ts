import { NextRequest } from "next/server"

type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
}

type RateLimitBucket = {
  count: number
  resetAt: number
}

const globalStore = globalThis as typeof globalThis & {
  __mdmgRateLimitStore?: Map<string, RateLimitBucket>
}

const rateLimitStore = globalStore.__mdmgRateLimitStore || new Map<string, RateLimitBucket>()
globalStore.__mdmgRateLimitStore = rateLimitStore

export class SecurityError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export function assertContentLength(request: NextRequest, maxBytes: number) {
  const contentLength = request.headers.get("content-length")
  if (!contentLength) return

  const parsed = Number(contentLength)
  if (Number.isFinite(parsed) && parsed > maxBytes) {
    throw new SecurityError("Request payload too large", 413)
  }
}

export function enforceRateLimit(request: NextRequest, options: RateLimitOptions) {
  const now = Date.now()
  const clientIp = getClientIp(request)
  const bucketKey = `${options.key}:${clientIp}`
  const existing = rateLimitStore.get(bucketKey)

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    })
    return
  }

  if (existing.count >= options.limit) {
    throw new SecurityError("Too many requests. Please try again later.", 429)
  }

  existing.count += 1
  rateLimitStore.set(bucketKey, existing)
}

export function sanitizeOptionalText(value: unknown, maxLength: number) {
  if (value === null || value === undefined || value === "") return undefined
  if (typeof value !== "string") throw new SecurityError("Invalid text field", 400)

  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim()
  if (cleaned.length > maxLength) {
    throw new SecurityError(`Text field exceeds ${maxLength} characters`, 400)
  }

  return cleaned
}

export function sanitizeRequiredText(value: unknown, maxLength: number, fieldName: string) {
  const cleaned = sanitizeOptionalText(value, maxLength)
  if (!cleaned) {
    throw new SecurityError(`${fieldName} is required`, 400)
  }
  return cleaned
}

export function assertFiniteNumber(value: unknown, fieldName: string, options?: { min?: number; max?: number }) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new SecurityError(`${fieldName} must be a valid number`, 400)
  }

  if (options?.min !== undefined && parsed < options.min) {
    throw new SecurityError(`${fieldName} must be at least ${options.min}`, 400)
  }

  if (options?.max !== undefined && parsed > options.max) {
    throw new SecurityError(`${fieldName} must be at most ${options.max}`, 400)
  }

  return parsed
}

export function assertIsoDate(value: unknown, fieldName: string) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new SecurityError(`${fieldName} must be a valid date`, 400)
  }
  return value
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp

  return "unknown"
}
