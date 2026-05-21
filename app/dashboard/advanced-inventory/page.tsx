"use client"

import { useMemo, useState } from "react"
import { ArrowRightLeft, Download, PackageSearch, Printer, Warehouse } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import PageHeader from "@/app/components/ui/PageHeader"
import SummaryCard from "@/app/components/ui/SummaryCard"
import useProducts from "@/app/hooks/useProducts"
import useFeatureGate from "@/app/hooks/useFeatureGate"
import { useInventoryBatches, useInventoryLocations, useProductLocationStocks, useStockTransfers } from "@/app/hooks/useAdvancedInventory"
import {
  buildAdvancedInventoryReportRows,
  buildAdvancedInventoryRows,
  buildTransferReportRows,
  filterAdvancedInventoryRows,
  type AdvancedInventoryViewRow,
} from "@/app/lib/advancedInventory/advancedInventory.utils"
import { ensureDefaultInventoryLocation, saveInventoryLocation, transferStock } from "@/app/lib/advancedInventory/advancedInventory.service"
import { exportAccountingCsv, printAccountingRows } from "@/app/lib/accounting/accounting.export"
import { auth } from "@/app/lib/firebase"
import { notify as toast } from "@/app/lib/notifications"
import { assertFeatureAccess, incrementUsage } from "@/app/lib/subscription/subscription.service"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { formatQuantity } from "@/app/lib/quantityUnit"
import { en } from "@/app/messages/en"

