"use client"

import { useEffect, useState } from "react"
import { liveQuery } from "dexie"
import { auth } from "@/app/lib/firebase"
import { db, Product, ProductLog } from "@/app/lib/db"
import { getUserIdentityFromAuthUser } from "@/app/lib/userIdentity"

type InventoryDataState = {
  products: Product[]
  logs: ProductLog[]
  loading: boolean
}

export default function useInventoryData(): InventoryDataState {
  const [products, setProducts] = useState<Product[]>([])
  const [logs, setLogs] = useState<ProductLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let liveSubscription: { unsubscribe: () => void } | null = null

    const unsubscribe = auth.onAuthStateChanged((user) => {
      liveSubscription?.unsubscribe()
      liveSubscription = null

      if (!user) {
        setProducts([])
        setLogs([])
        setLoading(false)
        return
      }

      const userId = getUserIdentityFromAuthUser(user)
      if (!userId) {
        setProducts([])
        setLogs([])
        setLoading(false)
        return
      }

      setLoading(true)

      liveSubscription = liveQuery(async () => {
        const userProducts = await db.products.where("userId").equals(userId).toArray()
        const productIds = userProducts.map((product) => product.id)
        const userLogs = productIds.length
          ? await db.productLogs.where("productId").anyOf(productIds).toArray()
          : []

        return {
          products: userProducts,
          logs: userLogs.sort((left, right) => right.date.localeCompare(left.date)),
        }
      }).subscribe({
        next: (data) => {
          setProducts(data.products)
          setLogs(data.logs)
          setLoading(false)
        },
        error: (err) => {
          console.error("Inventory data fetch error:", err)
          setProducts([])
          setLogs([])
          setLoading(false)
        },
      })
    })

    return () => {
      liveSubscription?.unsubscribe()
      unsubscribe()
    }
  }, [])

  return { products, logs, loading }
}
