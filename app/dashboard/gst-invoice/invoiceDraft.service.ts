"use client"

import type { GSTInvoiceItem } from "./types/gst.types"

export type SaleInvoiceDraft = {
  buyer?: {
    name?: string
    gstin?: string
    phone?: string
    email?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
  }
  items: GSTInvoiceItem[]
  notes?: string
  sourceProductId?: string
  sourceProductName?: string
  createdAt: string
}

const STORAGE_KEY = "mdmg-sale-invoice-draft"

export function saveSaleInvoiceDraft(draft: SaleInvoiceDraft) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

export function consumeSaleInvoiceDraft(): SaleInvoiceDraft | null {
  if (typeof window === "undefined") return null

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  window.localStorage.removeItem(STORAGE_KEY)

  try {
    return JSON.parse(raw) as SaleInvoiceDraft
  } catch {
    return null
  }
}
