import { Plus, Save, Trash2 } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import { QUANTITY_UNITS, formatQuantity } from "@/app/lib/quantityUnit"
import type { PurchasePaymentStatus } from "@/app/lib/db"
import { PAYMENT_MODES, PAYMENT_STATUSES } from "./purchase.constants"
import { formatCurrency } from "./purchase.utils"
import type { PurchaseRow } from "./purchase.types"
import { en } from "@/app/messages/en"

type Props = {
  rows: PurchaseRow[]
  billNo: string
  supplierName: string
  purchaseDate: string
  paymentStatus: PurchasePaymentStatus
  paymentMode: string
  amountPaid: string
  purchaseNote: string
  totalAmount: number
  paidAmount: number
  dueAmount: number
  loading: boolean
  validationErrors: string[]
  onBillNoChange: (value: string) => void
  onSupplierChange: (value: string) => void
  onPurchaseDateChange: (value: string) => void
  onPaymentStatusChange: (value: PurchasePaymentStatus) => void
  onPaymentModeChange: (value: string) => void
  onAmountPaidChange: (value: string) => void
  onPurchaseNoteChange: (value: string) => void
  onUpdateRow: (id: string, key: keyof PurchaseRow, value: string) => void
  onAddRow: () => void
  onRemoveRow: (id: string) => void
}

