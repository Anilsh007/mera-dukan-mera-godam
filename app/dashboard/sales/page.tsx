"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, FilePlus2, Filter, FileText, Search, Users } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import PageHeader from "@/app/components/ui/PageHeader"
import PageActionLinks from "@/app/components/ui/PageActionLinks"
import ShareActions from "@/app/components/ui/ShareActions"
import ResponsiveDataTable from "@/app/components/ui/ResponsiveDataTable"
import PaymentStatusBadge from "@/app/components/ui/PaymentStatusBadge"
import BaseSelectField from "@/app/components/ui/SelectField"
import useSales from "@/app/hooks/useSales"
import { usePagination } from "@/app/hooks/usePagination"
import useProfile from "@/app/dashboard/profile/useProfile"
import { buildBusinessDocumentProfile } from "@/app/lib/transactionDocument"
import { buildSaleInvoiceDraftFromRecord, buildSaleTransactionDocument } from "@/app/lib/sales/sale.documents"
import { cancelSale } from "@/app/lib/sales/sale.service"
import { saveSaleInvoiceDraft } from "@/app/dashboard/gst-invoice/invoiceDraft.service"
import { notify as toast } from "@/app/lib/notifications"
import { auth } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { formatCurrency, formatIndianDateTime } from "@/app/lib/formatters"
import { en } from "@/app/messages/en"
import { DASHBOARD_ROUTES } from "@/app/lib/navigation/dashboardRoutes"
import { matchesSearchQuery } from "@/app/lib/search.utils"
import type { SalePaymentStatus, SaleRecord } from "@/app/lib/db"

const PAGE_SIZES = [5, 10, 20, 50]

