"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { notify as toast } from "@/app/lib/notifications"
import { Product } from "@/app/lib/db"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import CommonTable, { TableItem } from "@/app/components/ui/Table"
import SummaryCard from "@/app/components/ui/SummaryCard"
import { parseSaleLogNote } from "@/app/lib/saleMetadata"
import { createEmptyInvoiceItem } from "@/app/dashboard/gst-invoice/types/gst.types"
import { saveSaleInvoiceDraft } from "@/app/dashboard/gst-invoice/invoiceDraft.service"
import InventoryLogCorrectionModal from "./InventoryLogCorrectionModal"
import { normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import StockHistoryMobileCards from "./StockHistoryMobileCards"
import StockHistoryPagination from "./StockHistoryPagination"
import StockHistorySelectionBar from "./StockHistorySelectionBar"
import type { HistoryRow, HistoryTab, StockHistoryLog } from "./stock-history.types"
import { formatDateInput, formatReason, printRows, toTitleCase } from "./stock-history.utils"
import useProfile from "@/app/dashboard/profile/useProfile"
import { buildBusinessDocumentProfile, type TransactionDocumentData } from "@/app/lib/transactionDocument"
import { en } from "@/app/messages/en"
import useDebouncedValue from "@/app/hooks/useDebouncedValue"

export default function StockHistoryTabs({
  logs,
  products,
  onDataChange,
}: {
  logs: StockHistoryLog[]
  products: Product[]
  onDataChange?: (message?: string) => void
}) {
  const router = useRouter()
  const { profile } = useProfile()
  const [tab, setTab] = useState<HistoryTab>("all")
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 180)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [buyerFilter, setBuyerFilter] = useState("all")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState("")

  const productMap = useMemo(() => {
    const map = new Map<string, Product>()
    products.forEach((product) => map.set(product.id, product))
    return map
  }, [products])

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category?.trim() || en.expiry.categoryUnavailable))).sort(),
    [products]
  )

  const allRows = useMemo<HistoryRow[]>(() => {
    return logs.map((log) => {
      const product = log.productId ? productMap.get(log.productId) : undefined
      const saleMeta = parseSaleLogNote(log.note)

      const quantity = Math.abs(Number(log.quantity ?? log.quantityAdded ?? 0))

      return {
        id: String(log.id),
        productId: log.productId,
        productName: log.productName || product?.name || en.inventory.deletedItem,
        category: log.productCategory || product?.category || en.expiry.categoryUnavailable,
        supplier: product?.supplier || "",
        sku: log.productSku || product?.sku || "",
        hsnCode: log.productHsnCode || product?.hsnCode || "",
        logType: log.quantityAdded > 0 ? "in" : "out",
        reason: log.reason || (log.quantityAdded > 0 ? en.stockHistory.reasonLabels.stockIn : en.stockHistory.reasonLabels.stockOut),
        quantity,
        quantityUnit: normalizeQuantityUnit(log.quantityUnit || product?.quantityUnit),
        oldStock: log.oldStock,
        newStock: log.newStock,
        price: Number(log.price || 0),
        amount: Number(log.amount ?? Number(log.price || 0) * quantity),
        taxableAmount: log.taxableAmount,
        gstRate: log.gstRate,
        cgstAmount: log.cgstAmount,
        sgstAmount: log.sgstAmount,
        igstAmount: log.igstAmount,
        gstAmount: log.gstAmount,
        date: log.date,
        expiry: log.expiry || "",
        buyerName: saleMeta.buyerName || "",
        buyerPhone: saleMeta.buyerPhone || "",
        buyerGstin: saleMeta.buyerGstin || "",
        transactionId: log.transactionId,
        transactionType: log.transactionType,
        invoiceReceiptNo: log.invoiceReceiptNo,
        paymentMode: log.paymentMode,
        paymentStatus: log.paymentStatus,
        products: log.products,
        note: saleMeta.cleanNote || log.notes || "",
        notes: log.notes,
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
      const isOtherOutRow = row.logType === "out" && !isSaleRow
      const matchesTab = tab === "all" ? true : tab === "in" ? row.logType === "in" : tab === "sale" ? isSaleRow : isOtherOutRow

      const matchesSearch =
        !debouncedSearch ||
        getHistorySearchText(row).includes(debouncedSearch.toLowerCase())

      const rowDate = formatDateInput(row.date)
      const matchesFrom = !fromDate || rowDate >= fromDate
      const matchesTo = !toDate || rowDate <= toDate
      const matchesCategory = categoryFilter === "all" || row.category === categoryFilter
      const matchesBuyer = buyerFilter === "all" || row.buyerName === buyerFilter

      return matchesTab && matchesSearch && matchesFrom && matchesTo && matchesCategory && matchesBuyer
    })
  }, [allRows, tab, debouncedSearch, fromDate, toDate, categoryFilter, buyerFilter])

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

  const selectedSaleRows = useMemo(
    () => selectedRows.filter((row) => row.logType === "out" && row.reason.toLowerCase() === "sold"),
    [selectedRows]
  )

  const selectedBuyerCount = useMemo(
    () => new Set(selectedSaleRows.map((row) => `${row.buyerName}|${row.buyerPhone}|${row.buyerGstin}`)).size,
    [selectedSaleRows]
  )

  const canCreateGstBill =
    selectedRows.length > 0 &&
    selectedSaleRows.length === selectedRows.length &&
    selectedBuyerCount === 1 &&
    Boolean(selectedSaleRows[0]?.buyerName)

  const selectedShareDocument = useMemo(
    () => selectedRows.length ? buildStockHistoryDocument(selectedRows, buildBusinessDocumentProfile(profile)) : undefined,
    [selectedRows, profile]
  )

  const selectedActionHint = canCreateGstBill
    ? en.stockHistory.actionMessages.gstReady
    : selectedRows.length === 0
      ? ""
      : selectedSaleRows.length !== selectedRows.length
        ? en.stockHistory.actionMessages.onlySalesForBill
        : selectedBuyerCount > 1
          ? en.stockHistory.actionMessages.singleBuyerForBill
          : !selectedSaleRows[0]?.buyerName
            ? en.stockHistory.actionMessages.buyerRequiredForBill
            : ""

  const tableRows = useMemo<TableItem[]>(
    () =>
      paginatedRows.map((row) => ({
        id: row.id,
        name: `${row.productName}${row.category ? ` (${row.category})` : ""}`,
        supplier:
          row.logType === "in"
            ? row.supplier || formatReason(row.reason)
            : row.buyerName
              ? `${row.buyerName}${row.buyerPhone ? ` - ${row.buyerPhone}` : ""}`
              : formatReason(row.reason),
        expiry: row.expiry || "-",
        price: row.price,
        quantity: row.quantity,
        quantityUnit: row.quantityUnit,
        createdAt: row.date,
        note: [
          row.invoiceReceiptNo ? `${en.receipt.ref}: ${row.invoiceReceiptNo}` : "",
          row.oldStock !== undefined && row.newStock !== undefined ? `${en.stockHistory.labels.stock}: ${row.oldStock} → ${row.newStock}` : "",
          row.gstAmount ? `${en.transaction.totalGst}: ${en.common.rupeeSymbol} ${row.gstAmount.toLocaleString("en-IN")}` : "",
          row.note,
          row.correctedAt ? en.stockHistory.labels.corrected : "",
        ].filter(Boolean).join(" - ") || "-",
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
      otherOut: allRows.filter((row) => row.logType === "out" && row.reason.toLowerCase() !== "sold").length,
    }),
    [allRows]
  )

  const resetPage = () => setPage(1)

  const setDateRange = (from: string, to: string) => {
    setFromDate(from)
    setToDate(to)
    resetPage()
  }

  const setRelativeDateRange = (days: number) => {
    const now = new Date()
    const from = new Date(now)
    from.setDate(now.getDate() - (days - 1))
    setDateRange(from.toISOString().slice(0, 10), now.toISOString().slice(0, 10))
  }

  const clearFilters = () => {
    setTab("all")
    setSearch("")
    setFromDate("")
    setToDate("")
    setCategoryFilter("all")
    setBuyerFilter("all")
    setSelectedIds(new Set())
    setPage(1)
  }

  const toggleSelection = (id: string) => {
    setActionMessage("")
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectPage = () => {
    setActionMessage("")
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
    if (!selectedRows.length) {
      setActionMessage(en.stockHistory.actionMessages.selectEntriesToPrint)
      return
    }
    setActionMessage("")
    const printed = printRows(selectedRows, buildBusinessDocumentProfile(profile))
    if (printed) {
      toast.success(en.stockHistory.actionMessages.printStarted)
    } else {
      setActionMessage(en.stockHistory.actionMessages.printFailed)
      toast.error(en.stockHistory.actionMessages.printFailed)
    }
  }

  const handleCreateGstBill = () => {
    if (!selectedRows.length) {
      setActionMessage(en.stockHistory.actionMessages.selectSalesForBill)
      return
    }

    const saleRows = selectedRows.filter(
      (row) => row.logType === "out" && row.reason.toLowerCase() === "sold"
    )

    if (saleRows.length !== selectedRows.length) {
      setActionMessage(en.stockHistory.actionMessages.onlySalesForBill)
      return
    }

    const buyerKeySet = new Set(
      saleRows.map((row) => `${row.buyerName}|${row.buyerPhone}|${row.buyerGstin}`)
    )

    if (buyerKeySet.size !== 1) {
      setActionMessage(en.stockHistory.actionMessages.singleBuyerForBill)
      return
    }

    if (!saleRows[0]?.buyerName) {
      setActionMessage(en.stockHistory.actionMessages.buyerRequiredForBill)
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
        item.name = toTitleCase(row.productName)
        item.description = toTitleCase(row.productName)
        item.hsnCode = row.hsnCode
        item.quantity = row.quantity
        item.rate = row.price
        item.gstRate = 18
        item.unit = row.quantityUnit
        return item
      }),
      notes: saleRows.map((row) => row.note).filter(Boolean).join(", ") || undefined,
      createdAt: new Date().toISOString(),
    })

    toast.success(en.stockHistory.actionMessages.gstDraftReady)
    router.push("/dashboard/gst-invoice")
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label={en.stockHistory.totalEntries} value={String(summary.total)} />
        <SummaryCard label={en.stockHistory.stockIn} value={String(summary.stockIn)} tone="emerald" />
        <SummaryCard label={en.stockHistory.sales} value={String(summary.saleOut)} tone="rose" />
      </div>

      <div className="space-y-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 shadow-[var(--shadow-card)]">
        <div className="filter-scroll">
          <Button title={`${en.suppliers.all} (${summary.total})`} variant={tab === "all" ? "success" : "outline"} onClick={() => { setTab("all"); resetPage() }} />
          <Button title={`${en.stockHistory.stockIn} (${summary.stockIn})`} variant={tab === "in" ? "success" : "outline"} onClick={() => { setTab("in"); resetPage() }} />
          <Button title={`${en.stockHistory.sales} (${summary.saleOut})`} variant={tab === "sale" ? "success" : "outline"} onClick={() => { setTab("sale"); resetPage() }} />
          <Button title={`${en.stockHistory.otherOut} (${summary.otherOut})`} variant={tab === "out" ? "success" : "outline"} onClick={() => { setTab("out"); resetPage() }} />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">{en.stockHistory.search}</label>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
            <Input
              type="text"
              placeholder={en.stockHistory.searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                resetPage()
              }}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Button title={en.stockHistory.today} variant="outline" onClick={() => setRelativeDateRange(1)} />
            <Button title={en.stockHistory.days7} variant="outline" onClick={() => setRelativeDateRange(7)} />
            <Button title={en.stockHistory.days30} variant="outline" onClick={() => setRelativeDateRange(30)} />
            <Button title={en.stockHistory.clear} variant="ghost" onClick={clearFilters} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] px-3 py-2 text-xs text-[var(--text-secondary)]">
          <span>{filteredRows.length} {en.stockHistory.entriesVisible}</span>
          <Button
            title={showAdvancedFilters ? en.stockHistory.hideFilters : en.stockHistory.moreFilters}
            variant="outline"
            onClick={() => setShowAdvancedFilters((value) => !value)}
          />
        </div>

        {showAdvancedFilters && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

          <Input type="date" label={en.stockHistory.from} value={fromDate} onChange={(e) => { setFromDate(e.target.value); resetPage() }} />
          <Input type="date" label={en.stockHistory.to} value={toDate} onChange={(e) => { setToDate(e.target.value); resetPage() }} />

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">{en.stockHistory.category}</label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); resetPage() }}
              className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)]"
            >
              <option value="all">{en.stockHistory.allCategories}</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">{en.stockHistory.buyer}</label>
            <select
              value={buyerFilter}
              onChange={(e) => { setBuyerFilter(e.target.value); resetPage() }}
              className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)]"
            >
              <option value="all">{en.stockHistory.allBuyers}</option>
              {buyers.map((buyer) => (
                <option key={buyer} value={buyer}>{buyer}</option>
              ))}
            </select>
          </div>
        </div>
        )}
      </div>

      <div className="space-y-3 md:hidden">
        <StockHistoryMobileCards
          rows={paginatedRows}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onEdit={setEditingRowId}
        />
      </div>

      <div className="hidden md:block">
        <CommonTable
          data={tableRows}
          showSelection
          selectedIds={visibleSelectedIds}
          onToggleSelect={(id) => toggleSelection(String(id))}
          onSelectAll={toggleSelectPage}
          showActions
          actionLabel={en.stockHistory.edit}
          minWidth={980}
          onEdit={(item) => item.id && setEditingRowId(String(item.id))}
        />
      </div>
      <StockHistoryPagination
        pageSize={pageSize}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        onPageChange={setPage}
      />

      <StockHistorySelectionBar
        selectedCount={selectedRows.length}
        selectedActionHint={selectedActionHint}
        actionMessage={actionMessage}
        canCreateGstBill={canCreateGstBill}
        onPrint={handlePrintSelected}
        onCreateGstBill={handleCreateGstBill}
        onClearSelection={() => {
          setSelectedIds(new Set())
          setActionMessage("")
        }}
        shareDocument={selectedShareDocument}
      />

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

