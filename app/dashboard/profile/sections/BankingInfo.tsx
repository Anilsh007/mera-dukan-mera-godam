import Input from "@/app/components/ui/Input"
import { MdAccountBalance } from "react-icons/md"
import SectionCard from "../components/SectionCard"
import { en } from "@/app/messages/en"

interface Props {
  data: {
    accountHolderName: string
    accountNumber: string
    ifscCode: string
    bankName: string
  }
  onChange: (field: string, value: string) => void
}

export default function BankingInfo({ data, onChange }: Props) {
  return (
    <SectionCard title={en.profile.bankDetailsOptional} icon={<MdAccountBalance />} iconColor="text-purple-500">
      <p className="text-sm text-[var(--text-muted)] mb-4">{en.profile.bankHint}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label={en.profile.accountHolderName} value={data.accountHolderName} onChange={(e) => onChange("accountHolderName", e.target.value)} />
        <Input label={en.profile.accountNumber} type="password" value={data.accountNumber} onChange={(e) => onChange("accountNumber", e.target.value)} />
        <Input label={en.profile.ifscCode} placeholder={en.profile.ifscPlaceholder} value={data.ifscCode} onChange={(e) => onChange("ifscCode", e.target.value.toUpperCase())} />
        <Input label={en.profile.bankName} value={data.bankName} onChange={(e) => onChange("bankName", e.target.value)} />
      </div>
    </SectionCard>
  )
}
