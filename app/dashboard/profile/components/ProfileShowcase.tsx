"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import ProfileHeader from "../components/ProfileHeader"
import ProfileTabs from "./ProfileTabs"
import OverviewTab from "../tabs/OverviewTab"
import BusinessTab from "../tabs/BusinessTab"
import AddressTab from "../tabs/AddressTab"
import BusinessCard from "./BusinessCard"
import { ProfileData } from "@/app/lib/profile.service"

interface Props {
  data: ProfileData
  onEdit: () => void
}

export default function ProfileShowcase({ data, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'business' | 'address'>('overview')

  const handleDownloadCard = () => {
    // This is handled inside BusinessCard component
    document.getElementById('download-card-btn')?.click()
  }

  return (
    <div className="space-y-6">
      <ProfileHeader 
        data={{
          personal: data.personal,
          business: data.business,
          updatedAt: data.updatedAt
        }}
        onEdit={onEdit}
        onDownloadCard={handleDownloadCard}
      />

      <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <OverviewTab 
              data={data} 
              onViewBusiness={() => setActiveTab('business')} 
            />
          )}
          {activeTab === 'business' && <BusinessTab data={data} />}
          {activeTab === 'address' && <AddressTab data={data} />}
        </div>

        <div className="lg:col-span-1">
          <BusinessCard data={data} />
        </div>
      </div>

      <div className="text-center text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border-card)]">
        Last synced: {data.updatedAt ? new Date(data.updatedAt).toLocaleString('en-IN') : 'Never'}
      </div>

      <div className="p-4 bg-[var(--bg-card-strong)] backdrop-blur-xl border border-[var(--border-card)] rounded-2xl text-center w-fit mx-auto">
        <QRCodeSVG value={`upi://pay?pa=${data.business.upiId}&pn=${data.business.shopName}`} size={128} />
      </div>
    </div>
  )
}
