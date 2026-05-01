"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MdPrint } from "react-icons/md"
import { Pencil, Search } from "lucide-react"
import { Product } from "@/app/lib/db"
import Button from "@/app/components/utility/Button"
import Input from "@/app/components/utility/CommonInput"
import CommonTable, { TableItem } from "@/app/components/utility/CommonTable"
import { parseSaleLogNote } from "@/app/lib/saleMetadata"
import { createEmptyInvoiceItem } from "@/app/dashboard/gst-invoice/types/gst.types"
import { saveSaleInvoiceDraft } from "@/app/dashboard/gst-invoice/invoiceDraft.service"
import InventoryLogCorrectionModal from "./InventoryLogCorrectionModal"
import { formatQuantity, normalizeQuantityUnit } from "@/app/lib/quantityUnit"

type Log = {
  id: string
  date: string
  quantityAdded: number
  quantityUnit?: string
  type?: "in" | "out"
  reason?: string
  price: number
  expiry?: string
  note?: string
  productId?: string
  correctedAt?: string
  correctionLabel?: string
}

type HistoryRow = {
  id: string
  productId?: string
  productName: string
  category: string
  supplier: string
  sku: string
  logType: "in" | "out"
  reason: string
  quantity: number
  quantityUnit: string
  price: number
  date: string
  expiry: string
  buyerName: string
  buyerPhone: string
  buyerGstin: string
  note: string
  correctedAt?: string
  correctionLabel?: string
}

const pageSizes = [5, 10, 20, 50]

