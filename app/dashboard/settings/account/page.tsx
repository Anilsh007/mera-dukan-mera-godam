"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import { notify as toast } from "@/app/lib/notifications"
import useProfile from "@/app/dashboard/profile/useProfile"
import { en } from "@/app/messages/en"

const DELETE_CONFIRMATION = "DELETE"

export default function AccountSettingsPage() {
  const router = useRouter()
  const { profile, loading, saving, deleteProfile } = useProfile()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmationText, setConfirmationText] = useState("")
  const [confirmationError, setConfirmationError] = useState("")

  const profileEmpty = useMemo(() => {
    return !profile.business.shopName &&
      !profile.business.gstNumber &&
      !profile.business.upiId &&
      !profile.address.address &&
      !profile.address.district &&
      !profile.address.state &&
      !profile.address.pincode &&
      !profile.banking.accountHolderName &&
      !profile.banking.accountNumber &&
      !profile.banking.ifscCode &&
      !profile.banking.bankName
  }, [profile])

  async function handleDelete() {
    if (confirmationText.trim() !== DELETE_CONFIRMATION) {
      setConfirmationError(en.settings.deleteConfirmationMismatch)
      toast.warning(en.settings.deleteConfirmationMismatch)
      return
    }

    try {
      const result = await deleteProfile()

      if (result.cloudSyncSkipped) {
        toast.success(en.settings.profileDeleteSuccess)
        toast.warning(en.settings.profileDeleteCloudSkipped)
      } else {
        toast.success(en.settings.profileDeleteSuccess)
      }

      setConfirmOpen(false)
      setConfirmationText("")
      setConfirmationError("")
      router.push("/dashboard/profile")
      router.refresh()
    } catch (error) {
      console.error("Profile delete failed", error)
      toast.error(en.settings.profileDeleteFailed)
    }
  }

  return (
    <div className="dashboard-page space-y-6 pb-8">
      <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{en.settings.accountTitle}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{en.settings.accountDescription}</p>
      </section>

      <section className="rounded-2xl border border-rose-300/70 bg-rose-50/80 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl dark:border-rose-400/18 dark:bg-rose-500/8 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-[var(--button-shadow)]">
                <AlertTriangle size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-700 dark:text-rose-200">{en.settings.dangerZone}</p>
                <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">{en.settings.deleteProfileTitle}</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{en.settings.deleteProfileDescription}</p>
            <p className="mt-3 text-sm font-medium text-rose-700 dark:text-rose-200">{en.settings.deleteProfileWarning}</p>
            <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{en.settings.accountDangerHelp}</p>
          </div>

          <Button
            variant="danger"
            title={en.settings.deleteProfileAction}
            onClick={() => {
              if (profileEmpty) {
                toast.info(en.settings.profileAlreadyEmpty)
                return
              }
              setConfirmOpen(true)
            }}
            disabled={loading || saving}
            className="w-full sm:w-auto"
          />
        </div>
      </section>

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (saving) return
          setConfirmOpen(false)
          setConfirmationText("")
          setConfirmationError("")
        }}
        title={en.settings.deleteProfileTitle}
        description={en.settings.deleteProfileDescription}
        titleIcon={<AlertTriangle size={18} aria-hidden="true" />}
        primaryLabel={en.settings.deleteProfileAction}
        primaryVariant="danger"
        onPrimary={handleDelete}
        loading={saving}
        primaryDisabled={loading}
        error={confirmationError || undefined}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-300/70 bg-rose-50 p-4 text-sm leading-6 text-rose-700 dark:border-rose-400/18 dark:bg-rose-500/8 dark:text-rose-200">
            {en.settings.deleteProfileWarning}
          </div>

          <Input
            label={en.settings.deleteConfirmationLabel}
            placeholder={en.settings.deleteConfirmationPlaceholder}
            value={confirmationText}
            onChange={(event) => {
              setConfirmationText(event.target.value)
              if (confirmationError) setConfirmationError("")
            }}
            helperText={en.settings.profileDeleteInstruction}
            error={confirmationError || undefined}
            autoComplete="off"
          />
        </div>
      </Modal>
    </div>
  )
}
