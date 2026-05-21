import { DEFAULT_QUANTITY_UNIT } from "@/app/lib/quantityUnit"
import { v4 as uuidv4 } from "uuid"

export type QuickPurchaseRow = {
    id: string
    name: string
    price: string
    quantity: string
    quantityUnit: string
    category?: string
    sku?: string
    hsnCode?: string
    batchNo?: string
    locationId?: string
    locationName?: string
    note: string
    supplierName?: string
}

export const createEmptyRow = (): QuickPurchaseRow => ({
    id: uuidv4(),
    name: "",
    price: "",
    quantity: "",
    quantityUnit: DEFAULT_QUANTITY_UNIT,
    category: "",
    sku: "",
    hsnCode: "",
    batchNo: "",
    locationId: "",
    locationName: "",
    note: "",
    supplierName: "",
})

export function getCurrentDateTime() {
    return new Date()
}

export function formatCurrentDateTime(value: Date) {
    return value.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    })
}