export default function PurchaseFields({
  rows,
  billNo,
  supplierName,
  purchaseDate,
  paymentStatus,
  paymentMode,
  amountPaid,
  purchaseNote,
  totalAmount,
  paidAmount,
  dueAmount,
  loading,
  validationErrors,
  onBillNoChange,
  onSupplierChange,
  onPurchaseDateChange,
  onPaymentStatusChange,
  onPaymentModeChange,
  onAmountPaidChange,
  onPurchaseNoteChange,
  onUpdateRow,
  onAddRow,
  onRemoveRow,
}: Props) {
  return (
    <>
      <datalist id="quantityUnits">
        {QUANTITY_UNITS.map((unit) => (
          <option key={unit.value} value={unit.value}>
            {unit.label}
          </option>
        ))}
      </datalist>

      {validationErrors.length > 0 && <ValidationErrors errors={validationErrors} />}

      <datalist id="paymentModes">
        {PAYMENT_MODES.map((mode) => (
          <option key={mode} value={mode} />
        ))}
      </datalist>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Input
          label={en.purchases.billNo}
          value={billNo}
          onChange={(event) => onBillNoChange(event.target.value)}
          placeholder={en.purchases.billNoPlaceholder}
        />
        <Input
          id="purchase-supplier"
          label={<RequiredLabel>Supplier</RequiredLabel>}
          value={supplierName}
          onChange={(event) => onSupplierChange(event.target.value)}
          datalist="suppliers"
          placeholder={en.purchases.supplierPlaceholder}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            <RequiredLabel>{en.purchases.payment}</RequiredLabel>
          </label>
          <select
            value={paymentStatus}
            onChange={(event) => onPaymentStatusChange(event.target.value as PurchasePaymentStatus)}
            className="min-h-10 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {PAYMENT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          id="purchase-date"
          type="date"
          label={<RequiredLabel>{en.purchases.purchaseDate}</RequiredLabel>}
          value={purchaseDate}
          onChange={(event) => onPurchaseDateChange(event.target.value)}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input
          label={en.purchases.paymentMode}
          value={paymentMode}
          onChange={(event) => onPaymentModeChange(event.target.value)}
          datalist="paymentModes"
          placeholder={en.purchases.paymentModePlaceholder}
        />
        <Input
          label={en.purchases.purchaseNote}
          value={purchaseNote}
          onChange={(event) => onPurchaseNoteChange(event.target.value)}
          placeholder={en.purchases.purchaseNotePlaceholder}
        />
      </div>

      {paymentStatus === "partial" && (
        <div className="mt-3">
          <Input
            id="purchase-paid-amount"
            type="number"
            label={<RequiredLabel>{en.purchases.paidAmount}</RequiredLabel>}
            value={amountPaid}
            onChange={(event) => onAmountPaidChange(event.target.value)}
            placeholder={en.purchases.paidAmountPlaceholder}
          />
        </div>
      )}

      <div className="mt-5 space-y-4">
        <p className="text-sm font-black text-[var(--text-primary)]">{en.purchases.productDetails}</p>
        {rows.map((row, index) => (
          <PurchaseItemFields
            key={row.id}
            row={row}
            index={index}
            showRemove={rows.length > 1}
            onChange={(key, value) => onUpdateRow(row.id, key, value)}
            onRemove={() => onRemoveRow(row.id)}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-card)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="dotBorder" title={en.purchases.addAnotherProduct} icon={<Plus size={17} />} onClick={onAddRow} />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] px-4 py-3 text-left sm:text-right">
            <p className="text-sm font-bold text-[var(--text-primary)]">{en.purchases.total}: {formatCurrency(totalAmount)}</p>
            <p className="text-sm text-[var(--text-secondary)]">
              {en.purchases.paid} {formatCurrency(paidAmount)} | {en.purchases.balance} {formatCurrency(dueAmount)}
            </p>
          </div>
          <Button type="submit" variant="primary" title={en.purchases.savePurchase} icon={<Save size={17} />} loading={loading} />
        </div>
      </div>
    </>
  )
}

function PurchaseItemFields({
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
    <div className="rounded-xl border border-[var(--border-card)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-input)] bg-[var(--bg-input)] text-xs font-bold text-[var(--text-muted)]">
            {index + 1}
          </span>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {row.name || en.purchases.productNameEmpty}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-emerald-600">
            {formatCurrency(Number(row.price || 0) * Number(row.quantity || 0))}
          </p>
          {showRemove && (
            <Button type="button" variant="delete" icon={<Trash2 size={17} />} onClick={onRemove} title={en.purchases.remove} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-4">
        <Input
          id={`purchase-item-${row.id}-name`}
          label={<RequiredLabel>{en.purchases.productName}</RequiredLabel>}
          value={row.name}
          onChange={(event) => onChange("name", event.target.value)}
          datalist="productNames"
          placeholder={en.purchases.productNamePlaceholder}
        />
        <Input
          id={`purchase-item-${row.id}-category`}
          label={<RequiredLabel>{en.purchases.category}</RequiredLabel>}
          value={row.category}
          onChange={(event) => onChange("category", event.target.value)}
          datalist="categories"
          placeholder={en.purchases.categoryPlaceholder}
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
        <QuantityInput
          inputId={`purchase-item-${row.id}-quantity`}
          unitInputId={`purchase-item-${row.id}-unit`}
          row={row}
          onChange={onChange}
        />
        <Input
          id={`purchase-item-${row.id}-price`}
          type="number"
          label={<RequiredLabel>{en.purchases.pricePerUnit}</RequiredLabel>}
          value={row.price}
          onChange={(event) => onChange("price", event.target.value)}
          placeholder={en.purchases.pricePlaceholder}
        />
        <Input
          type="date"
          label={en.purchases.expiryDate}
          value={row.expiry}
          onChange={(event) => onChange("expiry", event.target.value)}
        />
        <div className="min-[520px]:col-span-2 lg:col-span-4">
          <Input
            label={en.purchases.itemNote}
            value={row.note}
            onChange={(event) => onChange("note", event.target.value)}
            placeholder={en.purchases.itemNotePlaceholder}
          />
        </div>
      </div>
    </div>
  )
}

function ValidationErrors({ errors }: { errors: string[] }) {
  return (
    <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
      <p className="font-bold">{en.purchases.fixBeforeSaving}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  )
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
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
        <RequiredLabel>{en.purchases.quantityAndUnit}</RequiredLabel>
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
          aria-label="Quantity unit"
          className="w-24 shrink-0 border-l border-[var(--border-input)] bg-transparent p-2 text-sm font-semibold text-[var(--text-primary)] outline-none"
        />
      </div>
      {Number(row.quantity) > 0 && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">{formatQuantity(row.quantity, row.quantityUnit)}</p>
      )}
    </div>
  )
}
