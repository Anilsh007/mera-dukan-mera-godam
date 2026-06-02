"use client"

import { Search } from "lucide-react"
import Input from "@/app/components/ui/Input"
import SelectField from "@/app/components/ui/SelectField"
import { en } from "@/app/messages/en"
import type { SalePaymentStatus, SaleRecord } from "@/app/lib/db"

type SalesFiltersProps = {
  search: string
  setSearch: (value: string) => void
  statusFilter: "all" | SalePaymentStatus
  setStatusFilter: (value: "all" | SalePaymentStatus) => void
  modeFilter: "all" | SaleRecord["paymentMode"]
  setModeFilter: (value: "all" | SaleRecord["paymentMode"]) => void
  customerFilter: string
  setCustomerFilter: (value: string) => void
  dateFilter: "all" | "today" | "month"
  setDateFilter: (value: "all" | "today" | "month") => void
  paymentModes: Array<SaleRecord["paymentMode"]>
  customers: string[]
  onResetPage: () => void
}

export default function SalesFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  modeFilter,
  setModeFilter,
  customerFilter,
  setCustomerFilter,
  dateFilter,
  setDateFilter,
  paymentModes,
  customers,
  onResetPage,
}: SalesFiltersProps) {
  return (
    <section className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
        <div className="relative">
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">{en.sales.searchPlaceholder}</label>
          <Search size={16} className="pointer-events-none absolute left-3 top-[42px] text-[var(--text-muted)]" />
          <Input value={search} onChange={(event) => { setSearch(event.target.value); onResetPage() }} className="pl-9" />
        </div>

        <SelectField
          label={en.sales.paymentStatus}
          value={statusFilter}
          onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); onResetPage() }}
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
          onChange={(event) => { setModeFilter(event.target.value as typeof modeFilter); onResetPage() }}
          options={[
            { value: "all", label: en.sales.allModes },
            ...paymentModes.map((mode) => ({ value: mode, label: mode })),
          ]}
        />
        <SelectField
          label={en.sales.customerWise}
          value={customerFilter}
          onChange={(event) => { setCustomerFilter(event.target.value); onResetPage() }}
          options={[
            { value: "all", label: en.sales.allCustomers },
            ...customers.map((customer) => ({ value: customer, label: customer })),
          ]}
        />
        <SelectField
          label={en.sales.filtersTitle}
          value={dateFilter}
          onChange={(event) => { setDateFilter(event.target.value as typeof dateFilter); onResetPage() }}
          options={[
            { value: "all", label: en.sales.clearFilters },
            { value: "today", label: en.sales.today },
            { value: "month", label: en.sales.thisMonth },
          ]}
        />
      </div>
    </section>
  )
}
