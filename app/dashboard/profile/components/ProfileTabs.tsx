import { MdPerson, MdBusiness, MdLocationOn } from "react-icons/md"
import { en } from "@/app/messages/en"

type TabType = 'overview' | 'business' | 'address'

interface Props {
  activeTab: TabType
  onChange: (tab: TabType) => void
}

const tabs = [
  { key: 'overview', label: en.profile.overview, icon: MdPerson },
  { key: 'business', label: en.profile.businessDetails, icon: MdBusiness },
  { key: 'address', label: en.profile.addressAndBank, icon: MdLocationOn },
] as const

export default function ProfileTabs({ activeTab, onChange }: Props) {
  return (
    <div className="filter-scroll border-b border-[var(--border-card)]" role="tablist" aria-label={en.profile.profileSections}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === tab.key 
              ? 'border-emerald-500 text-emerald-600' 
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <tab.icon size={18} aria-hidden="true" />
          {tab.label}
        </button>
      ))}
    </div>
  )
}
