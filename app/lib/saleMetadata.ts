export type SaleMetadata = {
  buyerName?: string
  buyerPhone?: string
  buyerGstin?: string
  note?: string
}

const SALE_META_PREFIX = "__SALE_META__"

export function buildSaleLogNote(metadata: SaleMetadata) {
  const hasMetadata = metadata.buyerName || metadata.buyerPhone || metadata.buyerGstin
  if (!hasMetadata) return metadata.note || undefined

  return `${SALE_META_PREFIX}${JSON.stringify(metadata)}`
}

export function parseSaleLogNote(rawNote?: string | null) {
  if (!rawNote) {
    return {
      buyerName: "",
      buyerPhone: "",
      buyerGstin: "",
      note: "",
      cleanNote: "",
    }
  }

  if (!rawNote.startsWith(SALE_META_PREFIX)) {
    return {
      buyerName: "",
      buyerPhone: "",
      buyerGstin: "",
      note: rawNote,
      cleanNote: rawNote,
    }
  }

  try {
    const parsed = JSON.parse(rawNote.slice(SALE_META_PREFIX.length)) as SaleMetadata
    return {
      buyerName: parsed.buyerName || "",
      buyerPhone: parsed.buyerPhone || "",
      buyerGstin: parsed.buyerGstin || "",
      note: parsed.note || "",
      cleanNote: parsed.note || "",
    }
  } catch {
    return {
      buyerName: "",
      buyerPhone: "",
      buyerGstin: "",
      note: rawNote,
      cleanNote: rawNote,
    }
  }
}
