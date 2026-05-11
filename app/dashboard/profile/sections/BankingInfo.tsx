import Input from "@/app/components/ui/Input"
import { MdAccountBalance } from "react-icons/md"
import SectionCard from "../components/SectionCard"

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
    <SectionCard title="Bank Details (Optional)" icon={<MdAccountBalance />} iconColor="text-purple-500">
      <p className="text-sm text-[var(--text-muted)] mb-4">Invoices par dikhane ke liye</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Account Holder Name" value={data.accountHolderName} onChange={(e) => onChange("accountHolderName", e.target.value)} />
        <Input label="Account Number" type="password" value={data.accountNumber} onChange={(e) => onChange("accountNumber", e.target.value)} />
        <Input label="IFSC Code" placeholder="SBIN0001234" value={data.ifscCode} onChange={(e) => onChange("ifscCode", e.target.value.toUpperCase())} />
        <Input label="Bank Name" value={data.bankName} onChange={(e) => onChange("bankName", e.target.value)} />
      </div>
    </SectionCard>
  )
}
