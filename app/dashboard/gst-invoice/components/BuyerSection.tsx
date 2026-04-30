import Input from "@/app/components/utility/CommonInput";
import type { BuyerSectionProps } from "../types/ui.types";

export default function BuyerSection({
  buyer,
  onChange,
  suggestions,
}: BuyerSectionProps) {
  return (
    <section>
      <h3>Buyer Details</h3>

      <datalist id="buyer-name">
        {suggestions.map((s) => (
          <option key={s.key} value={s.buyer.name} />
        ))}
      </datalist>

      <div className="grid md:grid-cols-4 gap-3 mt-4">
        <Input
          label="Buyer Name/Business Name"
          value={buyer.name}
          onChange={(e) => onChange("name", e.target.value)}
          datalist="buyer-name"
        />
        <Input
          label="GSTIN"
          value={buyer.gstin || ""}
          onChange={(e) => onChange("gstin", e.target.value)}
        />
        <Input
          label="State"
          value={buyer.state || ""}
          onChange={(e) => onChange("state", e.target.value)}
        />
        <Input
          label="Billing Address"
          value={buyer.address || ""}
          onChange={(e) => onChange("address", e.target.value)}
        />
        <Input
          label="Phone"
          value={buyer.phone || ""}
          onChange={(e) => onChange("phone", e.target.value)}
        />
        <Input
          label="Email"
          value={buyer.email || ""}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </div>
    </section>
  );
}
