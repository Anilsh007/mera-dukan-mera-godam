"use client"

import { useState } from "react"
import { MdArrowBack, MdEdit } from "react-icons/md"
import { toast } from "sonner"
import Button from "@/app/components/utility/Button"
import ProfileForm from "./ProfileForm"
import ProfileShowcase from "./components/ProfileShowcase"
import useProfile from "./useProfile"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const { profile, loading, saveProfile } = useProfile()

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  const isProfileEmpty = !profile.business?.shopName
  const showEditor = isEditing || isProfileEmpty

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Save failed"
      toast.error(message)
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {showEditor ? (
        <div className="flex items-center justify-between rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-2 shadow-[var(--shadow-card)]">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {showEditor ? "" : "Business Profile"}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {showEditor
                ? "Update your business information. This will help us personalize your experience and generate accurate invoices."
                : ""}
            </p>
          </div>

          {!isProfileEmpty && (
            <Button variant={showEditor ? "outline" : "primary"} icon={showEditor ? <MdArrowBack /> : <MdEdit />} title={showEditor ? "Back to Profile" : "Edit Profile"} onClick={() => setIsEditing((prev) => !prev)} />
          )}
        </div>
      ) : ("")}

      <div className="min-h-[500px]">
        {showEditor ? (
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