export default function AdvancedInventoryPage() {
  const { products, loading: productsLoading } = useProducts()
  const { locations } = useInventoryLocations()
  const { locationStocks } = useProductLocationStocks()
  const { batches } = useInventoryBatches()
  const { transfers } = useStockTransfers()
  const godownGate = useFeatureGate("godowns")
  const [search, setSearch] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [batchFilter, setBatchFilter] = useState("")
  const [expiryFilter, setExpiryFilter] = useState("all")
  const [locationName, setLocationName] = useState("")
  const [locationCode, setLocationCode] = useState("")
  const [locationNotes, setLocationNotes] = useState("")
  const [transferOpen, setTransferOpen] = useState(false)
  const [savingLocation, setSavingLocation] = useState(false)

  const rows = useMemo(
    () => buildAdvancedInventoryRows({ products, locations, locationStocks, batches }),
    [batches, locationStocks, locations, products],
  )
  const filteredRows = useMemo(
    () => filterAdvancedInventoryRows(rows, { search, locationId: locationFilter, batch: batchFilter, expiry: expiryFilter }),
    [batchFilter, expiryFilter, locationFilter, rows, search],
  )
  const totalStock = rows.reduce((sum, row) => sum + Number(row.product.quantity || 0), 0)
  const trackedBatches = batches.filter((batch) => Number(batch.quantity || 0) > 0).length
  const lowReorderRows = rows.filter((row) => Number(row.product.quantity || 0) <= Number(row.product.reorderLevel ?? row.product.lowStockThreshold ?? -1))
  const reportRows = buildAdvancedInventoryReportRows(filteredRows)
  const transferRows = buildTransferReportRows(transfers)

  const handleEnsureDefault = async () => {
    try {
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      await ensureDefaultInventoryLocation(userId)
      toast.success(en.advancedInventory.locationSaved)
    } catch (error) {
      console.error("Default godown save failed", error)
      toast.error(error instanceof Error ? error.message : en.advancedInventory.locationSaveFailed)
    }
  }

  const handleSaveLocation = async () => {
    try {
      setSavingLocation(true)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      await saveInventoryLocation({ userId, name: locationName, code: locationCode, notes: locationNotes })
      toast.success(en.advancedInventory.locationSaved)
      setLocationName("")
      setLocationCode("")
      setLocationNotes("")
    } catch (error) {
      console.error("Godown save failed", error)
      toast.error(error instanceof Error ? error.message : en.advancedInventory.locationSaveFailed)
    } finally {
      setSavingLocation(false)
    }
  }

  const runExport = async (kind: "csv" | "print") => {
    if (!filteredRows.length) {
      toast.warning(en.advancedInventory.noRows)
      return
    }
    try {
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      await assertFeatureAccess(userId, "exports", { operation: "export", scope: "premium", incrementBy: 1 })
      if (kind === "csv") exportAccountingCsv(reportRows, "advanced-inventory")
      if (kind === "print" && !printAccountingRows(reportRows, en.advancedInventory.title)) {
        toast.error(en.print.popupBlocked)
        return
      }
      await incrementUsage(userId, "exports")
      toast.success(kind === "print" ? en.advancedInventory.printStarted : en.advancedInventory.exportDone)
    } catch (error) {
      console.error("Advanced inventory export failed", error)
      toast.error(error instanceof Error ? error.message : en.share.downloadFailed)
    }
  }

  return (
    <main className="space-y-5 p-3 sm:p-4 lg:p-6">
      <PageHeader title={en.advancedInventory.title} description={en.advancedInventory.description} />

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label={en.advancedInventory.locations} value={String(Math.max(locations.length, 1))} icon={<Warehouse size={18} />} />
        <SummaryCard label={en.advancedInventory.totalStock} value={totalStock.toLocaleString("en-IN")} icon={<PackageSearch size={18} />} />
        <SummaryCard label={en.advancedInventory.batchNo} value={String(trackedBatches)} icon={<PackageSearch size={18} />} />
        <SummaryCard label={en.advancedInventory.reorderLevel} value={String(lowReorderRows.length)} icon={<PackageSearch size={18} />} />
      </section>

      <p className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-3 text-sm text-[var(--text-secondary)]">
        {en.advancedInventory.bundleNote} {en.advancedInventory.defaultLocationHelp}
      </p>

      <section className="grid gap-4 xl:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.3fr)]">
        <div className="space-y-4">
          <form className="premium-surface space-y-3 rounded-3xl p-4" onSubmit={(event) => { event.preventDefault(); void handleSaveLocation() }}>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.advancedInventory.locations}</h2>
            <Input label={en.advancedInventory.locationName} value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder={en.advancedInventory.locationNamePlaceholder} />
            <Input label={en.advancedInventory.locationCode} value={locationCode} onChange={(event) => setLocationCode(event.target.value)} />
            <Input label={en.advancedInventory.locationNotes} value={locationNotes} onChange={(event) => setLocationNotes(event.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" title={en.advancedInventory.saveLocation} loading={savingLocation} disabled={!godownGate.allowed || godownGate.loading} />
              <Button type="button" variant="outline" title={en.advancedInventory.defaultGodownName} onClick={() => void handleEnsureDefault()} />
            </div>
          </form>

          <section className="premium-surface space-y-3 rounded-3xl p-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.advancedInventory.transferStock}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{en.advancedInventory.transferConfirmDescription}</p>
            <Button type="button" icon={<ArrowRightLeft size={16} />} title={en.advancedInventory.transferStock} onClick={() => setTransferOpen(true)} disabled={!godownGate.allowed || godownGate.loading || locations.length < 2 || products.length === 0} />
          </section>
        </div>

        <section className="premium-surface space-y-4 rounded-3xl p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Input label={en.advancedInventory.product} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={en.advancedInventory.searchPlaceholder} containerClassName="xl:col-span-2" />
            <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
              <span>{en.advancedInventory.location}</span>
              <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
                <option value="">{en.advancedInventory.allLocations}</option>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </select>
            </label>
            <Input label={en.advancedInventory.batchNo} value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)} placeholder={en.advancedInventory.allBatches} />
            <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
              <span>{en.advancedInventory.expiryFilter}</span>
              <select value={expiryFilter} onChange={(event) => setExpiryFilter(event.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
                <option value="all">{en.advancedInventory.allExpiry}</option>
                <option value="tracked">{en.advancedInventory.trackedExpiry}</option>
                <option value="expired">{en.advancedInventory.expired}</option>
                <option value="next30">{en.advancedInventory.expiringIn30Days}</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="black" icon={<Download size={16} />} title={en.advancedInventory.exportCsv} onClick={() => void runExport("csv")} />
            <Button type="button" variant="outline" icon={<Printer size={16} />} title={en.advancedInventory.print} onClick={() => void runExport("print")} />
          </div>

          {productsLoading ? (
            <p className="text-sm text-[var(--text-secondary)]">{en.common.loading}</p>
          ) : filteredRows.length ? (
            <div className="space-y-3">
              {filteredRows.map((row) => <AdvancedInventoryCard key={row.product.id} row={row} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border-input)] p-6 text-center text-sm text-[var(--text-secondary)]">{en.advancedInventory.noRows}</div>
          )}
        </section>
      </section>

      <section className="premium-surface space-y-3 rounded-3xl p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.advancedInventory.transferHistory}</h2>
          <Button type="button" variant="outline" title={en.advancedInventory.print} onClick={() => printAccountingRows(transferRows, en.advancedInventory.transferHistory)} />
        </div>
        {transfers.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {transfers.slice(0, 20).map((transfer) => (
              <article key={transfer.id} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
                <p className="font-semibold text-[var(--text-primary)]">{transfer.transferNo}</p>
                <p className="text-sm text-[var(--text-secondary)]">{transfer.productName}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{transfer.fromLocationName} → {transfer.toLocationName}</p>
                <p className="mt-1 font-bold text-[var(--text-primary)]">{formatQuantity(transfer.quantity, transfer.quantityUnit)}</p>
              </article>
            ))}
          </div>
        ) : <p className="text-sm text-[var(--text-secondary)]">{en.advancedInventory.noTransfers}</p>}
      </section>

      {transferOpen && <TransferModal rows={rows} locations={locations} onClose={() => setTransferOpen(false)} />}
    </main>
  )
}

