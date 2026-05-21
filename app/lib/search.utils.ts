export function buildSearchText(values: Array<unknown>): string {
  return values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map((value) => String(value))
    .join(" ")
    .toLowerCase()
}

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase()
}

export function matchesSearchQuery(values: Array<unknown>, query: string): boolean {
  const normalizedQuery = normalizeSearchQuery(query)
  if (!normalizedQuery) return true
  return buildSearchText(values).includes(normalizedQuery)
}
