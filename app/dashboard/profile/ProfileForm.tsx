"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import Button from "@/app/components/utility/Button"
import { MdSave, MdClose } from "react-icons/md"
import PersonalInfo from "./sections/PersonalInfo"
import BusinessInfo from "./sections/BusinessInfo"
import AddressInfo from "./sections/AddressInfo"
import BankingInfo from "./sections/BankingInfo"
import TermsSection from "./sections/TermsSection"
import { ProfileSaveResult, ProfileState } from "./useProfile"


interface ProfileFormProps {
  initialData: ProfileState
  onSave: (data: ProfileState) => Promise<ProfileSaveResult>
  onCancel: () => void
}

export default function ProfileForm({ initialData, onSave, onCancel }: ProfileFormProps) {
  const [profile, setProfile] = useState<ProfileState>(initialData)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setProfile(initialData)
  }, [initialData])

  const handleChange = (section: keyof ProfileState, field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, any>),
        [field]: value,
      },
    }))
  }

  const validate = () => {
    const { business, personal, address } = profile
    if (personal.phone && !/^[6-9]\d{9}$/.test(personal.phone)) {
      toast.error("Phone number sahi nahi hai")
      return false
    }
    if (business.gstNumber) {
      const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
      if (!regex.test(business.gstNumber.toUpperCase())) {
        toast.error("GST number format sahi nahi hai")
        return false
      }
    }
    if (address.pincode && !/^\d{6}$/.test(address.pincode)) {
      toast.error("Pin code 6 digits ka hona chahiye")
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validate()) return

    setSaving(true)
    try {
      await onSave(profile)
    } catch (error) {
      toast.error("Save karne mein error aaya")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <PersonalInfo data={profile.personal} onChange={(field, value) => handleChange("personal", field, value)} />

      <BusinessInfo data={profile.business} onChange={(field, value) => handleChange("business", field, value)} />

      <AddressInfo data={profile.address} onChange={(field, value) => handleChange("address", field, value)} />

      <BankingInfo data={profile.banking} onChange={(field, value) => handleChange("banking", field, value)} />

      <TermsSection value={profile.settings.termsAndConditions} onChange={(val) => handleChange("settings", "termsAndConditions", val)} />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-[var(--bg-card-strong)] backdrop-blur-xl border border-[var(--border-card)] shadow-lg rounded-full px-6 py-3 z-50">
        <Button variant="outline" icon={<MdClose />} title="Cancel" onClick={onCancel} />
        <Button onClick={handleSave} variant="primary" icon={<MdSave />} title={saving ? "Saving..." : "Save Changes"} loading={saving} disabled={saving} />
      </div>
    </div>
  )
}
