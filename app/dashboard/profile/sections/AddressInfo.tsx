import Input from "@/app/components/ui/Input"
import { MdLocationOn } from "react-icons/md"
import SectionCard from "../components/SectionCard"

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
    <SectionCard title="Address" icon={<MdLocationOn />} iconColor="text-amber-500">
      <div className="space-y-4">
        <Input label="Full Address" placeholder="Street, Landmark, etc." value={data.address} onChange={(e) => onChange("address", e.target.value)} />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="District/City" placeholder="City name" value={data.district} onChange={(e) => onChange("district", e.target.value)} />
        
          <Input label="State" placeholder="State" value={data.state} onChange={(e) => onChange("state", e.target.value)} />
          
          <Input label="Pin Code" placeholder="6 digits" value={data.pincode} onChange={(e) => onChange("pincode", e.target.value)}/>
        </div>
      </div>
    </SectionCard>
  )
}
