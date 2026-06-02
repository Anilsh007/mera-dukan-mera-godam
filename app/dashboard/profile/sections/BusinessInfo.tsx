import Input from "@/app/components/ui/Input"
import SelectField from "@/app/components/ui/SelectField"
import { MdBusiness } from "react-icons/md"
import SectionCard from "../components/SectionCard"
import { en } from "@/app/messages/en"

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
  { value: "retail", label: en.profile.businessTypes.retail },
  { value: "wholesale", label: en.profile.businessTypes.wholesale },
  { value: "manufacturing", label: en.profile.businessTypes.manufacturing },
  { value: "services", label: en.profile.businessTypes.services },
  { value: "ecommerce", label: en.profile.businessTypes.ecommerce },
  { value: "food_beverage", label: en.profile.businessTypes.foodBeverage },
  { value: "healthcare", label: en.profile.businessTypes.healthcare },
  { value: "construction", label: en.profile.businessTypes.construction },
  { value: "transportation", label: en.profile.businessTypes.transportation },
  { value: "real_estate", label: en.profile.businessTypes.realEstate },
  { value: "education", label: en.profile.businessTypes.education },
  { value: "other", label: en.profile.businessTypes.other },
]

export default function BusinessInfo({ data, onChange }: Props) {
  return (
    <SectionCard title={en.profile.businessSectionTitle} icon={<MdBusiness />} iconColor="text-emerald-500">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input
          label={<>{en.profile.shopName} <span className="text-red-500">*</span></>}
          placeholder={en.profile.shopNamePlaceholder}
          value={data.shopName}
          onChange={(e) => onChange("shopName", e.target.value)}
        />

        <Input
          label={en.profile.gstOptional}
          placeholder={en.profile.gstPlaceholder}
          value={data.gstNumber}
          onChange={(e) => onChange("gstNumber", e.target.value.toUpperCase())}
        />

        <SelectField
          label={en.profile.businessType}
          value={data.businessType}
          onChange={(e) => onChange("businessType", e.target.value)}
          options={BUSINESS_TYPES}
        />

        <Input
          label={en.profile.upiOptional}
          placeholder={en.profile.upiPlaceholder}
          value={data.upiId}
          onChange={(e) => onChange("upiId", e.target.value)}
        />

        <Input
          label={en.profile.invoicePrefix}
          placeholder={en.profile.invoicePrefixPlaceholder}
          value={data.invoicePrefix}
          onChange={(e) => onChange("invoicePrefix", e.target.value)}
        />
      </div>
    </SectionCard>
  )
}
