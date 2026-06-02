import Input from "@/app/components/ui/Input"
import Button from "@/app/components/ui/Button"
import { MdDeleteOutline } from "react-icons/md"
import { ItemCardProps } from "../types/ui.types"
import { FaEquals, FaPlus } from "react-icons/fa"
import { useProductSuggestions, ProductSuggestion } from "../hooks/useProductSuggestions"
import { useState } from "react"
import { CircleAlert, Info } from "lucide-react"
import { formatTaxRate } from "../lib/hsnSacLookup"
import { en } from "@/app/messages/en"

export default function ItemCard({ item, index, onChange, onPatch, onRemove, isInterState }: ItemCardProps) {
  const { suggestions } = useProductSuggestions()
  const [showDropdown, setShowDropdown] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const handleSelectProduct = (product: ProductSuggestion) => {
    onPatch(index, {
      name: product.value,
      description: product.value,
      rate: product.price || 0,
      unit: product.unit || en.inventory.defaultUnitPcs,
      hsnCode: product.hsnCode || "",
    })
    setShowDropdown(false)
  }

  const filteredSuggestions = suggestions.filter((s) =>
    s.label.toLowerCase().includes(item.name?.toLowerCase() || "")
  )

  return (
    <div className="premium-surface relative min-w-0 rounded-2xl p-3 sm:p-4">
      <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <p>{en.gstInvoice.itemLabel} {index + 1}</p>
        <Button
          variant={confirmRemove ? "danger" : "delete"}
          icon={<MdDeleteOutline aria-hidden="true" />}
          title={confirmRemove ? en.common.confirm : en.common.delete}
          onClick={() => {
            if (confirmRemove) {
              onRemove(index)
              return
            }
            setConfirmRemove(true)
          }}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative">
          <Input
            label={en.gstInvoice.product}
            value={item.name}
            onChange={(e) => {
              onChange(index, "name", e.target.value)
              setShowDropdown(true)
            }}
          />

          {showDropdown && filteredSuggestions.length > 0 && (
            <div className="absolute z-50 max-h-40 w-full overflow-auto rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] shadow-[var(--shadow-card)] backdrop-blur-xl">
              {filteredSuggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="block w-full cursor-pointer p-2 text-left hover:bg-[var(--bg-soft)] focus-visible:bg-[var(--bg-soft)]"
                  onClick={() => handleSelectProduct(s)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Input
          label={en.gstInvoice.description}
          value={item.description || item.name}
          onChange={(e) => onChange(index, "description", e.target.value)}
        />

        <div className="relative">
          <Input
            label={en.gstInvoice.hsnSac}
            value={item.hsnCode}
            onChange={(e) => onChange(index, "hsnCode", e.target.value)}
            className="pr-10"
          />
          {item.hsnSacDescription && (
            <div className="group absolute right-3 top-[38px]">
              <button
                type="button"
                className="rounded-full bg-sky-100 p-1 text-sky-700 shadow-sm ring-1 ring-sky-200 transition hover:bg-sky-200 hover:text-sky-900"
                aria-label={en.gstInvoice.viewHsnSacDetails}
              >
                <Info size={16} aria-hidden="true" />
              </button>
              <div className="absolute right-0 top-full z-50 hidden max-w-[calc(100vw-2rem)] pt-2 group-hover:block group-focus-within:block">
                <div className="absolute right-3 top-[3px] h-3 w-3 rotate-45 border-l border-t border-sky-200 bg-white" />
                <div className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-sky-200 bg-white p-3 text-left shadow-xl">
                  <div className="flex items-start gap-2">
                    <CircleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-sky-700" />
                    <div className="min-w-0 text-sm text-slate-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">{item.hsnSacType || en.gstInvoice.gst} {en.gstInvoice.details}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{en.gstInvoice.cgst} {formatTaxRate(item.cgstRate)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{en.gstInvoice.sgstUtgst} {formatTaxRate(item.sgstRate)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{en.gstInvoice.igst} {formatTaxRate(item.igstRate)}</span>
                      </div>
                      <p className="mt-2 leading-6">{item.hsnSacDescription}</p>
                      {item.gstCondition && (
                        <p className="mt-2 text-xs leading-5 text-slate-600">{item.gstCondition}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <Input
          label={en.inventory.rate}
          type="number"
          inputMode="decimal"
          step="any"
          value={String(item.rate)}
          onChange={(e) => onChange(index, "rate", e.target.value)}
        />
        <Input
          label={en.stockHistory.labels.qty}
          type="number"
          inputMode="decimal"
          step="any"
          value={String(item.quantity)}
          onChange={(e) => onChange(index, "quantity", e.target.value)}
        />
        <Input
          label={en.gstInvoice.itemDiscount}
          type="number"
          inputMode="decimal"
          step="any"
          value={String(item.discount)}
          onChange={(e) => onChange(index, "discount", e.target.value)}
        />
        <Input label={en.gstInvoice.expiryDate} type="date" value={String(item.expiry)} onChange={(e) => onChange(index, "expiry", e.target.value)} />
      </div>

      <div className="mt-4 space-y-4">
        <div className="text-xs font-medium">
          {isInterState ? (
            <span className="rounded-full bg-purple-100 px-2 py-1 text-purple-700">
              {en.gstInvoice.interStateApplied}
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
              {en.gstInvoice.intraStateApplied}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 items-center gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-3 lg:grid-cols-[1fr_auto_1.5fr_auto_1fr]">
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs text-[var(--text-muted)]">{en.gstInvoice.taxable}</p>
            <p className="text-lg font-semibold">{en.common.rupeeSymbol} {item.taxableValue.toFixed(2)}</p>
          </div>

          <FaPlus size={20} className="mx-auto" />

          <div className="flex flex-1 flex-wrap items-center justify-center gap-3 sm:gap-4">
            {isInterState ? (
              <div className="text-center">
                <p className="text-xs text-purple-600">{en.gstInvoice.igst} ({formatTaxRate(item.igstRate)})</p>
                <p className="text-lg font-semibold text-purple-500">{en.common.rupeeSymbol} {item.igstAmount.toFixed(2)}</p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-xs text-emerald-600">{en.gstInvoice.cgst} ({formatTaxRate(item.cgstRate)})</p>
                  <p className="text-lg font-semibold text-emerald-500">{en.common.rupeeSymbol} {item.cgstAmount.toFixed(2)}</p>
                </div>

                <FaPlus size={20} className="mx-auto" />

                <div className="text-center">
                  <p className="text-xs text-blue-600">{en.gstInvoice.sgstUtgst} ({formatTaxRate(item.sgstRate)})</p>
                  <p className="text-lg font-semibold text-blue-500">{en.common.rupeeSymbol} {item.sgstAmount.toFixed(2)}</p>
                </div>
              </>
            )}
          </div>

          <FaEquals size={20} className="mx-auto" />

          <div className="flex-1 text-center md:text-right">
            <p className="text-xs text-[var(--text-muted)]">{en.gstInvoice.total}</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{en.common.rupeeSymbol} {item.total.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
