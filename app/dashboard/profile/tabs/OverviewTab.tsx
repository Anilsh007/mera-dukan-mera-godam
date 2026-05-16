import { MdPerson, MdBusiness } from "react-icons/md"
import InfoItem from "../components/InfoItem"
import { en } from "@/app/messages/en"

interface Props {
  data: {
    personal: { displayName: string; email: string; phone: string; alternateEmail: string }
    business: { shopName: string; gstNumber: string; invoicePrefix: string; businessType: string; logoUrl?: string }
  }
  onViewBusiness: () => void
}

export default function OverviewTab({ data, onViewBusiness }: Props) {
  return (
    <div className="space-y-6">
      <div className="premium-surface min-w-0 rounded-2xl p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-[var(--text-primary)]">
          <MdPerson className="text-emerald-500" size={20} aria-hidden="true" />
          <h3 className="text-lg font-bold">{en.profile.personalInformation}</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoItem label={en.profile.fullName} value={data.personal.displayName} />
          <InfoItem label={en.profile.email} value={data.personal.email} />
          <InfoItem label={en.profile.phone} value={data.personal.phone || en.profile.notSet} />
          <InfoItem label={en.profile.alternateEmail} value={data.personal.alternateEmail || en.profile.notSet} />
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 p-6 dark:border-emerald-800">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <MdBusiness size={20} aria-hidden="true" />
            <h3 className="text-lg font-bold">{en.profile.businessOverview}</h3>
          </div>
          <button type="button" onClick={onViewBusiness} className="text-sm text-emerald-600 hover:underline">
            {en.profile.viewDetails}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
          <div className="rounded-xl bg-white/50 p-4 dark:bg-black/20">
            <p className="text-xs uppercase text-[var(--text-muted)]">{en.profile.shopName}</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{data.business.shopName}</p>
          </div>
          <div className="rounded-xl bg-white/50 p-4 dark:bg-black/20">
            <p className="text-xs uppercase text-[var(--text-muted)]">{en.profile.gstNumber}</p>
            <p className="font-mono font-semibold text-[var(--text-primary)]">
              {data.business.gstNumber || en.profile.notRegistered}
            </p>
          </div>
          <div className="rounded-xl bg-white/50 p-4 dark:bg-black/20">
            <p className="text-xs uppercase text-[var(--text-muted)]">{en.profile.invoicePrefix}</p>
            <p className="font-semibold text-[var(--text-primary)]">{data.business.invoicePrefix}</p>
          </div>
          <div className="rounded-xl bg-white/50 p-4 dark:bg-black/20">
            <p className="text-xs uppercase text-[var(--text-muted)]">{en.profile.businessType}</p>
            <p className="capitalize font-semibold text-[var(--text-primary)]">{data.business.businessType}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
