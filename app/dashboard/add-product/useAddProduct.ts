"use client"

import { useState } from "react"
import { addProduct } from "@/app/dashboard/add-product/product.service"
import { auth } from "@/app/components/client/useClient"
import { autoSyncToDrive } from "@/app/lib/autoSync.service"
import { toast } from "sonner"
import { scheduleSync } from "@/app/lib/syncManager"

export default function useAddProduct() {
  const [loading, setLoading] = useState(false)

  const createProduct = async (data: {
    name: string
    price: string
    quantity: string
    category?: string
    supplier?: string
    expiry?: string
    note?: string
    sku?: string
  }) => {

    try {
      setLoading(true)

      const userId = auth.currentUser?.email

      if (!userId) {
        toast.error("User not logged in")
        return
      }

      // ✅ Save locally
      await addProduct({
        name: data.name,
        price: Number(data.price),
        quantity: Number(data.quantity),
        category: data.category,
        supplier: data.supplier,
        expiry: data.expiry,
        note: data.note,
        sku: data.sku,
        userId: userId
      })

      toast.success("Product saved ✅")

      // ✅ AUTO SYNC (non-blocking)
      //autoSyncToDrive()
      scheduleSync();

    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return { createProduct, loading }
}