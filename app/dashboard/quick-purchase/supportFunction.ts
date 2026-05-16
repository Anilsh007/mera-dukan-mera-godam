import { DEFAULT_QUANTITY_UNIT } from "@/app/lib/quantityUnit"
import { v4 as uuidv4 } from "uuid"

export type QuickPurchaseRow = {
    id: string
    name: string
    price: string
    quantity: string
    quantityUnit: string
    note: string
    supplierName?: string
}

export const createEmptyRow = (): QuickPurchaseRow => ({
    id: uuidv4(),
    name: "",
    price: "",
    quantity: "",
    quantityUnit: DEFAULT_QUANTITY_UNIT,
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