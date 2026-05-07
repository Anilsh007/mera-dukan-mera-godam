import { MdEdit, MdDownload } from "react-icons/md"
import Button from "@/app/components/utility/Button"

interface Props {
  data: {
    personal: { displayName: string; photoURL: string }
    business: { shopName: string; businessType: string; logoUrl?: string }
    updatedAt?: string
  }
  onEdit: () => void
  onDownloadCard: () => void
}

export default function ProfileHeader({ data, onEdit, onDownloadCard }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-card-strong)] backdrop-blur-xl border border-[var(--border-card)] rounded-2xl p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-4">
        {data.personal.photoURL ? (
          <img src={data.personal.photoURL} alt="Profile" className="w-20 h-20 rounded-full border-4 border-emerald-100 dark:border-emerald-900 object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-3xl font-bold text-emerald-600">
            {data.personal.displayName?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{data.business.shopName || "Your Shop"}</h2>
          <p className="text-[var(--text-muted)] capitalize">{data.business.businessType} Business</p>
          <div className="flex items-center gap-2 mt-1 text-sm text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Active since {new Date(data.updatedAt || Date.now()).toLocaleDateString('en-IN')}</span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" icon={<MdDownload />} title="Card" onClick={onDownloadCard} />
        <Button variant="primary" icon={<MdEdit />} title="Edit Profile" onClick={onEdit} />
      </div>
    </div>
  )
}
