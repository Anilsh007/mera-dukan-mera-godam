export function trimOrUndefined(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function trimToLowerOrUndefined(value?: string | null) {
  const trimmed = value?.trim().toLowerCase()
  return trimmed ? trimmed : undefined
}

export function trimToUpperOrUndefined(value?: string | null) {
  const trimmed = value?.trim().toUpperCase()
  return trimmed ? trimmed : undefined
}

export function toFiniteNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

export function requirePositiveNumber(value: unknown, errorMessage: string) {
  const parsed = toFiniteNumber(value)
  if (parsed === undefined || parsed <= 0) throw new Error(errorMessage)
  return parsed
}

export function requireNonNegativeNumber(value: unknown, errorMessage: string) {
  const parsed = toFiniteNumber(value)
  if (parsed === undefined || parsed < 0) throw new Error(errorMessage)
  return parsed
}

export type ContactLike = {
  name?: string | null
  gstin?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
}

export function normalizeContactLike<T extends ContactLike>(value?: T) {
  if (!value) return undefined

  const normalized = {
    name: trimOrUndefined(value.name),
    gstin: trimToUpperOrUndefined(value.gstin),
    phone: trimOrUndefined(value.phone),
    email: trimOrUndefined(value.email),
    address: trimOrUndefined(value.address),
    city: trimOrUndefined(value.city),
    state: trimOrUndefined(value.state),
    pincode: trimOrUndefined(value.pincode),
  }

  return Object.values(normalized).some(Boolean) ? normalized : undefined
}
