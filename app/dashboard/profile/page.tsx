"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MdArrowBack, MdEdit } from "react-icons/md"
import { notify as toast } from "@/app/lib/notifications"
import Button from "@/app/components/ui/Button"
import ProfileForm from "./ProfileForm"
import ProfileShowcase from "./components/ProfileShowcase"
import useProfile from "./useProfile"
import { en } from "@/app/messages/en"

export default function ProfilePage() {
  const router = useRouter()
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
        toast.success(en.profile.savedLocally)
        toast.warning(en.profile.cloudBlocked)
      } else {
        toast.success(en.profile.saved)
      }

      setIsEditing(false)
      return result
    } catch (error: unknown) {
      console.error("Profile save failed", error)
      toast.error(en.profile.saveFailed)
      throw error
    }
  }

  return (
    <div className="dashboard-page space-y-6 pb-8">
      {showEditor ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-3 shadow-[var(--shadow-card)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {showEditor ? "" : en.pages.profileTitle}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {showEditor
                ? en.pages.profileDescription
                : ""}
            </p>
          </div>

          {!isProfileEmpty && (
            <div className="responsive-actions">
              <Button
                variant="outline"
                title={en.profile.manageAccount}
                onClick={() => router.push("/dashboard/settings/account")}
                className="w-full sm:w-auto"
              />
              <Button variant={showEditor ? "outline" : "primary"} icon={showEditor ? <MdArrowBack /> : <MdEdit />} title={showEditor ? en.profile.backToProfile : en.profile.editProfile} onClick={() => setIsEditing((prev) => !prev)} className="w-full sm:w-auto" />
            </div>
          )}
        </div>
      ) : ("")}

      <div className="min-h-[500px]">
        {showEditor ? (
          <ProfileForm key={`${profile.userId || "guest"}:${profile.updatedAt || "initial"}`} initialData={profile} onSave={handleSave}
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
