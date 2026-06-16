"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { FilePlus2 } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import PageHeader from "@/app/components/ui/PageHeader"
import SuspendedAccessBanner from "@/app/components/subscription/SuspendedAccessBanner"
import SalesFilters from "@/app/dashboard/sales/SalesFilters"
import SalesPaginationBar from "@/app/dashboard/sales/SalesPaginationBar"
import SalesRecords from "@/app/dashboard/sales/SalesRecords"
import useFeatureGate from "@/app/hooks/useFeatureGate"
import useSales from "@/app/hooks/useSales"
import { usePagination } from "@/app/hooks/usePagination"
import useProfile from "@/app/dashboard/profile/useProfile"
import { buildBusinessDocumentProfile } from "@/app/lib/transactionDocument"
import { buildSaleInvoiceDraftFromRecord } from "@/app/lib/sales/sale.documents"
import { cancelSale } from "@/app/lib/sales/sale.service"
import { saveSaleInvoiceDraft } from "@/app/dashboard/gst-invoice/invoiceDraft.service"
import { notify as toast } from "@/app/lib/notifications"
import { auth } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { en } from "@/app/messages/en"
import { DASHBOARD_ROUTES } from "@/app/lib/navigation/dashboardRoutes"
import { matchesSearchQuery } from "@/app/lib/search.utils"
import type { SalePaymentStatus, SaleRecord } from "@/app/lib/db"

export default function SalesPage() {
  const router = useRouter()
  const { sales, loading } = useSales()
  const { profile } = useProfile()
  const salesGate = useFeatureGate("sales")
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

  const paymentModes = useMemo(
    () => Array.from(new Set(sales.map((sale) => sale.paymentMode))),
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
      const matchesCustomer = customerFilter === "all" || (sale.customer?.name || "") === customerFilter
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

  const handleCreateReturn = (sale: SaleRecord) => {
    router.push(`${DASHBOARD_ROUTES.returns}?saleId=${encodeURIComponent(sale.id)}`)
  }

  const handleCreateExchange = (sale: SaleRecord) => {
    router.push(`${DASHBOARD_ROUTES.exchange}?saleId=${encodeURIComponent(sale.id)}`)
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
      {salesGate.subscriptionExpired ? (
        <SuspendedAccessBanner
          description={en.subscription.readOnlyExpiredMessage}
          featureLabel={en.subscription.features.sales}
          usage={salesGate.usage}
          limit={typeof salesGate.limit === "number" ? salesGate.limit : undefined}
          onOpenUpgrade={() => window.location.assign("/pricing")}
        />
      ) : null}

      <SalesFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        modeFilter={modeFilter}
        setModeFilter={setModeFilter}
        customerFilter={customerFilter}
        setCustomerFilter={setCustomerFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        paymentModes={paymentModes}
        customers={customers}
        onResetPage={resetPage}
      />

      <SalesRecords
        paginatedSales={paginatedSales}
        sellerProfile={sellerProfile}
        onCreateDraft={handleCreateDraft}
        onCreateReturn={handleCreateReturn}
        onCreateExchange={handleCreateExchange}
        onCancelSale={(sale) => {
          setCancelTarget(sale)
        }}
      />

      {!loading && !filteredSales.length ? (
        <div className="rounded-[28px] border border-dashed border-[var(--border-card)] p-6 text-center text-[var(--text-secondary)]">
          <p className="text-lg font-semibold text-[var(--text-primary)]">{en.sales.noSalesTitle}</p>
          <p className="mt-2">{en.sales.noSalesDescription}</p>
        </div>
      ) : null}

      <SalesPaginationBar
        filteredCount={filteredSales.length}
        pageSize={pageSize}
        setPageSize={setPageSize}
        currentPage={currentPage}
        totalPages={totalPages}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        goPrevious={goPrevious}
        goNext={goNext}
        onResetPage={resetPage}
      />

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
