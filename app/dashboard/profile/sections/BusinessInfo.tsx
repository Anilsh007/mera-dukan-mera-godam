import Input from "@/app/components/ui/Input"
import { MdBusiness } from "react-icons/md"
import SectionCard from "../components/SectionCard"

interface Props {
  data: {
    shopName: string
    gstNumber: string
    businessType: string
    upiId: string
    invoicePrefix: string
    logoUrl?: string
  }
  onChange: (field: string, value: string) => void
}

const BUSINESS_TYPES = [
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "services", label: "Services" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "healthcare", label: "Healthcare" },
  { value: "construction", label: "Construction" },
  { value: "transportation", label: "Transportation & Logistics" },
  { value: "real_estate", label: "Real Estate" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
]

export default function BusinessInfo({ data, onChange }: Props) {
  return (
    <SectionCard title="Business Details" icon={<MdBusiness />} iconColor="text-emerald-500">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input
          label={<>Shop Name <span className="text-red-500">*</span></>}
          placeholder="Aapke dukan ka naam"
          value={data.shopName}
          onChange={(e) => onChange("shopName", e.target.value)}
        />

        <Input
          label="GST Number (Optional)"
          placeholder="22AAAAA0000A1Z5"
          value={data.gstNumber}
          onChange={(e) => onChange("gstNumber", e.target.value.toUpperCase())}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Business Type</label>
          <select
            value={data.businessType}
            onChange={(e) => onChange("businessType", e.target.value)}
            className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {BUSINESS_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="UPI ID (Optional)"
          placeholder="yourname@upi"
          value={data.upiId}
          onChange={(e) => onChange("upiId", e.target.value)}
        />

        <Input
          label="Invoice Prefix"
          placeholder="INV"
          value={data.invoicePrefix}
          onChange={(e) => onChange("invoicePrefix", e.target.value)}
        />
      </div>
    </SectionCard>
  )
}
