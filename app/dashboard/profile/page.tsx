"use client"

import { useEffect, useState } from "react"
import { MdArrowBack, MdEdit } from "react-icons/md"
import { toast } from "sonner"
import Button from "@/app/components/utility/Button"
import ProfileForm from "./ProfileForm"
import ProfileShowcase from "./components/ProfileShowcase"
import useProfile from "./useProfile"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const { profile, loading, saveProfile } = useProfile()

  useEffect(() => {
    if (!loading && !profile.business?.shopName) {
      setIsEditing(true)
    }
  }, [loading, profile.business?.shopName])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  const isProfileEmpty = !profile.business?.shopName

  const handleSave = async (data: typeof profile) => {
    try {
      const result = await saveProfile(data)

      if (result.cloudSyncSkipped) {
        toast.success("Profile local database me save ho gaya")
        toast.warning("Cloud sync abhi Supabase policy ki wajah se blocked hai")
      } else {
        toast.success("Profile saved in database")
      }

      setIsEditing(false)
      return result
    } catch (error: any) {
      toast.error(error.message || "Save failed")
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {isEditing ? (
        <div className="flex items-center justify-between rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-2 shadow-[var(--shadow-card)]">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {isEditing ? "" : "Business Profile"}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {isEditing
                ? "Update your business information. This will help us personalize your experience and generate accurate invoices."
                : ""}
            </p>
          </div>

          {!isProfileEmpty && (
            <Button variant={isEditing ? "outline" : "primary"} icon={isEditing ? <MdArrowBack /> : <MdEdit />} title={isEditing ? "Back to Profile" : "Edit Profile"} onClick={() => setIsEditing((prev) => !prev)} />
          )}
        </div>
      ) : ("")}

      <div className="min-h-[500px]">
        {isEditing ? (
          <ProfileForm initialData={profile} onSave={handleSave}
            onCancel={() => {
              if (!isProfileEmpty) {
                setIsEditing(false)
              }
            }}
          />
        ) : (
          <ProfileShowcase
            data={{
              ...profile,
              userId: profile.userId || "",
              updatedAt: profile.updatedAt || "",
            }}
            onEdit={() => setIsEditing(true)}
          />
        )}
      </div>
    </div>
  )
}