function getHistorySearchText(row: HistoryRow) {
  return [
    row.productName,
    row.category,
    row.supplier,
    row.sku,
    row.hsnCode,
    row.buyerName,
    row.buyerPhone,
    row.buyerGstin,
    row.reason,
    row.transactionId,
    row.invoiceReceiptNo,
    row.paymentMode,
    row.paymentStatus,
    row.note,
    row.notes,
  ].filter(Boolean).join(" ").toLowerCase()
}


function buildStockHistoryDocument(
  rows: HistoryRow[],
  seller: ReturnType<typeof buildBusinessDocumentProfile>
): TransactionDocumentData {
  const total = rows.reduce((sum, row) => sum + Number(row.amount || row.price * row.quantity || 0), 0)
  return {
    type: "stock-adjustment",
    title: en.receipt.selectedStockHistory,
    reference: `HIST-${Date.now()}`,
    date: new Date().toLocaleString("en-IN"),
    seller,
    partyLabel: en.stockHistory.selectedEntries,
    party: { name: `${rows.length} ${en.stockHistory.selectedEntries}` },
    items: rows.map((row) => ({
      name: row.productName,
      description: [
        row.category,
        row.invoiceReceiptNo ? `${en.receipt.ref}: ${row.invoiceReceiptNo}` : "",
        row.oldStock !== undefined ? `${en.share.oldStock}: ${row.oldStock}` : "",
        row.newStock !== undefined ? `${en.share.newStock}: ${row.newStock}` : "",
        row.reason,
      ].filter(Boolean).join(" | "),
      hsnCode: row.hsnCode,
      quantity: row.quantity,
      unit: row.quantityUnit,
      rate: row.price,
      gstRate: row.gstRate,
      taxableAmount: row.taxableAmount,
      cgstAmount: row.cgstAmount,
      sgstAmount: row.sgstAmount,
      igstAmount: row.igstAmount,
      total: Number(row.amount || row.price * row.quantity || 0),
      note: row.note,
    })),
    totals: {
      grandTotal: total,
      totalGst: rows.reduce((sum, row) => sum + Number(row.gstAmount || 0), 0),
    },
    notes: rows.map((row) => row.note).filter(Boolean).join(", "),
  }
}
