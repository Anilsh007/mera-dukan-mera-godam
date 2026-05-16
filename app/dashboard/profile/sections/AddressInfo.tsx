import Input from "@/app/components/ui/Input"
import { MdLocationOn } from "react-icons/md"
import SectionCard from "../components/SectionCard"
import { en } from "@/app/messages/en"

interface Props {
  data: {
    address: string
    district: string
    state: string
    pincode: string
  }
  onChange: (field: string, value: string) => void
}

export default function AddressInfo({ data, onChange }: Props) {
  return (
    <SectionCard title={en.profile.address} icon={<MdLocationOn />} iconColor="text-amber-500">
      <div className="space-y-4">
        <Input label={en.profile.fullAddress} placeholder={en.profile.streetPlaceholder} value={data.address} onChange={(e) => onChange("address", e.target.value)} />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label={en.profile.districtCity} placeholder={en.profile.cityPlaceholder} value={data.district} onChange={(e) => onChange("district", e.target.value)} />
        
          <Input label={en.profile.state} placeholder={en.profile.state} value={data.state} onChange={(e) => onChange("state", e.target.value)} />
          
          <Input label={en.profile.pinCode} placeholder={en.profile.pincodePlaceholder} value={data.pincode} onChange={(e) => onChange("pincode", e.target.value)}/>
        </div>
      </div>
    </SectionCard>
  )
}
