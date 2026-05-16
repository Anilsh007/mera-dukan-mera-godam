"use client"

import { useState, useEffect } from "react"
import { notify as toast } from "@/app/lib/notifications"
import Button from "@/app/components/ui/Button"
import { MdSave, MdClose } from "react-icons/md"
import PersonalInfo from "./sections/PersonalInfo"
import BusinessInfo from "./sections/BusinessInfo"
import AddressInfo from "./sections/AddressInfo"
import BankingInfo from "./sections/BankingInfo"
import TermsSection from "./sections/TermsSection"
import { ProfileSaveResult, ProfileState } from "./useProfile"
import { en } from "@/app/messages/en"


interface ProfileFormProps {
  initialData: ProfileState
  onSave: (data: ProfileState) => Promise<ProfileSaveResult>
  onCancel: () => void
}

type EditableProfileSection = "personal" | "business" | "address" | "banking" | "settings"

export default function ProfileForm({ initialData, onSave, onCancel }: ProfileFormProps) {
  const [profile, setProfile] = useState<ProfileState>(initialData)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setProfile(initialData)
  }, [initialData])

  const handleChange = (section: EditableProfileSection, field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, string | undefined>),
        [field]: value,
      },
    }))
  }

  const validate = () => {
    const { business, personal, address } = profile
    if (personal.phone && !/^[6-9]\d{9}$/.test(personal.phone)) {
      toast.error(en.profile.invalidPhone)
      return false
    }
    if (business.gstNumber) {
      const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
      if (!regex.test(business.gstNumber.toUpperCase())) {
        toast.error(en.profile.invalidGstin)
        return false
      }
    }
    if (address.pincode && !/^\d{6}$/.test(address.pincode)) {
      toast.error(en.profile.invalidPincode)
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validate()) return

    setSaving(true)
    try {
      await onSave(profile)
    } catch {
      toast.error(en.profile.saveError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-32 sm:pb-24">
      <PersonalInfo data={profile.personal} onChange={(field, value) => handleChange("personal", field, value)} />

      <BusinessInfo data={profile.business} onChange={(field, value) => handleChange("business", field, value)} />

      <AddressInfo data={profile.address} onChange={(field, value) => handleChange("address", field, value)} />

      <BankingInfo data={profile.banking} onChange={(field, value) => handleChange("banking", field, value)} />

      <TermsSection value={profile.settings.termsAndConditions} onChange={(val) => handleChange("settings", "termsAndConditions", val)} />

      <div className="fixed inset-x-3 bottom-3 z-50 flex flex-col gap-2 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-3 py-3 shadow-lg backdrop-blur-xl sm:left-1/2 sm:right-auto sm:bottom-6 sm:-translate-x-1/2 sm:flex-row sm:rounded-full sm:px-6">
        <Button variant="outline" icon={<MdClose />} title={en.profile.cancel} onClick={onCancel} />
        <Button onClick={handleSave} variant="primary" icon={<MdSave />} title={saving ? en.profile.saving : en.profile.saveChanges} loading={saving} disabled={saving} />
      </div>
    </div>
  )
}
