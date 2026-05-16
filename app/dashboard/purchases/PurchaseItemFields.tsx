"use client"

import { Trash2 } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import { QUANTITY_UNITS, formatQuantity } from "@/app/lib/quantityUnit"
import { formatCurrency } from "./purchase.utils"
import type { PurchaseRow } from "./purchase.types"
import { en } from "@/app/messages/en"

export function RequiredMark() {
  return <span className="text-red-500">* </span>
}

export function PurchaseItemFields({
  row,
  index,
  showRemove,
  onChange,
  onRemove,
}: {
  row: PurchaseRow
  index: number
  showRemove: boolean
  onChange: (key: keyof PurchaseRow, value: string) => void
  onRemove: () => void
}) {
  return (
    <>
      <datalist id="quantityUnits">
        {QUANTITY_UNITS.map((unit) => (
          <option key={unit.value} value={unit.value}>
            {unit.label}
          </option>
        ))}
      </datalist>

      <div className="w-full rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3 shadow-sm sm:p-4 lg:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-input)] bg-[var(--bg-input)] text-xs font-bold text-[var(--text-muted)] sm:h-8 sm:w-8">
              {index + 1}
            </span>

            <p className="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)] sm:text-base">
              {row.name || en.purchases.productNameEmpty}
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <p className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-600 dark:bg-emerald-500/10 sm:text-base">
              {formatCurrency(Number(row.price || 0) * Number(row.quantity || 0))}
            </p>

            {showRemove && (
              <Button
                type="button"
                variant="delete"
                icon={<Trash2 size={17} />}
                onClick={onRemove}
                title={en.purchases.remove}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="sm:col-span-2 xl:col-span-1">
            <Input
              id={`purchase-item-${row.id}-name`}
              label={
                <>
                  {en.purchases.productName} <RequiredMark />
                </>
              }
              value={row.name}
              onChange={(event) => onChange("name", event.target.value)}
              datalist="productNames"
              placeholder={en.purchases.productNamePlaceholder}
            />
          </div>

          <Input
            id={`purchase-item-${row.id}-category`}
            label={en.purchases.category}
            value={row.category}
            onChange={(event) => onChange("category", event.target.value)}
            datalist="categories"
            placeholder={en.purchases.categoryPlaceholder}
          />

          <Input
            id={`purchase-item-${row.id}-price`}
            type="number"
            label={
              <>
                {en.purchases.pricePerUnit} <RequiredMark />
              </>
            }
            value={row.price}
            onChange={(event) => onChange("price", event.target.value)}
            placeholder={en.purchases.pricePlaceholder}
          />

          <QuantityInput
            inputId={`purchase-item-${row.id}-quantity`}
            unitInputId={`purchase-item-${row.id}-unit`}
            row={row}
            onChange={onChange}
          />

          <Input
            type="date"
            label={en.purchases.expiryDate}
            value={row.expiry}
            onChange={(event) => onChange("expiry", event.target.value)}
          />

          <Input
            id={`purchase-item-${row.id}-sku`}
            label={en.purchases.sku}
            value={row.sku}
            onChange={(event) => onChange("sku", event.target.value)}
            placeholder={en.purchases.skuPlaceholder}
          />

          <Input
            id={`purchase-item-${row.id}-hsn`}
            label={en.purchases.hsnCode}
            value={row.hsnCode}
            onChange={(event) => onChange("hsnCode", event.target.value)}
            placeholder={en.purchases.hsnPlaceholder}
          />

          <div className="sm:col-span-2 xl:col-span-4">
            <Input
              label={en.purchases.itemNote}
              value={row.note}
              onChange={(event) => onChange("note", event.target.value)}
              placeholder={en.purchases.itemNotePlaceholder}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export function ValidationErrors({ errors }: { errors: string[] }) {
  return (
    <div className="mb-4 rounded-2xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 sm:p-4">
      <p className="font-bold">{en.purchases.fixBeforeSaving}</p>

      <ul className="mt-2 list-disc space-y-1 pl-5">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  )
}

export function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span>{children}</span>
      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
        {en.purchases.requiredBadge}
      </span>
    </span>
  )
}

function QuantityInput({
  inputId,
  unitInputId,
  row,
  onChange,
}: {
  inputId: string
  unitInputId: string
  row: PurchaseRow
  onChange: (key: keyof PurchaseRow, value: string) => void
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
        <>{en.purchases.quantityAndUnit} <RequiredMark /> </>
      </label>
      <div className="flex overflow-hidden rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] focus-within:ring-2 focus-within:ring-emerald-400">
        <input
          id={inputId}
          type="number"
          value={row.quantity}
          onChange={(event) => onChange("quantity", event.target.value)}
          className="min-h-10 min-w-0 flex-1 bg-transparent p-2 text-[var(--text-primary)] outline-none"
        />
        <input
          id={unitInputId}
          list="quantityUnits"
          value={row.quantityUnit}
          onChange={(event) => onChange("quantityUnit", event.target.value)}
          aria-label={en.purchases.quantityAndUnit}
          className="w-24 shrink-0 border-l border-[var(--border-input)] bg-transparent p-2 text-sm font-semibold text-[var(--text-primary)] outline-none"
        />
      </div>
      {Number(row.quantity) > 0 && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">{formatQuantity(row.quantity, row.quantityUnit)}</p>
      )}
    </div>
  )
}