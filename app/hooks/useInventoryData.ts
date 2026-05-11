import { db, Product, ProductLog } from "@/app/lib/db"
import useAuthLiveQuery from "./useAuthLiveQuery"

type InventoryDataState = {
  products: Product[]
  logs: ProductLog[]
  loading: boolean
}

type InventoryQueryData = Omit<InventoryDataState, "loading">

const EMPTY_INVENTORY_DATA: InventoryQueryData = {
  products: [],
  logs: [],
}

export default function useInventoryData(): InventoryDataState {
  const { data, loading } = useAuthLiveQuery(
    EMPTY_INVENTORY_DATA,
    async (userId) => {
      const products = await db.products.where("userId").equals(userId).toArray()
      const productIds = products.map((product) => product.id)
      const logs = productIds.length
        ? await db.productLogs.where("productId").anyOf(productIds).toArray()
        : []

      return {
        products,
        logs: logs.sort((left, right) => right.date.localeCompare(left.date)),
      }
    },
    (error) => console.error("Inventory data fetch error:", error)
  )

  return { ...data, loading }
}
