import hsnSacData from "../HSNandSAC.json"

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

const rawData = hsnSacData as {
  HSN?: RawTaxEntry[]
  SAC?: RawTaxEntry[]
}

const entries = buildEntries()

export function findHsnSacTaxInfo(input: string | number | undefined | null): HsnSacTaxInfo | null {
  const code = normalizeCode(input)
  if (!code) return null

  return (
    entries.find((entry) => entry.codes.includes(code)) ||
    entries.find((entry) => entry.codes.some((candidate) => code.startsWith(candidate))) ||
    null
  )
}

export function formatTaxRate(rate: number) {
  return `${rate.toFixed(rate % 1 === 0 ? 0 : 2)}%`
}

function buildEntries() {
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
