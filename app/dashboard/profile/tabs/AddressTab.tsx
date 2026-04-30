import { MdLocationOn, MdAccountBalance } from "react-icons/md"
import InfoItem from "../components/InfoItem"

interface Props {
  data: {
    business: { shopName: string }
    address: { address: string; district: string; state: string; pincode: string }
    banking: { accountHolderName: string; accountNumber: string; ifscCode: string; bankName: string }
  }
}

export default function AddressTab({ data }: Props) {
  const maskAccountNumber = (acc: string) => {
    if (!acc || acc.length < 4) return "****"
    return "****" + acc.slice(-4)
  }

  return (
    <div className="space-y-6">
      {/* Address */}
      <div className="bg-[var(--bg-card-strong)] backdrop-blur-xl border border-[var(--border-card)] rounded-2xl p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 mb-6 text-[var(--text-primary)]">
          <MdLocationOn className="text-amber-500" size={20} />
          <h3 className="font-bold text-lg">Address Details</h3>
        </div>
        
        <div className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-card)]">
          <p className="text-lg font-medium text-[var(--text-primary)] mb-2">{data.business.shopName}</p>
          <p className="text-[var(--text-secondary)] whitespace-pre-wrap mb-4">{data.address.address}</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm">{data.address.district}</span>
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm">{data.address.state}</span>
            <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-mono">PIN: {data.address.pincode}</span>
          </div>
        </div>
      </div>

      {/* Banking */}
      <div className="bg-[var(--bg-card-strong)] backdrop-blur-xl border border-[var(--border-card)] rounded-2xl p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 mb-6 text-[var(--text-primary)]">
          <MdAccountBalance className="text-purple-500" size={20} />
          <h3 className="font-bold text-lg">Banking Information</h3>
          <span className="ml-auto text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 px-2 py-1 rounded">Private</span>
        </div>
        
        {data.banking.accountNumber ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="Account Holder" value={data.banking.accountHolderName} />
            <InfoItem label="Bank Name" value={data.banking.bankName} />
            <InfoItem label="Account Number" value={maskAccountNumber(data.banking.accountNumber)} />
            <InfoItem label="IFSC Code" value={data.banking.ifscCode} mono />
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--text-muted)]"><p>No banking details added yet</p></div>
        )}
      </div>
    </div>
  )
}
