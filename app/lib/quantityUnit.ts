export const QUANTITY_UNITS = [
  { value: "pcs", label: "Pieces" },
  { value: "kg", label: "KG" },
  { value: "g", label: "Gram" },
  { value: "ton", label: "Ton" },
  { value: "liter", label: "Liter" },
  { value: "ml", label: "ML" },
  { value: "pack", label: "Pack" },
  { value: "box", label: "Box" },
  { value: "bag", label: "Bag" },
  { value: "bottle", label: "Bottle" },
  { value: "meter", label: "Meter" },
  { value: "other", label: "Other" },
] as const

export type QuantityUnit = (typeof QUANTITY_UNITS)[number]["value"] | string

export const DEFAULT_QUANTITY_UNIT = " "

export function normalizeQuantityUnit(unit: string | null | undefined) {
  const cleaned = unit?.trim().toLowerCase()
  return cleaned || DEFAULT_QUANTITY_UNIT
}

export function formatQuantity(quantity: number | string, unit: string | null | undefined) {
  return `${quantity} ${normalizeQuantityUnit(unit)}`
}
