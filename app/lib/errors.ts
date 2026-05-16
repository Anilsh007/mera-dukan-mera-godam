export function toUserErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback

  const message = error.message?.trim()
  if (!message) return fallback

  const technicalPatterns = [
    /firebase/i,
    /supabase/i,
    /dexie/i,
    /indexeddb/i,
    /network/i,
    /fetch/i,
    /unexpected/i,
    /\.env/i,
    /permission/i,
    /token/i,
    /stack/i,
  ]

  if (message.length > 160 || technicalPatterns.some((pattern) => pattern.test(message))) {
    return fallback
  }

  return message
}
