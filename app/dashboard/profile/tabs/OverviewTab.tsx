import { MdPerson, MdBusiness } from "react-icons/md"
import InfoItem from "../components/InfoItem"

interface Props {
  data: {
    personal: { displayName: string; email: string; phone: string; alternateEmail: string }
    business: { shopName: string; gstNumber: string; invoicePrefix: string; businessType: string }
  }
  onViewBusiness: () => void
}

export default function OverviewTab({ data, onViewBusiness }: Props) {
  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <div className="bg-[var(--bg-card-strong)] backdrop-blur-xl border border-[var(--border-card)] rounded-2xl p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 mb-4 text-[var(--text-primary)]">
          <MdPerson className="text-emerald-500" size={20} />
          <h3 className="font-bold text-lg">Personal Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Full Name" value={data.personal.displayName} />
          <InfoItem label="Email" value={data.personal.email} />
          <InfoItem label="Phone" value={data.personal.phone || "Not set"} />
          <InfoItem label="Alt. Email" value={data.personal.alternateEmail || "Not set"} />
        </div>
      </div>

      {/* Business Preview */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <MdBusiness size={20} />
            <h3 className="font-bold text-lg">Business Overview</h3>
          </div>
          <button onClick={onViewBusiness} className="text-sm text-emerald-600 hover:underline">View Details →</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4">
            <p className="text-xs text-[var(--text-muted)] uppercase">Shop Name</p>
            <p className="font-semibold text-[var(--text-primary)] text-lg">{data.business.shopName}</p>
          </div>
          <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4">
            <p className="text-xs text-[var(--text-muted)] uppercase">GST Number</p>
            <p className="font-mono font-semibold text-[var(--text-primary)]">{data.business.gstNumber || "Not registered"}</p>
          </div>
          <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4">
            <p className="text-xs text-[var(--text-muted)] uppercase">Invoice Prefix</p>
            <p className="font-semibold text-[var(--text-primary)]">{data.business.invoicePrefix}</p>
          </div>
          <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4">
            <p className="text-xs text-[var(--text-muted)] uppercase">Business Type</p>
            <p className="font-semibold text-[var(--text-primary)] capitalize">{data.business.businessType}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
