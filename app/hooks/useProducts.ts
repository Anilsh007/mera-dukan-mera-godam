import { db, Product } from "@/app/lib/db"
import useAuthLiveQuery from "./useAuthLiveQuery"

const EMPTY_PRODUCTS: Product[] = []

export default function useProducts() {
  const { data: products, loading } = useAuthLiveQuery(
    EMPTY_PRODUCTS,
    (userId) => db.products.where("userId").equals(userId).toArray(),
    (error) => console.error("Products fetch error:", error)
  )

  return { products, loading }
}
