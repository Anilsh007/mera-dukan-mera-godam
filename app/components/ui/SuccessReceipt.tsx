"use client"

import { useMemo, useRef } from "react"
import { MdCheckCircle, MdPrint, MdClose } from "react-icons/md"
import Button from "./Button"

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
  const printRef = useRef<HTMLDivElement>(null)
  const receiptRef = useMemo(
    () => `REC-${data.map((row) => row.id.slice(0, 2)).join("").slice(0, 8).toUpperCase() || "STOCK001"}`,
    [data]
  )

  const totalAmount = data.reduce((sum, row) => 
    sum + (Number(row.price) || 0) * (Number(row.quantity) || 0), 0
  )

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML
    if (!printContents) return

    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Stock Entry Receipt</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; }
            h2 { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h2>Stock Entry Receipt</h2>
          ${printContents}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const currentDate = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[var(--bg-card-strong)] backdrop-blur-xl rounded-2xl shadow-2xl border border-[var(--border-card)] overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-emerald-500 p-4 text-white sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <MdCheckCircle size={32} />
            <div>
              <h3 className="text-xl font-bold">Entry Successful!</h3>
              <p className="text-emerald-100 text-sm">{data.length} product(s) added to inventory</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-emerald-600 rounded-full transition">
            <MdClose size={24} />
          </button>
        </div>

        {/* Receipt Content */}
        <div ref={printRef} className="p-6 overflow-y-auto flex-1">
          <div className="mb-4 flex justify-between text-sm text-[var(--text-muted)] border-b border-[var(--border-card)] pb-2">
            <span>Date: {currentDate}</span>
            <span>Ref: #{receiptRef}</span>
          </div>

          <div className="space-y-3">
            {data.map((row, index) => (
              <div key={row.id} className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-card)]">
                <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="text-xs font-medium text-[var(--text-muted)]">#{index + 1}</span>
                    <h4 className="font-bold text-[var(--text-primary)] text-lg">{row.name || "Unnamed Product"}</h4>
                    {row.category && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {row.category}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600">
                      ₹{((Number(row.price) || 0) * (Number(row.quantity) || 0)).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      ₹{Number(row.price).toLocaleString("en-IN")} × {row.quantity} units
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-1 gap-2 border-t border-[var(--border-card)] pt-3 text-sm sm:grid-cols-2">
                  {row.sku && (
                    <div><span className="text-[var(--text-muted)]">SKU:</span> {row.sku}</div>
                  )}
                  {row.expiry && (
                    <div><span className="text-[var(--text-muted)]">Expiry:</span> {new Date(row.expiry).toLocaleDateString("en-IN")}</div>
                  )}
                  {row.supplier && (
                    <div><span className="text-[var(--text-muted)]">Supplier:</span> {row.supplier}</div>
                  )}
                  {row.note && (
                    <div className="col-span-2 text-[var(--text-secondary)] italic">&quot;{row.note}&quot;</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t-2 border-emerald-500 flex justify-between items-center">
            <span className="text-lg font-medium text-[var(--text-secondary)]">Grand Total</span>
            <span className="text-3xl font-black text-emerald-600">₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-[var(--border-card)] bg-[var(--bg-primary)] p-4 sm:flex-row">
          <Button 
            type="button" 
            onClick={handlePrint} 
            variant="secondary" 
            icon={<MdPrint />}
            title="Print Receipt"
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={onAddMore} 
            variant="primary" 
            icon={<MdClose />}
            title="Add More Products"
            className="flex-1"
          />
        </div>
      </div>
    </div>
  )
}
