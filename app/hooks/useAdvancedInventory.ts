import { db } from "@/app/lib/db"
import { notify } from "@/app/lib/notifications"
import { en } from "@/app/messages/en"
import useAuthLiveQuery from "./useAuthLiveQuery"

export type InventoryLocationLike = {
  id: string
  name: string
  isDefault?: boolean
}

export function getPreferredInventoryLocation(locations: InventoryLocationLike[]) {
  return locations.find((location) => location.isDefault) || locations[0] || null
}

export function useInventoryLocations() {
  const { data: locations, loading } = useAuthLiveQuery(
    [],
    (userId) => db.inventoryLocations.where("userId").equals(userId).toArray(),
    (error) => {
      console.error("Inventory locations load failed", error)
      notify.error(en.advancedInventory.locationsLoadFailed)
    },
  )
  return { locations, loading }
}

export function useProductLocationStocks() {
  const { data: locationStocks, loading } = useAuthLiveQuery(
    [],
    (userId) => db.productLocationStocks.where("userId").equals(userId).toArray(),
    (error) => {
      console.error("Location stocks load failed", error)
      notify.error(en.advancedInventory.locationStockLoadFailed)
    },
  )
  return { locationStocks, loading }
}

export function useInventoryBatches() {
  const { data: batches, loading } = useAuthLiveQuery(
    [],
    (userId) => db.inventoryBatches.where("userId").equals(userId).toArray(),
    (error) => {
      console.error("Inventory batches load failed", error)
      notify.error(en.advancedInventory.batchLoadFailed)
    },
  )
  return { batches, loading }
}

export function useStockTransfers() {
  const { data: transfers, loading } = useAuthLiveQuery(
    [],
    (userId) => db.stockTransfers.where("userId").equals(userId).reverse().sortBy("createdAt"),
    (error) => {
      console.error("Stock transfers load failed", error)
      notify.error(en.advancedInventory.transfersLoadFailed)
    },
  )
  return { transfers, loading }
}
