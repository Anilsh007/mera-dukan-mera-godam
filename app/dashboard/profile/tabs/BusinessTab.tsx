import { MdBusiness, MdQrCode } from "react-icons/md"
import InfoItem from "../components/InfoItem"

interface Props {
  data: {
    business: { shopName: string; gstNumber: string; businessType: string; invoicePrefix: string; upiId: string; logoUrl?: string }
    settings: { termsAndConditions: string }
  }
}

export default function BusinessTab({ data }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-6">
        <div className="flex items-center gap-2 mb-6 text-[var(--text-primary)]">
          <MdBusiness className="text-emerald-500" size={20} />
          <h3 className="font-bold text-lg">Complete Business Details</h3>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Shop Name" value={data.business.shopName} highlight />
            <InfoItem label="Business Type" value={data.business.businessType} highlight />
            <InfoItem label="GST Number" value={data.business.gstNumber} />
            <InfoItem label="Invoice Prefix" value={data.business.invoicePrefix} />
          </div>
          
          {data.business.upiId && (
            <div className="border-t border-[var(--border-card)] pt-6">
              <div className="flex items-center gap-3 mb-3">
                <MdQrCode className="text-emerald-500" size={24} />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">UPI Payment ID</p>
                  <p className="text-xl font-mono font-bold text-emerald-600">{data.business.upiId}</p>
                </div>
              </div>
              <p className="text-sm text-[var(--text-muted)]">Customers can pay using this UPI ID on invoices</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-6">
        <h3 className="font-bold text-[var(--text-primary)] mb-3">Invoice Terms & Conditions</h3>
        <p className="text-sm text-[var(--text-secondary)] italic border-l-4 border-emerald-500 pl-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-r-xl">
          &quot;{data.settings.termsAndConditions}&quot;
        </p>
      </div>
    </div>
  )
}
