type RawTaxEntry = {
  HSN_Code?: string | number
  SAC?: string | number
  Description?: string | number
  CGST?: string | number
  "SGST or UTGST"?: string | number
  IGST?: string | number
  Condition?: string | number
}

export type HsnSacTaxInfo = {
  code: string
  type: "HSN" | "SAC"
  description: string
  cgstRate: number
  sgstRate: number
  igstRate: number
  condition?: string
}

type HsnSacIndex = {
  exactCodeMap: Map<string, HsnSacTaxInfo>
  prefixCandidates: Array<{ code: string; entry: HsnSacTaxInfo }>
}

let cachedIndex: HsnSacIndex | null = null
let indexPromise: Promise<HsnSacIndex> | null = null

export function findHsnSacTaxInfo(input: string | number | undefined | null): HsnSacTaxInfo | null {
  if (!cachedIndex) return null
  return findFromIndex(cachedIndex, input)
}

export async function loadHsnSacTaxInfo(input: string | number | undefined | null): Promise<HsnSacTaxInfo | null> {
  const index = await warmHsnSacLookup()
  return findFromIndex(index, input)
}

export async function warmHsnSacLookup(): Promise<HsnSacIndex> {
  if (cachedIndex) return cachedIndex
  if (!indexPromise) {
    indexPromise = import("../HSNandSAC.json").then((module) => {
      const rawData = module.default as {
        HSN?: RawTaxEntry[]
        SAC?: RawTaxEntry[]
      }
      const entries = buildEntries(rawData)
      const nextIndex = {
        exactCodeMap: buildExactCodeMap(entries),
        prefixCandidates: entries
          .flatMap((entry) => entry.codes.map((code) => ({ code, entry })))
          .sort((left, right) => right.code.length - left.code.length),
      }
      cachedIndex = nextIndex
      return nextIndex
    })
  }
  return indexPromise
}

export function formatTaxRate(rate: number) {
  return `${rate.toFixed(rate % 1 === 0 ? 0 : 2)}%`
}

function findFromIndex(index: HsnSacIndex, input: string | number | undefined | null) {
  const code = normalizeCode(input)
  if (!code) return null

  const exactMatch = index.exactCodeMap.get(code)
  if (exactMatch) return exactMatch

  return index.prefixCandidates.find((candidate) => code.startsWith(candidate.code))?.entry || null
}

function buildEntries(rawData: { HSN?: RawTaxEntry[]; SAC?: RawTaxEntry[] }) {
  return [
    ...(rawData.HSN || []).flatMap((entry) => buildEntry(entry, "HSN")),
    ...(rawData.SAC || []).flatMap((entry) => buildEntry(entry, "SAC")),
  ]
}

function buildEntry(entry: RawTaxEntry, type: "HSN" | "SAC") {
  if (!entry || typeof entry !== "object") {
    return []
  }

  const codeValue = type === "HSN" ? entry.HSN_Code : entry.SAC
  const codes = splitCodes(codeValue)
  const description = cleanText(entry.Description)
  const cgstRate = normalizeRate(entry.CGST)
  const sgstRate = normalizeRate(entry["SGST or UTGST"])
  const igstRate = normalizeRate(entry.IGST)

  if (!codes.length || !description || cgstRate === null || sgstRate === null || igstRate === null) {
    return []
  }

  return [{
    code: codes.join(", "),
    codes,
    type,
    description,
    cgstRate,
    sgstRate,
    igstRate,
    condition: cleanText(entry.Condition),
  }]
}

function splitCodes(value: string | number | undefined) {
  if (value === undefined || value === null) return []

  return String(value)
    .split(",")
    .map(normalizeCode)
    .filter((code): code is string => Boolean(code))
}

function normalizeCode(value: string | number | undefined | null) {
  if (value === undefined || value === null) return null
  const cleaned = String(value).replace(/\D/g, "")
  return cleaned || null
}

function normalizeRate(value: string | number | undefined) {
  if (value === undefined || value === null || value === "") return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null

  return parsed <= 1 ? parsed * 100 : parsed
}

function cleanText(value: string | number | undefined) {
  if (value === undefined || value === null) return undefined
  const text = String(value).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
  return text || undefined
}

function buildExactCodeMap(items: Array<HsnSacTaxInfo & { codes: string[] }>) {
  const map = new Map<string, HsnSacTaxInfo>()
  for (const entry of items) {
    for (const code of entry.codes) {
      if (!map.has(code)) map.set(code, entry)
    }
  }
  return map
}
