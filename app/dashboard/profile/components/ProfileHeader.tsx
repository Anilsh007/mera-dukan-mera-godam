import { MdEdit, MdDownload } from "react-icons/md"
import Button from "@/app/components/ui/Button"

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
  const activeSince = data.updatedAt
    ? new Date(data.updatedAt).toLocaleDateString("en-IN")
    : "not synced yet"

  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:flex-row sm:items-center sm:p-6">
      <div className="flex min-w-0 items-center gap-4">
        {data.personal.photoURL ? (
          <img src={data.personal.photoURL} alt="Profile" className="w-20 h-20 rounded-full border-4 border-emerald-100 dark:border-emerald-900 object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-3xl font-bold text-emerald-600">
            {data.personal.displayName?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{data.business.shopName || "Your Shop"}</h2>
          <p className="text-[var(--text-muted)] capitalize">{data.business.businessType} Business</p>
          <div className="flex items-center gap-2 mt-1 text-sm text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Active since {activeSince}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 sm:flex">
        <Button variant="outline" icon={<MdDownload />} title="Card" onClick={onDownloadCard} />
        <Button variant="primary" icon={<MdEdit />} title="Edit Profile" onClick={onEdit} />
      </div>
    </div>
  )
}
