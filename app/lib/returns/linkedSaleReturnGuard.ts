"use client"

import { db, type ReturnDocumentRecord, type SaleRecord } from "@/app/lib/db"
import { roundCurrency } from "@/app/lib/gst.utils"
import { en } from "@/app/messages/en"

export async function assertLinkedSaleAllowsReturn(linkedSaleId: string, items: Array<{ productId?: string; name?: string; quantity: number }>) {
  const linkedSale = await db.sales.get(linkedSaleId)
  if (!linkedSale) throw new Error(en.sales.saleRecordNotFound)
  if (linkedSale.status === "cancelled") throw new Error(en.exchange.linkedSaleCancelled)

  const priorCorrections = await db.returnDocuments
    .where("linkedSaleId")
    .equals(linkedSale.id)
    .toArray()

  assertCumulativeReturnedQuantities(linkedSale, priorCorrections, items)
  return linkedSale
}

export function assertCumulativeReturnedQuantities(
  linkedSale: SaleRecord,
  priorCorrections: ReturnDocumentRecord[],
  currentItems: Array<{ productId?: string; name?: string; quantity: number }>,
) {
  const soldQuantities = new Map<string, number>()
  linkedSale.items.forEach((item) => {
    soldQuantities.set(item.productId, roundCurrency((soldQuantities.get(item.productId) || 0) + Number(item.quantity || 0)))
  })

  const alreadyReturned = new Map<string, number>()
  priorCorrections
    .filter((document) => document.stockImpact === "stock-in")
    .forEach((document) => {
      document.items.forEach((item) => {
        if (!item.productId) return
        alreadyReturned.set(item.productId, roundCurrency((alreadyReturned.get(item.productId) || 0) + Number(item.quantity || 0)))
      })
    })

  const requestedNow = new Map<string, number>()
  currentItems.forEach((item) => {
    if (!item.productId) return
    requestedNow.set(item.productId, roundCurrency((requestedNow.get(item.productId) || 0) + Number(item.quantity || 0)))
  })

  for (const [productId, quantityNow] of requestedNow.entries()) {
    const soldQuantity = Number(soldQuantities.get(productId) || 0)
    const priorReturnedQuantity = Number(alreadyReturned.get(productId) || 0)
    const allowedRemaining = roundCurrency(Math.max(soldQuantity - priorReturnedQuantity, 0))
    if (quantityNow > allowedRemaining) {
      const matchingItem = linkedSale.items.find((item) => item.productId === productId)
      throw new Error(
        en.exchange.returnQuantityExceedsSale
          .replace("{name}", matchingItem?.name || en.receipt.product)
          .replace("{sold}", String(allowedRemaining)),
      )
    }
  }
}
