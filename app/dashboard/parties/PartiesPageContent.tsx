"use client"

import InfoTile from "@/app/components/ui/InfoTile"
import { useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import PageHeader from "@/app/components/ui/PageHeader"
import SummaryCard from "@/app/components/ui/SummaryCard"
import SimpleEmptyState from "@/app/components/ui/SimpleEmptyState"
import BaseSelectField from "@/app/components/ui/SelectField"
import PartyFormModal from "@/app/components/parties/PartyFormModal"
import useParties from "@/app/hooks/useParties"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"
import { matchesSearchQuery } from "@/app/lib/search.utils"
import type { PartyRoleFilter } from "@/app/lib/parties/party.service"

export default function PartiesPageContent({
  defaultType = "all",
}: {
  defaultType?: PartyRoleFilter
}) {
  const { parties, loading } = useParties(defaultType)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<PartyRoleFilter>(defaultType)
  const [balanceFilter, setBalanceFilter] = useState<"all" | "receivable" | "payable" | "balanced">("all")
  const [showCreate, setShowCreate] = useState(false)

  const filteredParties = useMemo(() => {
    return parties.filter((party) => {
      const matchesSearch = matchesSearchQuery([
        party.name,
        party.mobile,
        party.email,
        party.gstin,
        party.city,
        party.notes,
      ], search)

      const matchesType =
        typeFilter === "all"
          ? true
          : party.type === typeFilter || party.type === "both"

      const matchesBalance =
        balanceFilter === "all" ||
        (balanceFilter === "receivable" && party.receivable > 0) ||
        (balanceFilter === "payable" && party.payable > 0) ||
        (balanceFilter === "balanced" && party.receivable <= 0 && party.payable <= 0)

      return matchesSearch && matchesType && matchesBalance
    })
  }, [balanceFilter, parties, search, typeFilter])

  const totalReceivable = filteredParties.reduce((sum, party) => sum + party.receivable, 0)
  const totalPayable = filteredParties.reduce((sum, party) => sum + party.payable, 0)

  return (
    <div className="dashboard-page space-y-6 pb-8">
      <PageHeader
        eyebrow={defaultType === "customer" ? en.navigation.customers : en.navigation.parties}
        title={defaultType === "customer" ? en.pages.customersTitle : en.pages.partiesTitle}
        description={defaultType === "customer" ? en.pages.customersDescription : en.pages.partiesDescription}
        actions={
          <Button
            type="button"
            variant="primary"
            title={defaultType === "customer" ? en.parties.addCustomer : en.parties.addParty}
            icon={<Plus size={16} />}
            onClick={() => setShowCreate(true)}
            className="w-full sm:w-auto"
          />
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label={en.parties.title} value={String(filteredParties.length)} />
        <SummaryCard label={en.parties.receivable} value={formatCurrency(totalReceivable)} />
        <SummaryCard label={en.parties.payable} value={formatCurrency(totalPayable)} />
      </section>

      <section className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_repeat(2,minmax(0,1fr))]">
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">{en.parties.searchPlaceholder}</label>
            <Search size={16} className="pointer-events-none absolute left-3 top-[42px] text-[var(--text-muted)]" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
          </div>

          <FilterField
            label={en.parties.type}
            value={typeFilter}
            onChange={(value) => setTypeFilter(value as PartyRoleFilter)}
            options={[
              { value: "all", label: en.parties.allTypes },
              { value: "customer", label: en.parties.customer },
              { value: "supplier", label: en.parties.supplier },
              { value: "both", label: en.parties.both },
            ]}
          />
          <FilterField
            label={en.parties.dueStatus}
            value={balanceFilter}
            onChange={(value) => setBalanceFilter(value as typeof balanceFilter)}
            options={[
              { value: "all", label: en.parties.allBalanceStates },
              { value: "receivable", label: en.parties.withReceivable },
              { value: "payable", label: en.parties.withPayable },
              { value: "balanced", label: en.parties.balanced },
            ]}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filteredParties.map((party) => (
          <article key={party.id} className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xl font-bold text-[var(--text-primary)]">{party.name}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {[party.mobile, party.city, party.state].filter(Boolean).join(" | ") || en.common.notAvailable}
                </p>
              </div>
              <span className="rounded-full border border-[var(--border-card)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                {party.type === "customer" ? en.parties.customer : party.type === "supplier" ? en.parties.supplier : en.parties.both}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
              <InfoTile label={en.parties.receivable} value={formatCurrency(party.receivable)} />
              <InfoTile label={en.parties.payable} value={formatCurrency(party.payable)} />
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link href={`/dashboard/parties/${party.id}`} className="flex-1">
                <Button type="button" variant="primary" title={en.parties.viewLedger} className="w-full" />
              </Link>
              <Link href={party.type === "supplier" ? "/dashboard/purchases" : "/dashboard/quick-sale"} className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  title={party.type === "supplier" ? en.suppliers.newPurchase : en.sales.createNewSale}
                  className="w-full"
                />
              </Link>
            </div>
          </article>
        ))}
      </section>

      {!loading && !filteredParties.length ? (
        <SimpleEmptyState title={en.parties.noPartiesTitle} description={en.parties.noPartiesDescription} />
      ) : null}

      <PartyFormModal open={showCreate} type={defaultType === "customer" ? "customer" : "both"} onClose={() => setShowCreate(false)} />
    </div>
  )
}

function FilterField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return <BaseSelectField label={label} value={value} onChange={(event) => onChange(event.target.value)} options={options} />
}
