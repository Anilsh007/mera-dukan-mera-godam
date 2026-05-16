import { MdBusiness, MdQrCode } from "react-icons/md"
import InfoItem from "../components/InfoItem"
import { en } from "@/app/messages/en"

interface Props {
  data: {
    business: { shopName: string; gstNumber: string; businessType: string; invoicePrefix: string; upiId: string; logoUrl?: string }
    settings: { termsAndConditions: string }
  }
}

export default function BusinessTab({ data }: Props) {
  return (
    <div className="space-y-6">
      <div className="premium-surface min-w-0 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-6 text-[var(--text-primary)]">
          <MdBusiness className="text-emerald-500" size={20} />
          <h3 className="font-bold text-lg">{en.profile.completeBusinessDetails}</h3>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label={en.profile.shopName} value={data.business.shopName} highlight />
            <InfoItem label={en.profile.businessType} value={data.business.businessType} highlight />
            <InfoItem label={en.profile.gstNumber} value={data.business.gstNumber} />
            <InfoItem label={en.profile.invoicePrefix} value={data.business.invoicePrefix} />
          </div>
          
          {data.business.upiId && (
            <div className="border-t border-[var(--border-card)] pt-6">
              <div className="flex items-center gap-3 mb-3">
                <MdQrCode className="text-emerald-500" size={24} />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{en.profile.upiPaymentId}</p>
                  <p className="text-xl font-mono font-bold text-emerald-600">{data.business.upiId}</p>
                </div>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{en.profile.upiPaymentHint}</p>
            </div>
          )}
        </div>
      </div>

      <div className="premium-surface min-w-0 rounded-2xl p-4 sm:p-6">
        <h3 className="font-bold text-[var(--text-primary)] mb-3">{en.profile.invoiceTerms}</h3>
        <p className="text-sm text-[var(--text-secondary)] italic border-l-4 border-emerald-500 pl-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-r-xl">
          &quot;{data.settings.termsAndConditions}&quot;
        </p>
      </div>
    </div>
  )
}
