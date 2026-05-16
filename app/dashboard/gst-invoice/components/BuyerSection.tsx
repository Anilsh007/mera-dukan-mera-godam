import Input from "@/app/components/ui/Input";
import type { BuyerSectionProps } from "../types/ui.types";
import { en } from "@/app/messages/en";

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
    {
      label: en.gstInvoice.buyerBusinessName,
      value: buyer.name,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("name", e.target.value),
      datalist: "buyer-name",
    },
    {
      label: en.gstInvoice.gstin,
      value: buyer.gstin || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("gstin", e.target.value),
      datalist: "buyer-gstin",
    },
    {
      label: en.profile.state,
      value: buyer.state || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("state", e.target.value),
    },
    {
      label: en.gstInvoice.billingAddress,
      value: buyer.address || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("address", e.target.value),
    },
    {
      label: en.gstInvoice.cityDistrict,
      value: buyer.city || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("city", e.target.value),
    },
    {
      label: en.profile.pinCode,
      value: buyer.pincode || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("pincode", e.target.value),
    },
    {
      label: en.profile.phone,
      value: buyer.phone || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("phone", e.target.value),
      datalist: "buyer-phone",
    },
    {
      label: en.profile.email,
      value: buyer.email || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onBuyerChange("email", e.target.value),
      datalist: "buyer-email",
    },
  ];

  const shippingForm = [
    {
      label: en.gstInvoice.shippingAddress,
      value: shippingAddress.address || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onShippingAddressChange("address", e.target.value),
    },
    {
      label: en.gstInvoice.cityDistrict,
      value: shippingAddress.city || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onShippingAddressChange("city", e.target.value),
    },
    {
      label: en.profile.state,
      value: shippingAddress.state || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onShippingAddressChange("state", e.target.value),
    },
    {
      label: en.profile.pinCode,
      value: shippingAddress.pincode || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onShippingAddressChange("pincode", e.target.value),
    },
  ];

  return (
    <section className="space-y-5">
      <div>
        <h3>{en.gstInvoice.buyerDetails}</h3>

        <datalist id="buyer-name">
          {suggestions.map((suggestion) => (
            <option key={suggestion.key} value={suggestion.buyer.name} />
          ))}
        </datalist>
        <datalist id="buyer-gstin">
          {suggestions
            .filter((suggestion) => suggestion.buyer.gstin)
            .map((suggestion) => (
              <option key={`${suggestion.key}-gstin`} value={suggestion.buyer.gstin} />
            ))}
        </datalist>
        <datalist id="buyer-phone">
          {suggestions
            .filter((suggestion) => suggestion.buyer.phone)
            .map((suggestion) => (
              <option key={`${suggestion.key}-phone`} value={suggestion.buyer.phone} />
            ))}
        </datalist>
        <datalist id="buyer-email">
          {suggestions
            .filter((suggestion) => suggestion.buyer.email)
            .map((suggestion) => (
              <option key={`${suggestion.key}-email`} value={suggestion.buyer.email} />
            ))}
        </datalist>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">{en.gstInvoice.shippingAddress}</h4>
            <p className="text-xs text-[var(--text-muted)]">{en.gstInvoice.shippingHint}</p>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={shippingSameAsBilling}
              onChange={(e) => onShippingSameChange(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-input)]"
            />
            {en.gstInvoice.sameAsBilling}
          </label>
        </div>

        {!shippingSameAsBilling && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
