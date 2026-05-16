"use client"

import { useMemo } from "react"
import { MdAdd, MdCheckCircle, MdPrint } from "react-icons/md"
import { notify as toast } from "@/app/lib/notifications"
import Button from "./Button"
import Modal from "./Modal"
import TransactionDocument from "./TransactionDocument"
import { en } from "@/app/messages/en"
import {
  buildBusinessDocumentProfile,
  printTransactionDocument,
  type TransactionDocumentData,
} from "@/app/lib/transactionDocument"
import useProfile from "@/app/dashboard/profile/useProfile"

type ProductRow = {
  id: string
  name: string
  price: string
  quantity: string
  category: string
  supplier: string
  expiry: string
  note: string
  sku: string
}

interface SuccessReceiptProps {
  data: ProductRow[]
  onClose: () => void
  onAddMore: () => void
}

export default function SuccessReceipt({ data, onClose, onAddMore }: SuccessReceiptProps) {
  const { profile } = useProfile()
  const seller = buildBusinessDocumentProfile(profile)
  const receiptRef = useMemo(
    () => `REC-${data.map((row) => row.id.slice(0, 2)).join("").slice(0, 8).toUpperCase() || "STOCK001"}`,
    [data]
  )

  const totalAmount = data.reduce((sum, row) =>
    sum + (Number(row.price) || 0) * (Number(row.quantity) || 0), 0
  )

  const documentData: TransactionDocumentData = {
    type: "receipt",
    title: en.receipt.stockEntryReceipt,
    reference: receiptRef,
    date: new Date().toLocaleString("en-IN"),
    seller,
    partyLabel: en.inventory.supplier,
    party: { name: data.map((row) => row.supplier).filter(Boolean)[0] || "" },
    items: data.map((row) => ({
      name: row.name || en.inventory.unnamedProduct,
      description: [row.category, row.sku ? `${en.inventory.sku}: ${row.sku}` : "", row.expiry ? `${en.inventory.expiry}: ${new Date(row.expiry).toLocaleDateString("en-IN")}` : ""].filter(Boolean).join(" | "),
      quantity: row.quantity,
      unit: en.inventory.units,
      rate: Number(row.price || 0),
      total: (Number(row.price) || 0) * (Number(row.quantity) || 0),
      note: row.note,
    })),
    totals: { grandTotal: totalAmount },
  }

  const handlePrint = () => {
    const opened = printTransactionDocument(documentData)
    if (opened) toast.success(en.common.printStarted)
    else toast.error(en.common.popupBlocked)
  }

  return (
    <Modal
      title={en.inventory.entrySuccessful}
      description={`${data.length} ${en.inventory.productsAddedToInventory}`}
      titleIcon={<MdCheckCircle size={28} />}
      onClose={onClose}
      size="xl"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={handlePrint}
            variant="secondary"
            icon={<MdPrint />}
            title={en.inventory.printReceipt}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={onAddMore}
            variant="primary"
            icon={<MdAdd />}
            title={en.inventory.addMoreProducts}
            className="flex-1"
          />
        </div>
      }
    >
      <TransactionDocument document={documentData} profile={seller} />
    </Modal>
  )
}
