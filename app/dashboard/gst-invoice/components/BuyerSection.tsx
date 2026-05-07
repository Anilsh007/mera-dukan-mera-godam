import Input from "@/app/components/utility/CommonInput";
import type { BuyerSectionProps } from "../types/ui.types";

export default function BuyerSection({
  buyer,
  shippingAddress,
  shippingSameAsBilling,
  onBuyerChange,
  onShippingAddressChange,
  onShippingSameChange,
  suggestions,
}: BuyerSectionProps) {

  const buyerForm = [
    { label: "Buyer Name/Business Name", value: buyer.name, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("name", e.target.value), datalist: "buyer-name" },
    { label: "GSTIN", value: buyer.gstin || "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("gstin", e.target.value) },
    { label: "State", value: buyer.state || "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("state", e.target.value) },
    { label: "Billing Address", value: buyer.address || "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("address", e.target.value) },
    { label: "City / District", value: buyer.city || "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("city", e.target.value) },
    { label: "Pin Code", value: buyer.pincode || "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("pincode", e.target.value) },
    { label: "Phone", value: buyer.phone || "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("phone", e.target.value) },
    { label: "Email", value: buyer.email || "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("email", e.target.value) },
  ]

  const shippingForm = [
    { label: "Shipping Address", value: shippingAddress.address || "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onShippingAddressChange("address", e.target.value) },
    { label: "City / District", value: shippingAddress.city || "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onShippingAddressChange("city", e.target.value) },
    { label: "State", value: shippingAddress.state || "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onShippingAddressChange("state", e.target.value) },
    { label: "Pin Code", value: shippingAddress.pincode || "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onShippingAddressChange("pincode", e.target.value) },
  ]

  return (
    <section className="space-y-5">
      <div>
        <h3>Buyer Details</h3>

        <datalist id="buyer-name">
          {suggestions.map((s) => (
            <option key={s.key} value={s.buyer.name} />
          ))}
        </datalist>

        <div className="grid md:grid-cols-4 gap-3 mt-4">
          {buyerForm.map((input, index) => (
            <Input
              key={index}
              label={input.label}
              value={input.value}
              onChange={input.onChange}
              datalist={input.datalist}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">Shipping Address</h4>
            <p className="text-xs text-[var(--text-muted)]">Invoice preview me alag shipping section tabhi dikhega jab address billing se different ho.</p>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={shippingSameAsBilling}
              onChange={(e) => onShippingSameChange(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-input)]"
            />
            Same as billing
          </label>
        </div>

        {!shippingSameAsBilling && (
          <div className="mt-4 grid md:grid-cols-4 gap-3">
            {shippingForm.map((input, index) => (
              <Input
                key={index}
                label={input.label}
                value={input.value}
                onChange={input.onChange}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