export default function SalesPage() {
  const router = useRouter()
  const { sales, loading } = useSales()
  const { profile } = useProfile()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | SalePaymentStatus>("all")
  const [modeFilter, setModeFilter] = useState<"all" | SaleRecord["paymentMode"]>("all")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "month">("all")
  const [customerFilter, setCustomerFilter] = useState("all")
  const [cancelTarget, setCancelTarget] = useState<SaleRecord | null>(null)
  const [cancelNote, setCancelNote] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const sellerProfile = buildBusinessDocumentProfile(profile)

  const customers = useMemo(
    () =>
      Array.from(
        new Set(
          sales
            .map((sale) => sale.customer?.name?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [sales],
  )

  const filteredSales = useMemo(() => {
    const now = new Date()
    const todayKey = now.toISOString().slice(0, 10)
    const monthKey = todayKey.slice(0, 7)

    return sales.filter((sale) => {
      const matchesSearch = matchesSearchQuery([
        sale.receiptNo,
        sale.customer?.name,
        sale.note,
        sale.reference,
        sale.items.map((item) => `${item.name} ${item.sku || ""}`),
      ], search)

      const matchesStatus = statusFilter === "all" || sale.paymentStatus === statusFilter
      const matchesMode = modeFilter === "all" || sale.paymentMode === modeFilter
      const matchesCustomer =
        customerFilter === "all" || (sale.customer?.name || "") === customerFilter
      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "today" ? sale.saleDate === todayKey : sale.saleDate.startsWith(monthKey))

      return matchesSearch && matchesStatus && matchesMode && matchesCustomer && matchesDate
    })
  }, [customerFilter, dateFilter, modeFilter, sales, search, statusFilter])

  const {
    pageSize,
    setPageSize,
    currentPage,
    totalPages,
    paginatedItems: paginatedSales,
    canGoPrevious,
    canGoNext,
    goPrevious,
    goNext,
    resetPage,
  } = usePagination(filteredSales, 10)

  const handleCreateDraft = (sale: SaleRecord) => {
    try {
      saveSaleInvoiceDraft(buildSaleInvoiceDraftFromRecord(sale))
      toast.success(en.sales.gstDraftReady)
      router.push(DASHBOARD_ROUTES.gstInvoice)
    } catch (error) {
      console.error("GST draft create failed", error)
      toast.error(en.sales.gstDraftFailed)
    }
  }

  const handleCancelSale = async () => {
    if (!cancelTarget) return

    try {
      setCancelling(true)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      await cancelSale({
        saleId: cancelTarget.id,
        userId,
        note: cancelNote,
      })
      toast.success(en.sales.cancelSaleSuccess)
      setCancelTarget(null)
      setCancelNote("")
    } catch (error) {
      console.error("Sale cancel failed", error)
      toast.error(error instanceof Error ? error.message : en.sales.cancelSaleFailed)
    } finally {
      setCancelling(false)
    }
  }

  const paymentModes = useMemo(
    () => Array.from(new Set(sales.map((sale) => sale.paymentMode))),
    [sales],
  )

  return (
    <div className="dashboard-page space-y-6 pb-8">
      <PageHeader
        eyebrow={en.navigation.sales}
        title={en.pages.salesTitle}
        description={en.pages.salesDescription}
        actions={
          <Button
            type="button"
            variant="primary"
            title={en.sales.createNewSale}
            icon={<FilePlus2 size={16} />}
            onClick={() => router.push(DASHBOARD_ROUTES.quickSale)}
            className="w-full sm:w-auto"
          />
        }
      />

      <PageActionLinks
        title={en.common.nextActions}
        description={en.common.nextActionsDescription}
        actions={[
          { href: DASHBOARD_ROUTES.quickSale, label: en.sales.createNewSale, description: en.pages.quickSaleDescription, icon: <FilePlus2 size={18} /> },
          { href: DASHBOARD_ROUTES.gstInvoice, label: en.sales.makeGstInvoice, description: en.sales.makeGstInvoiceHelp, icon: <FileText size={18} /> },
          { href: DASHBOARD_ROUTES.parties, label: en.sales.goToCustomers, description: en.sales.goToCustomersHelp, icon: <Users size={18} /> },
          { href: DASHBOARD_ROUTES.reports, label: en.sales.goToReports, description: en.sales.goToReportsHelp, icon: <BarChart3 size={18} /> },
        ]}
      />

      <section className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">{en.sales.searchPlaceholder}</label>
            <Search size={16} className="pointer-events-none absolute left-3 top-[42px] text-[var(--text-muted)]" />
            <Input value={search} onChange={(event) => { setSearch(event.target.value); resetPage() }} className="pl-9" />
          </div>

          <SelectField
            label={en.sales.paymentStatus}
            value={statusFilter}
            onChange={(value) => { setStatusFilter(value as typeof statusFilter); resetPage() }}
            options={[
              { value: "all", label: en.sales.allStatuses },
              { value: "paid", label: en.sales.paid },
              { value: "partial", label: en.sales.partial },
              { value: "unpaid", label: en.sales.unpaid },
            ]}
          />
          <SelectField
            label={en.sales.paymentMode}
            value={modeFilter}
            onChange={(value) => { setModeFilter(value as typeof modeFilter); resetPage() }}
            options={[
              { value: "all", label: en.sales.allModes },
              ...paymentModes.map((mode) => ({ value: mode, label: mode })),
            ]}
          />
          <SelectField
            label={en.sales.customerWise}
            value={customerFilter}
            onChange={(value) => { setCustomerFilter(value); resetPage() }}
            options={[
              { value: "all", label: en.sales.allCustomers },
              ...customers.map((customer) => ({ value: customer, label: customer })),
            ]}
          />
          <SelectField
            label={en.sales.filtersTitle}
            value={dateFilter}
            onChange={(value) => { setDateFilter(value as typeof dateFilter); resetPage() }}
            options={[
              { value: "all", label: en.sales.clearFilters },
              { value: "today", label: en.sales.today },
              { value: "month", label: en.sales.thisMonth },
            ]}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:hidden">
        {paginatedSales.map((sale) => (
          <article key={sale.id} className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{en.sales.receiptNo}</p>
                <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">{sale.receiptNo}</p>
              </div>
              <PaymentStatusBadge status={sale.paymentStatus} cancelled={sale.status === "cancelled"} />
            </div>
            <div className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
              <p>{en.sales.customerName}: {sale.customer?.name || en.common.notAvailable}</p>
              <p>{en.sales.saleDate}: {formatDateTime(sale.saleDateTime)}</p>
              <p>{en.sales.itemsSummary}: {buildItemsSummary(sale)}</p>
              <p>{en.sales.totalAmount}: {formatCurrency(sale.totalAmount)}</p>
              <p>{en.sales.dueAmount}: {formatCurrency(sale.dueAmount)}</p>
            </div>
            <div className="mt-4">
              <ShareActions document={buildSaleTransactionDocument(sale, sellerProfile)} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" title={en.sales.createFromThisSale} onClick={() => handleCreateDraft(sale)} />
              <Button
                type="button"
                variant="danger"
                title={en.sales.cancelSale}
                onClick={() => setCancelTarget(sale)}
                disabled={sale.status === "cancelled"}
              />
            </div>
          </article>
        ))}
      </section>

      <section className="hidden overflow-hidden rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-4 shadow-[var(--shadow-card)] backdrop-blur-xl md:block">
        <ResponsiveDataTable
          rows={paginatedSales}
          getRowKey={(sale) => sale.id}
          minWidth={1120}
          columns={[
            { key: "receipt", header: en.sales.receiptNo, render: (sale) => <span className="font-semibold text-[var(--text-primary)]">{sale.receiptNo}</span> },
            { key: "date", header: en.sales.saleDate, render: (sale) => formatDateTime(sale.saleDateTime), className: "text-[var(--text-secondary)]" },
            { key: "customer", header: en.sales.customerName, render: (sale) => sale.customer?.name || en.common.notAvailable, className: "text-[var(--text-secondary)]" },
            { key: "items", header: en.sales.itemsSummary, render: buildItemsSummary, className: "text-[var(--text-secondary)]" },
            { key: "total", header: en.sales.totalAmount, align: "right", render: (sale) => formatCurrency(sale.totalAmount), className: "font-semibold text-[var(--text-primary)]" },
            { key: "paid", header: en.sales.amountPaid, align: "right", render: (sale) => formatCurrency(sale.amountPaid), className: "text-[var(--text-secondary)]" },
            { key: "due", header: en.sales.dueAmount, align: "right", render: (sale) => formatCurrency(sale.dueAmount), className: "text-[var(--text-secondary)]" },
            { key: "status", header: en.sales.paymentStatus, render: (sale) => <PaymentStatusBadge status={sale.paymentStatus} cancelled={sale.status === "cancelled"} /> },
            { key: "mode", header: en.sales.paymentMode, render: (sale) => sale.paymentMode, className: "text-[var(--text-secondary)]" },
            {
              key: "actions",
              header: en.common.profile,
              render: (sale) => (
                <div className="flex flex-col gap-2">
                  <ShareActions document={buildSaleTransactionDocument(sale, sellerProfile)} />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" title={en.sales.createFromThisSale} onClick={() => handleCreateDraft(sale)} />
                    <Button type="button" variant="danger" title={en.sales.cancelSale} onClick={() => setCancelTarget(sale)} disabled={sale.status === "cancelled"} />
                  </div>
                </div>
              ),
            },
          ]}
        />
      </section>

      {!loading && !filteredSales.length ? (
        <div className="rounded-[28px] border border-dashed border-[var(--border-card)] p-6 text-center text-[var(--text-secondary)]">
          <p className="text-lg font-semibold text-[var(--text-primary)]">{en.sales.noSalesTitle}</p>
          <p className="mt-2">{en.sales.noSalesDescription}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--text-secondary)]">{filteredSales.length} {en.sales.pageSummary}</p>
        <div className="flex flex-wrap gap-2">
          <SelectField
            label=""
            value={String(pageSize)}
            onChange={(value) => { setPageSize(Number(value)); resetPage() }}
            options={PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))}
            hideLabel
          />
          <Button type="button" variant="outline" title={en.sales.previousPage} onClick={goPrevious} disabled={!canGoPrevious} />
          <div className="flex items-center rounded-2xl border border-[var(--border-card)] px-4 text-sm text-[var(--text-secondary)]">
            {currentPage} / {totalPages}
          </div>
          <Button type="button" variant="outline" title={en.sales.nextPage} onClick={goNext} disabled={!canGoNext} />
        </div>
      </div>

      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => {
          if (cancelling) return
          setCancelTarget(null)
          setCancelNote("")
        }}
        title={en.sales.cancelSaleConfirmTitle}
        description={en.sales.cancelSaleConfirmDescription}
        primaryLabel={en.sales.cancelSale}
        primaryVariant="danger"
        cancelLabel={en.common.keepEditing}
        variant="warning"
        onPrimary={handleCancelSale}
        loading={cancelling}
      >
        <Input
          label={en.sales.cancelSaleNote}
          value={cancelNote}
          placeholder={en.sales.cancelSaleNotePlaceholder}
          onChange={(event) => setCancelNote(event.target.value)}
        />
      </Modal>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  hideLabel = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  hideLabel?: boolean
}) {
  return (
    <BaseSelectField
      label={!hideLabel ? label || <Filter size={14} /> : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      options={options}
    />
  )
}

function buildItemsSummary(sale: SaleRecord) {
  const first = sale.items[0]
  if (!first) return en.common.notAvailable
  if (sale.items.length === 1) return `${first.name} x ${first.quantity}`
  return `${first.name} x ${first.quantity} + ${sale.items.length - 1} ${en.sales.moreItemsSuffix}`
}

function formatDateTime(value: string) {
  return formatIndianDateTime(value)
}
