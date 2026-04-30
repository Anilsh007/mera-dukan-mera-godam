import { useEffect, useState } from "react"
import { liveQuery } from "dexie"
import { db, Product } from "@/app/lib/db"
import { auth } from "@/app/lib/firebase"
import { getUserIdentityFromAuthUser } from "@/app/lib/userIdentity"

export default function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let liveSubscription: { unsubscribe: () => void } | null = null

    const unsubscribe = auth.onAuthStateChanged((user) => {
      liveSubscription?.unsubscribe()
      liveSubscription = null

      if (!user) {
        setProducts([])
        setLoading(false)
        return
      }

      const userId = getUserIdentityFromAuthUser(user)
      if (!userId) {
        setProducts([])
        setLoading(false)
        return
      }

      liveSubscription = liveQuery(() =>
        db.products.where("userId").equals(userId).toArray()
      ).subscribe({
        next: (data) => {
          setProducts(data)
          setLoading(false)
        },
        error: (err) => {
          console.error("Products fetch error:", err)
          setLoading(false)
        },
      })

    })

    return () => {
      liveSubscription?.unsubscribe()
      unsubscribe()
    }
  }, [])

  return { products, loading }
}
