import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import { MdDeleteOutline } from "react-icons/md";
import { ItemCardProps } from "../types/ui.types";
import { FaEquals, FaPlus } from "react-icons/fa";
import { useProductSuggestions, ProductSuggestion } from "../hooks/useProductSuggestions";
import { useState } from "react";
import { CircleAlert, Info } from "lucide-react";
import { formatTaxRate } from "../lib/hsnSacLookup";

export default function ItemCard({ item, index, onChange, onRemove, isInterState, }: ItemCardProps) {

  const { suggestions } = useProductSuggestions();
  const [showDropdown, setShowDropdown] = useState(false);

  // ✅ FIXED: proper typing + onChange usage
  const handleSelectProduct = (product: ProductSuggestion) => {
    onChange(index, "name", product.value);
    onChange(index, "rate", String(product.price || 0));
    onChange(index, "unit", product.unit || "pcs");
    onChange(index, "hsnCode", product.hsnCode || "");
    setShowDropdown(false);
  };

  const filteredSuggestions = suggestions.filter((s) =>
    s.label.toLowerCase().includes(item.name?.toLowerCase() || "")
  );

  return (
    <div className="relative min-w-0 rounded-xl border p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <p>Item {index + 1}</p>
        <Button
          variant="delete"
          icon={<MdDeleteOutline />}
          onClick={() => onRemove(index)}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">

        {/* 🔥 PRODUCT INPUT + DROPDOWN */}
        <div className="relative">
          <Input label="Product" value={item.name}
            onChange={(e) => {
              onChange(index, "name", e.target.value);
              setShowDropdown(true);
            }}
          />

          {showDropdown && filteredSuggestions.length > 0 && (
            <div className="absolute z-50 w-full max-h-40 overflow-auto bg-[var(--bg-card-strong)] backdrop-blur-xl border border-[var(--border-card)] rounded-2xl shadow-[var(--shadow-card)]">
              {filteredSuggestions.map((s, i) => (
                <div
                  key={i}
                  className="p-2 hover:bg-[var(--bg-soft)] cursor-pointer"
                  onClick={() => handleSelectProduct(s)}
                >
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <Input label="HSN / SAC" value={item.hsnCode} onChange={(e) => onChange(index, "hsnCode", e.target.value)} className="pr-10" />
          {item.hsnSacDescription && (
            <div className="group absolute right-3 top-[38px]">
              <button
                type="button"
                className="rounded-full bg-sky-100 p-1 text-sky-700 shadow-sm ring-1 ring-sky-200 transition hover:bg-sky-200 hover:text-sky-900"
                aria-label="View HSN or SAC details"
              >
                <Info size={16} />
              </button>
              <div className="absolute right-0 top-full z-50 hidden max-w-[calc(100vw-2rem)] pt-2 group-hover:block">
                <div className="absolute right-3 top-[3px] h-3 w-3 rotate-45 border-l border-t border-sky-200 bg-white" />
                <div className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-sky-200 bg-white p-3 text-left shadow-xl">
                <div className="flex items-start gap-2">
                  <CircleAlert size={16} className="mt-0.5 shrink-0 text-sky-700" />
                  <div className="min-w-0 text-sm text-slate-700">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{item.hsnSacType || "GST"} Details</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">CGST {formatTaxRate(item.cgstRate)}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">SGST/UTGST {formatTaxRate(item.sgstRate)}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">IGST {formatTaxRate(item.igstRate)}</span>
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
        <Input label="Rate" type="number" value={String(item.rate)} onChange={(e) => onChange(index, "rate", e.target.value)} />
        <Input label="Qty" type="number" value={String(item.quantity)} onChange={(e) => onChange(index, "quantity", e.target.value)} />
        <Input label="Discount (₹)" type="number" value={String(item.discount)} onChange={(e) => onChange(index, "discount", e.target.value)} />
        <Input label="Expiry Date" type="date" value={String(item.expiry)} onChange={(e) => onChange(index, "expiry", e.target.value)} />
      </div>

      {/* 🔥 TAX UI SAME AS BEFORE */}
      <div className="mt-4 space-y-4">

        {/* 🔹 Tax Type Badge */}
        <div className="text-xs font-medium">
          {isInterState ? (
            <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700">
              Inter-state • IGST applied
            </span>
          ) : (
            <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
              Intra-state • CGST + SGST
            </span>
          )}
        </div>

        {/* 🔥 MAIN TAX ROW */}
        <div className="flex flex-col gap-3 rounded-xl border bg-[var(--bg-input)] p-3 md:flex-row md:items-center md:justify-between">

          {/* LEFT: Taxable */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs text-[var(--text-muted)]">Taxable</p>
            <p className="text-lg font-semibold">
              ₹ {item.taxableValue.toFixed(2)}
            </p>
          </div>

          {/* PLUS */}
          <FaPlus size={20} />

          {/* TAX SECTION */}
          <div className="flex flex-1 flex-wrap items-center justify-center gap-3 sm:gap-4">

            {isInterState ? (
                <div className="text-center">
                  <p className="text-xs text-purple-400">IGST ({formatTaxRate(item.igstRate)})</p>
                  <p className="text-lg font-semibold text-purple-500">
                    ₹ {item.igstAmount.toFixed(2)}
                  </p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-xs text-emerald-400">CGST ({formatTaxRate(item.cgstRate)})</p>
                  <p className="text-lg font-semibold text-emerald-500">
                    ₹ {item.cgstAmount.toFixed(2)}
                  </p>
                </div>

                <FaPlus size={20} />

                <div className="text-center">
                  <p className="text-xs text-blue-400">SGST/UTGST ({formatTaxRate(item.sgstRate)})</p>
                  <p className="text-lg font-semibold text-blue-500">
                    ₹ {item.sgstAmount.toFixed(2)}
                  </p>
                </div>
              </>
            )}
          </div>

          <FaEquals size={20} />

          {/* RIGHT: TOTAL */}
          <div className="flex-1 text-center md:text-right">
            <p className="text-xs text-[var(--text-muted)]">Total</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              ₹ {item.total.toFixed(2)}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
