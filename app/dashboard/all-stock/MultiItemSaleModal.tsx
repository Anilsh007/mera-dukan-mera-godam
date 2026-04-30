"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Button from "@/app/components/utility/Button"
import Input from "@/app/components/utility/CommonInput"
import type { Product } from "@/app/lib/db"
import { stockOutMany } from "@/app/dashboard/add-product/product.service"
import { loadInvoicesFromDb } from "@/app/dashboard/gst-invoice/invoice.service"
import { buildBuyerSuggestions, matchBuyerSuggestion } from "@/app/dashboard/gst-invoice/buyerSuggestions"
import { createEmptyInvoiceItem } from "@/app/dashboard/gst-invoice/types/gst.types"
import { saveSaleInvoiceDraft } from "@/app/dashboard/gst-invoice/invoiceDraft.service"
import useProfile from "@/app/dashboard/profile/useProfile"

type SaleLine = {
  productId: string
  name: string
  sku?: string
  category?: string
  availableQty: number
  quantity: string
  salePrice: string
  gstRate: string
}

type BuyerForm = {
  name: string
  gstin: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  pincode: string
  note: string
}

const emptyBuyer: BuyerForm = {
  name: "",
  gstin: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  note: "",
}

export default function MultiItemSaleModal({
  products,
  onClose,
  onSuccess,
}: {
  products: Product[]
  onClose: () => void
  onSuccess: () => void
}) {
  const router = useRouter()
  const { profile } = useProfile()
  const [lines, setLines] = useState<SaleLine[]>(
    products.map((product) => ({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      availableQty: product.quantity,
      quantity: product.quantity > 0 ? "1" : "0",
      salePrice: String(product.price || 0),
      gstRate: "18",
    }))
  )
  const [buyer, setBuyer] = useState<BuyerForm>(emptyBuyer)
  const [loading, setLoading] = useState(false)
  const [printAfterSave, setPrintAfterSave] = useState(true)
  const [openGstAfterSave, setOpenGstAfterSave] = useState(true)
  const [buyerSuggestions, setBuyerSuggestions] = useState<ReturnType<typeof buildBuyerSuggestions>>([])

  useEffect(() => {
    let mounted = true

    async function loadBuyerHistory() {
      const invoices = await loadInvoicesFromDb()
      if (!mounted) return
      setBuyerSuggestions(buildBuyerSuggestions(invoices))
    }

    loadBuyerHistory()
    return () => {
      mounted = false
    }
  }, [])

  const validLines = useMemo(
    () =>
      lines.filter(
        (line) =>
          Number(line.quantity) > 0 &&
          Number(line.quantity) <= line.availableQty &&
          Number(line.salePrice) > 0
      ),
    [lines]
  )

  const grandTotal = useMemo(
    () => validLines.reduce((sum, line) => sum + Number(line.quantity) * Number(line.salePrice), 0),
    [validLines]
  )

  const sellerName = profile.business.shopName?.trim() || profile.personal.displayName?.trim() || ""
  const sellerPhone = profile.personal.phone?.trim() || ""

  const applyBuyerSuggestion = (
    field: "name" | "gstin" | "phone" | "email",
    value: string
  ) => {
    const matched = matchBuyerSuggestion(buyerSuggestions, field, value)
    setBuyer((current) =>
      matched
        ? {
            ...current,
            ...matched.buyer,
            name: matched.buyer.name || current.name,
            gstin: matched.buyer.gstin || "",
            phone: matched.buyer.phone || "",
            email: matched.buyer.email || "",
            address: matched.buyer.address || "",
            city: matched.buyer.city || "",
            state: matched.buyer.state || "",
            pincode: matched.buyer.pincode || "",
            [field]: value,
          }
        : {
            ...current,
            [field]: value,
          }
    )
  }

  const updateLine = (productId: string, key: keyof SaleLine, value: string) => {
    setLines((current) =>
      current.map((line) => (line.productId === productId ? { ...line, [key]: value } : line))
    )
  }

  const handleConfirm = async () => {
    if (!buyer.name.trim()) {
      toast.error("Buyer name required hai")
      return
    }

    if (!sellerName) {
      toast.error("Sale confirm karne se pehle seller profile me business ya seller name fill karo")
      return
    }

    if (!validLines.length) {
      toast.error("Kam se kam ek valid item select karo")
      return
    }

    try {
      setLoading(true)

      await stockOutMany(
        validLines.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          salePrice: Number(line.salePrice),
          reason: "Sold",
          buyerName: buyer.name.trim(),
          buyerPhone: buyer.phone.trim(),
          buyerGstin: buyer.gstin.trim(),
          note: buyer.note.trim() || undefined,
        }))
      )

      if (openGstAfterSave) {
        saveSaleInvoiceDraft({
          buyer: {
            name: buyer.name.trim(),
            gstin: buyer.gstin.trim(),
            phone: buyer.phone.trim(),
            email: buyer.email.trim(),
            address: buyer.address.trim(),
            city: buyer.city.trim(),
            state: buyer.state.trim(),
            pincode: buyer.pincode.trim(),
          },
          items: validLines.map((line) => {
            const item = createEmptyInvoiceItem()
            item.description = toTitleCase(line.name)
            item.hsnCode = line.sku || ""
            item.quantity = Number(line.quantity)
            item.rate = Number(line.salePrice)
            item.gstRate = Number(line.gstRate || 18)
            item.unit = "pcs"
            return item
          }),
          notes: buyer.note.trim() || undefined,
          createdAt: new Date().toISOString(),
        })
      }

      if (printAfterSave) {
        printSaleSummary(buyer, validLines, {
          name: sellerName,
          phone: sellerPhone,
        })
      }

      toast.success(`Sale saved for ${validLines.length} item${validLines.length > 1 ? "s" : ""}`)
      onSuccess()
      onClose()

      if (openGstAfterSave) {
        router.push("/dashboard/gst-invoice")
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Sale save failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-tight">Create Multi-item Sale</h3>
        <button onClick={onClose} className="cursor-pointer text-xl text-gray-400 hover:text-gray-600">x</button>
      </div>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Buyer details lo, selected items ka stock out karo, aur chahe to print ya GST bill bhi banao.
      </p>

      <datalist id="sale-buyer-name-suggestions">
        {buyerSuggestions.map((suggestion) => (
          <option key={suggestion.key} value={suggestion.buyer.name} />
        ))}
      </datalist>
      <datalist id="sale-buyer-gstin-suggestions">
        {buyerSuggestions.filter((s) => s.buyer.gstin).map((suggestion) => (
          <option key={`${suggestion.key}-gstin`} value={suggestion.buyer.gstin} />
        ))}
      </datalist>
      <datalist id="sale-buyer-phone-suggestions">
        {buyerSuggestions.filter((s) => s.buyer.phone).map((suggestion) => (
          <option key={`${suggestion.key}-phone`} value={suggestion.buyer.phone} />
        ))}
      </datalist>
      <datalist id="sale-buyer-email-suggestions">
        {buyerSuggestions.filter((s) => s.buyer.email).map((suggestion) => (
          <option key={`${suggestion.key}-email`} value={suggestion.buyer.email} />
        ))}
      </datalist>

      <div className="grid gap-4 md:grid-cols-2">
        <Input label={<>Buyer Name <span className="text-red-400">*</span></>} value={buyer.name} onChange={(e) => applyBuyerSuggestion("name", e.target.value)} datalist="sale-buyer-name-suggestions" />
        <Input label="Buyer GSTIN" value={buyer.gstin} onChange={(e) => applyBuyerSuggestion("gstin", e.target.value.toUpperCase())} datalist="sale-buyer-gstin-suggestions" />
        <Input label="Phone" value={buyer.phone} onChange={(e) => applyBuyerSuggestion("phone", e.target.value)} datalist="sale-buyer-phone-suggestions" />
        <Input label="Email" value={buyer.email} onChange={(e) => applyBuyerSuggestion("email", e.target.value)} datalist="sale-buyer-email-suggestions" />
        <Input label="Address" value={buyer.address} onChange={(e) => setBuyer((current) => ({ ...current, address: e.target.value }))} containerClassName="md:col-span-2" />
        <Input label="District/City" value={buyer.city} onChange={(e) => setBuyer((current) => ({ ...current, city: e.target.value }))} />
        <Input label="State" value={buyer.state} onChange={(e) => setBuyer((current) => ({ ...current, state: e.target.value }))} />
        <Input label="Pincode" value={buyer.pincode} onChange={(e) => setBuyer((current) => ({ ...current, pincode: e.target.value }))} />
        <Input label="Sale Note" value={buyer.note} onChange={(e) => setBuyer((current) => ({ ...current, note: e.target.value }))} containerClassName="md:col-span-2" />
      </div>

      <div className="mt-5 space-y-3 md:hidden">
        {lines.map((line) => (
          <div key={line.productId} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium capitalize text-[var(--text-primary)]">{line.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{line.category || "Uncategorized"}{line.sku ? ` • ${line.sku}` : ""}</p>
              </div>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">Avail: {line.availableQty}</p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input type="number" min={0} max={line.availableQty} label="Qty to Sell" value={line.quantity} onChange={(e) => updateLine(line.productId, "quantity", e.target.value)} />
              <Input type="number" min={0} label="Sale Price" value={line.salePrice} onChange={(e) => updateLine(line.productId, "salePrice", e.target.value)} />
              <Input type="number" min={0} label="GST %" value={line.gstRate} onChange={(e) => updateLine(line.productId, "gstRate", e.target.value)} />
              <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Line Total</p>
                <p className="mt-1 font-semibold text-emerald-600">Rs {(Number(line.quantity) * Number(line.salePrice)).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-[var(--border-card)] md:block">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr className="border-b border-[var(--border-card)]">
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Product</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Available</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Qty to Sell</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Sale Price</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">GST %</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-card)]">
            {lines.map((line) => (
              <tr key={line.productId}>
                <td className="px-4 py-3">
                  <p className="font-medium capitalize text-[var(--text-primary)]">{line.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{line.category || "Uncategorized"}{line.sku ? ` • ${line.sku}` : ""}</p>
                </td>
                <td className="px-4 py-3">{line.availableQty}</td>
                <td className="px-4 py-3">
                  <Input type="number" min={0} max={line.availableQty} value={line.quantity} onChange={(e) => updateLine(line.productId, "quantity", e.target.value)} />
                </td>
                <td className="px-4 py-3">
                  <Input type="number" min={0} value={line.salePrice} onChange={(e) => updateLine(line.productId, "salePrice", e.target.value)} />
                </td>
                <td className="px-4 py-3">
                  <Input type="number" min={0} value={line.gstRate} onChange={(e) => updateLine(line.productId, "gstRate", e.target.value)} />
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-600">
                  Rs {(Number(line.quantity) * Number(line.salePrice)).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="flex items-start gap-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] px-3 py-3 text-sm text-[var(--text-primary)]">
          <input type="checkbox" checked={printAfterSave} onChange={(e) => setPrintAfterSave(e.target.checked)} className="mt-1 h-4 w-4 cursor-pointer" />
          <span>Confirm ke baad sale slip print karo</span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] px-3 py-3 text-sm text-[var(--text-primary)]">
          <input type="checkbox" checked={openGstAfterSave} onChange={(e) => setOpenGstAfterSave(e.target.checked)} className="mt-1 h-4 w-4 cursor-pointer" />
          <span>Confirm ke baad GST invoice draft kholo</span>
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/30 dark:bg-emerald-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{validLines.length} valid items selected</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Buyer name aur seller profile name required hai. GST bill aur print dono optional hain.</p>
        </div>
        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">Rs {grandTotal.toLocaleString("en-IN")}</p>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button variant="ghost" title="Cancel" onClick={onClose} className="flex-1" />
        <Button variant="primary" title="Confirm Sale" loading={loading} onClick={handleConfirm} className="flex-1" />
      </div>
    </div>
  )
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1))
}

function printSaleSummary(
  buyer: BuyerForm,
  lines: SaleLine[],
  seller: { name: string; phone?: string }
) {
  const printWindow = window.open("", "_blank", "width=900,height=700")
  if (!printWindow) return

  const activeLines = lines.filter((line) => Number(line.quantity) > 0 && Number(line.salePrice) > 0)
  const grandTotal = activeLines.reduce(
    (sum, line) => sum + Number(line.quantity) * Number(line.salePrice),
    0
  )

  printWindow.document.write(`
    <html>
      <head>
        <title>Sale Slip</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h2 { margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
          th { background: #f3f4f6; }
          .meta { margin-top: 6px; color: #4b5563; font-size: 14px; }
          .total { margin-top: 18px; text-align: right; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <h2>Sale Slip</h2>
        <div class="meta">Date: ${new Date().toLocaleString("en-IN")}</div>
        <div class="meta">Seller: ${seller.name || "-"}</div>
        <div class="meta">Seller Phone: ${seller.phone || "-"}</div>
        <div class="meta">Buyer: ${buyer.name || "-"}</div>
        <div class="meta">Phone: ${buyer.phone || "-"}</div>
        <div class="meta">GSTIN: ${buyer.gstin || "-"}</div>
        <div class="meta">Address: ${[buyer.address, buyer.city, buyer.state, buyer.pincode].filter(Boolean).join(", ") || "-"}</div>
        <table>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>GST %</th>
            <th>Total</th>
          </tr>
          ${activeLines
            .map(
              (line) => `
            <tr>
              <td>${toTitleCase(line.name)}</td>
              <td>${line.quantity}</td>
              <td>Rs ${Number(line.salePrice).toFixed(2)}</td>
              <td>${Number(line.gstRate || 0).toFixed(2)}%</td>
              <td>Rs ${(Number(line.quantity) * Number(line.salePrice)).toFixed(2)}</td>
            </tr>`
            )
            .join("")}
        </table>
        <div class="total">Grand Total: Rs ${grandTotal.toFixed(2)}</div>
        <script>window.print();</script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