function formatDateTime(iso: string) {
  if (!iso) return "-"
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDateInput(value: string) {
  if (!value) return ""
  return new Date(value).toISOString().slice(0, 10)
}

export default function StockHistoryTabs({
  logs,
  products,
  onDataChange,
}: {
  logs: Log[]
  products: Product[]
  onDataChange?: (message?: string) => void
}) {
  const router = useRouter()
  const [tab, setTab] = useState<"all" | "in" | "sale">("all")
  const [search, setSearch] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [buyerFilter, setBuyerFilter] = useState("all")
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingRowId, setEditingRowId] = useState<string | null>(null)

  const productMap = useMemo(() => {
    const map = new Map<string, Product>()
    products.forEach((product) => map.set(product.id, product))
    return map
  }, [products])

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category?.trim() || "Uncategorized"))).sort(),
    [products]
  )

  const allRows = useMemo<HistoryRow[]>(() => {
    return logs.map((log) => {
      const product = log.productId ? productMap.get(log.productId) : undefined
      const saleMeta = parseSaleLogNote(log.note)

      return {
        id: String(log.id),
        productId: log.productId,
        productName: product?.name || "Deleted product",
        category: product?.category || "Uncategorized",
        supplier: product?.supplier || "",
        sku: product?.sku || "",
        logType: log.quantityAdded > 0 ? "in" : "out",
        reason: log.reason || (log.quantityAdded > 0 ? "Stock In" : "Stock Out"),
        quantity: Math.abs(log.quantityAdded),
        quantityUnit: normalizeQuantityUnit(log.quantityUnit || product?.quantityUnit),
        price: Number(log.price || 0),
        date: log.date,
        expiry: log.expiry || "",
        buyerName: saleMeta.buyerName || "",
        buyerPhone: saleMeta.buyerPhone || "",
        buyerGstin: saleMeta.buyerGstin || "",
        note: saleMeta.cleanNote || "",
        correctedAt: log.correctedAt,
        correctionLabel: log.correctionLabel,
      }
    })
  }, [logs, productMap])

  const buyers = useMemo(
    () => Array.from(new Set(allRows.map((row) => row.buyerName).filter(Boolean))).sort(),
    [allRows]
  )

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      const isSaleRow = row.logType === "out" && row.reason.toLowerCase() === "sold"
      const matchesTab = tab === "all" ? true : tab === "in" ? row.logType === "in" : isSaleRow

      const matchesSearch =
        !search ||
        row.productName.toLowerCase().includes(search.toLowerCase()) ||
        row.sku.toLowerCase().includes(search.toLowerCase()) ||
        row.buyerName.toLowerCase().includes(search.toLowerCase()) ||
        row.reason.toLowerCase().includes(search.toLowerCase())

      const rowDate = formatDateInput(row.date)
      const matchesFrom = !fromDate || rowDate >= fromDate
      const matchesTo = !toDate || rowDate <= toDate
      const matchesCategory = categoryFilter === "all" || row.category === categoryFilter
      const matchesBuyer = buyerFilter === "all" || row.buyerName === buyerFilter

      return matchesTab && matchesSearch && matchesFrom && matchesTo && matchesCategory && matchesBuyer
    })
  }, [allRows, tab, search, fromDate, toDate, categoryFilter, buyerFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, currentPage, pageSize])

  const selectedRows = useMemo(
    () => filteredRows.filter((row) => selectedIds.has(row.id)),
    [filteredRows, selectedIds]
  )

  const tableRows = useMemo<TableItem[]>(
    () =>
      paginatedRows.map((row) => ({
        id: row.id,
        name: row.productName,
        category: row.logType === "in" ? "in" : "out",
        supplier:
          row.logType === "in"
            ? row.supplier || row.reason
            : row.buyerName
              ? `${row.buyerName}${row.buyerPhone ? ` • ${row.buyerPhone}` : ""}`
              : row.reason,
        expiry: row.expiry || "-",
        price: row.price,
        quantity: row.quantity,
        quantityUnit: row.quantityUnit,
        createdAt: row.date,
        note: [row.note, row.correctedAt ? "Corrected" : ""].filter(Boolean).join(" • ") || "-",
      })),
    [paginatedRows]
  )

  const visibleSelectedIds = useMemo<Set<string | number>>(
    () => new Set(tableRows.map((row) => row.id).filter((id): id is string | number => Boolean(id) && selectedIds.has(String(id)))),
    [selectedIds, tableRows]
  )

  const editingRow = useMemo(
    () => allRows.find((row) => row.id === editingRowId) || null,
    [allRows, editingRowId]
  )

  const summary = useMemo(
    () => ({
      total: allRows.length,
      stockIn: allRows.filter((row) => row.logType === "in").length,
      saleOut: allRows.filter((row) => row.logType === "out" && row.reason.toLowerCase() === "sold").length,
    }),
    [allRows]
  )

  const resetPage = () => setPage(1)

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectPage = () => {
    const pageIds = paginatedRows.map((row) => row.id)
    const areAllSelected = pageIds.every((id) => selectedIds.has(id))

    setSelectedIds((current) => {
      const next = new Set(current)
      if (areAllSelected) {
        pageIds.forEach((id) => next.delete(id))
      } else {
        pageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const handlePrintSelected = () => {
    if (!selectedRows.length) return
    printRows(selectedRows)
  }

  const handleCreateGstBill = () => {
    if (!selectedRows.length) return

    const saleRows = selectedRows.filter(
      (row) => row.logType === "out" && row.reason.toLowerCase() === "sold"
    )

    if (saleRows.length !== selectedRows.length) {
      alert("GST bill sirf sale out rows ke liye banega. Please only sold items select karo.")
      return
    }

    const buyerKeySet = new Set(
      saleRows.map((row) => `${row.buyerName}|${row.buyerPhone}|${row.buyerGstin}`)
    )

    if (buyerKeySet.size !== 1) {
      alert("GST bill banane ke liye selected rows same buyer ki honi chahiye.")
      return
    }

    const firstBuyer = saleRows[0]

    saveSaleInvoiceDraft({
      buyer: {
        name: firstBuyer.buyerName,
        gstin: firstBuyer.buyerGstin,
        phone: firstBuyer.buyerPhone,
      },
      items: saleRows.map((row) => {
        const item = createEmptyInvoiceItem()
        item.description = toTitleCase(row.productName)
        item.hsnCode = row.sku
        item.quantity = row.quantity
        item.rate = row.price
        item.gstRate = 18
        item.unit = row.quantityUnit
        return item
      }),
      notes: saleRows.map((row) => row.note).filter(Boolean).join(", ") || undefined,
      createdAt: new Date().toISOString(),
    })

    router.push("/dashboard/gst-invoice")
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Total Entries" value={summary.total} />
        <SummaryCard label="Stock In" value={summary.stockIn} tone="emerald" />
        <div className="min-[420px]:col-span-2 xl:col-span-1">
          <SummaryCard label="Sale Out" value={summary.saleOut} tone="rose" />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 shadow-[var(--shadow-card)]">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button title={`All (${summary.total})`} variant={tab === "all" ? "success" : "outline"} onClick={() => { setTab("all"); resetPage() }} />
          <Button title={`Stock In (${summary.stockIn})`} variant={tab === "in" ? "success" : "outline"} onClick={() => { setTab("in"); resetPage() }} />
          <Button title={`Sale Out (${summary.saleOut})`} variant={tab === "sale" ? "success" : "outline"} onClick={() => { setTab("sale"); resetPage() }} />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative md:col-span-2 xl:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Search</label>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
            <Input
              type="text"
              placeholder="Product, SKU, buyer ya reason search karo"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                resetPage()
              }}
              className="pl-9"
            />
          </div>

          <Input type="date" label="From" value={fromDate} onChange={(e) => { setFromDate(e.target.value); resetPage() }} />
          <Input type="date" label="To" value={toDate} onChange={(e) => { setToDate(e.target.value); resetPage() }} />

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); resetPage() }}
              className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)]"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Buyer</label>
            <select
              value={buyerFilter}
              onChange={(e) => { setBuyerFilter(e.target.value); resetPage() }}
              className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)]"
            >
              <option value="all">All Buyers</option>
              {buyers.map((buyer) => (
                <option key={buyer} value={buyer}>{buyer}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {paginatedRows.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl px-4 py-10 text-center text-[var(--text-muted)] shadow-[var(--shadow-card)]">
            Is filter combination me koi history row nahi mili.
          </div>
        ) : (
          paginatedRows.map((row) => (
            <div
              key={row.id}
              className={`rounded-2xl border p-4 shadow-[var(--shadow-card)] ${
                selectedIds.has(row.id)
                  ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                  : "border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.id)}
                  onChange={() => toggleSelection(row.id)}
                  className="mt-1 h-4 w-4 cursor-pointer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium capitalize text-[var(--text-primary)]">{row.productName}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{formatDateTime(row.date)}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.logType === "in" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"}`}>
                      {row.logType === "in" ? "Stock In" : row.reason.toLowerCase() === "sold" ? "Sale Out" : "Stock Out"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="rounded-lg border border-[var(--border-card)] px-2 py-1">Category: {row.category}</span>
                    <span className="rounded-lg border border-[var(--border-card)] px-2 py-1">Qty: {formatQuantity(row.quantity, row.quantityUnit)}</span>
                    <span className="rounded-lg border border-[var(--border-card)] px-2 py-1">Price: Rs {row.price.toLocaleString("en-IN")}</span>
                    <span className="rounded-lg border border-[var(--border-card)] px-2 py-1">SKU: {row.sku || "-"}</span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
                    <p>
                      <span className="font-medium text-[var(--text-primary)]">
                        {row.logType === "in" ? "Supplier/Reason:" : "Buyer/Reason:"}
                      </span>{" "}
                      {row.logType === "in"
                        ? row.supplier || row.reason
                        : row.buyerName
                          ? `${row.buyerName}${row.buyerPhone ? ` • ${row.buyerPhone}` : ""}`
                          : row.reason}
                    </p>
                    {row.note ? <p><span className="font-medium text-[var(--text-primary)]">Note:</span> {row.note}</p> : null}
                  </div>

                  {row.correctedAt && (
                    <div className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
                      Corrected on {formatDateTime(row.correctedAt)}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      title="Correct Entry"
                      variant="outline"
                      icon={<Pencil size={15} />}
                      onClick={() => setEditingRowId(row.id)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block">
        <CommonTable
          data={tableRows}
          showSelection
          selectedIds={visibleSelectedIds}
          onToggleSelect={(id) => toggleSelection(String(id))}
          onSelectAll={toggleSelectPage}
          showActions
          actionLabel="Correct"
          minWidth={980}
          onEdit={(item) => item.id && setEditingRowId(String(item.id))}
        />
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr className="border-b border-[var(--border-card)]">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paginatedRows.length > 0 && paginatedRows.every((row) => selectedIds.has(row.id))}
                    onChange={toggleSelectPage}
                    className="h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Date</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Product</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Category</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Type</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Buyer / Reason</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Qty</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Price</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">SKU</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Note</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-card)]">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-[var(--text-muted)]">
                    Is filter combination me koi history row nahi mili.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id} className={selectedIds.has(row.id) ? "bg-emerald-50/40 dark:bg-emerald/[0.04]" : "hover:bg-emerald-50/30 dark:hover:bg-emerald/[0.03]"}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelection(row.id)}
                        className="h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{formatDateTime(row.date)}</td>
                    <td className="px-4 py-3 font-medium capitalize text-[var(--text-primary)]">{row.productName}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{row.category}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.logType === "in" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"}`}>
                        {row.logType === "in" ? "Stock In" : row.reason.toLowerCase() === "sold" ? "Sale Out" : "Stock Out"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {row.buyerName ? `${row.buyerName}${row.buyerPhone ? ` • ${row.buyerPhone}` : ""}` : row.reason}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{formatQuantity(row.quantity, row.quantityUnit)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">Rs {row.price.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{row.sku || "-"}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      <div className="space-y-2">
                        <p>{row.note || "-"}</p>
                        {row.correctedAt && (
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
                            Corrected
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        title="Correct"
                        variant="outline"
                        icon={<Pencil size={15} />}
                        onClick={() => setEditingRowId(row.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 shadow-[var(--shadow-card)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-[var(--text-secondary)]">Rows per page</span>
          {pageSizes.map((size) => (
            <Button
              key={size}
              title={String(size)}
              variant={pageSize === size ? "success" : "outline"}
              onClick={() => {
                setPageSize(size)
                setPage(1)
              }}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button title="Prev" variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1} />
          <span className="text-sm text-[var(--text-secondary)]">Page {currentPage} of {totalPages}</span>
          <Button title="Next" variant="outline" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages} />
        </div>
      </div>

      {selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 shadow-[var(--shadow-card)]">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{selectedRows.length} row selected</p>
            <p className="text-xs text-[var(--text-secondary)]">
              Mixed category sale rows bhi select kar sakte ho. GST bill ke liye same buyer hona zaroori hai.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<MdPrint />} title="Print Selected" onClick={handlePrintSelected} />
            <Button variant="primary" title="Create GST Bill" onClick={handleCreateGstBill} />
            <Button variant="outline" title="Clear Selection" onClick={() => setSelectedIds(new Set())} />
          </div>
        </div>
      )}

      <InventoryLogCorrectionModal
        open={Boolean(editingRow)}
        row={editingRow}
        onClose={() => setEditingRowId(null)}
        onSaved={(message) => {
          setEditingRowId(null)
          onDataChange?.(message)
        }}
      />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number
  tone?: "default" | "emerald" | "rose"
}) {
  const valueClass =
    tone === "emerald" ? "text-emerald-600" : tone === "rose" ? "text-rose-600" : "text-[var(--text-primary)]"

  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

function printRows(rows: HistoryRow[]) {
  const printWindow = window.open("", "_blank", "width=900,height=700")
  if (!printWindow) return

  const total = rows.reduce((sum, row) => sum + row.price * row.quantity, 0)
  const uniqueBuyers = Array.from(new Set(rows.map((row) => row.buyerName).filter(Boolean)))

  printWindow.document.write(`
    <html>
      <head>
        <title>Sale History Print</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
          th { background: #f3f4f6; }
          .meta { margin-top: 6px; color: #4b5563; font-size: 14px; }
          .total { margin-top: 18px; text-align: right; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <h2>Selected Stock History</h2>
        <div class="meta">Printed on: ${new Date().toLocaleString("en-IN")}</div>
        <div class="meta">Buyer: ${uniqueBuyers.length === 1 ? uniqueBuyers[0] : uniqueBuyers.length ? "Multiple Buyers" : "N/A"}</div>
        <table>
          <tr>
            <th>Date</th>
            <th>Product</th>
            <th>Category</th>
            <th>Buyer / Reason</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
          ${rows
            .map(
              (row) => `
            <tr>
              <td>${formatDateTime(row.date)}</td>
              <td>${toTitleCase(row.productName)}</td>
              <td>${row.category}</td>
              <td>${row.buyerName || row.reason}</td>
              <td>${formatQuantity(row.quantity, row.quantityUnit)}</td>
              <td>Rs ${row.price.toFixed(2)}</td>
              <td>Rs ${(row.price * row.quantity).toFixed(2)}</td>
            </tr>`
            )
            .join("")}
        </table>
        <div class="total">Grand Total: Rs ${total.toFixed(2)}</div>
        <script>window.print();</script>
      </body>
    </html>
  `)

  printWindow.document.close()
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1))
}