function AdvancedInventoryCard({ row }: { row: AdvancedInventoryViewRow }) {
  return (
    <article className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-[var(--text-primary)]">{row.product.name}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{[row.product.category, row.product.sku].filter(Boolean).join(" | ") || en.common.notAvailable}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{en.advancedInventory.locations}: {row.locationNames || en.advancedInventory.defaultGodownName}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.advancedInventory.batchNo}: {row.batchLabels || en.advancedInventory.noBatch}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-lg font-bold text-[var(--text-primary)]">{formatQuantity(row.product.quantity, row.product.quantityUnit)}</p>
          <p className="text-xs text-[var(--text-secondary)]">{en.advancedInventory.reorderLevel}: {row.product.reorderLevel ?? row.product.lowStockThreshold ?? en.common.notAvailable}</p>
          <p className="text-xs text-[var(--text-secondary)]">{en.advancedInventory.nearestExpiry}: {row.nearestExpiry || row.product.expiry || en.common.notAvailable}</p>
        </div>
      </div>
    </article>
  )
}

function TransferModal({ rows, locations, onClose }: { rows: AdvancedInventoryViewRow[]; locations: Array<{ id: string; name: string }>; onClose: () => void }) {
  const [productId, setProductId] = useState(rows[0]?.product.id || "")
  const [fromLocationId, setFromLocationId] = useState(locations[0]?.id || "")
  const [toLocationId, setToLocationId] = useState(locations[1]?.id || locations[0]?.id || "")
  const [quantity, setQuantity] = useState("")
  const [note, setNote] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const selectedRow = rows.find((row) => row.product.id === productId)
  const fromStock = selectedRow?.locationStocks.find((stock) => stock.locationId === fromLocationId)

  const handleTransfer = async () => {
    if (!confirming) {
      setConfirming(true)
      toast.warning(en.advancedInventory.confirmTransfer)
      return
    }
    try {
      setSaving(true)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      await transferStock({ userId, productId, fromLocationId, toLocationId, quantity: Number(quantity || 0), note })
      toast.success(en.advancedInventory.transferSaved)
      onClose()
    } catch (error) {
      console.error("Stock transfer failed", error)
      toast.error(error instanceof Error ? error.message : en.advancedInventory.transferFailed)
    } finally {
      setSaving(false)
      setConfirming(false)
    }
  }

  return (
    <Modal title={en.advancedInventory.transferStock} description={en.advancedInventory.transferConfirmDescription} onClose={onClose} primaryLabel={confirming ? en.advancedInventory.confirmTransfer : en.advancedInventory.transferStock} primaryVariant={confirming ? "danger" : "primary"} onPrimary={handleTransfer} loading={saving} cancelLabel={en.common.cancel}>
      <div className="space-y-3">
        <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
          <span>{en.advancedInventory.product}</span>
          <select value={productId} onChange={(event) => setProductId(event.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
            {rows.map((row) => <option key={row.product.id} value={row.product.id}>{row.product.name}</option>)}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
            <span>{en.advancedInventory.fromGodown}</span>
            <select value={fromLocationId} onChange={(event) => setFromLocationId(event.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
            <span>{en.advancedInventory.toGodown}</span>
            <select value={toLocationId} onChange={(event) => setToLocationId(event.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
        </div>
        <Input label={en.advancedInventory.quantity} type="number" min="0" step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        <p className="text-xs text-[var(--text-secondary)]">{en.inventory.available}: {fromStock ? formatQuantity(fromStock.quantity, fromStock.quantityUnit) : formatQuantity(0, selectedRow?.product.quantityUnit)}</p>
        <Input label={en.advancedInventory.note} value={note} onChange={(event) => setNote(event.target.value)} placeholder={en.advancedInventory.transferNotePlaceholder} />
      </div>
    </Modal>
  )
}
