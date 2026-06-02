"use client"

import { useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AlertCircle, ArrowRight } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Modal from "@/app/components/ui/Modal"
import StatusBadge from "@/app/components/ui/StatusBadge"
import useProfile from "./useProfile"
import { en } from "@/app/messages/en"

function isBlank(value?: string) {
  return !value?.trim()
}

export default function ProfileCompletionNotice() {
  const router = useRouter()
  const pathname = usePathname()
  const { profile, loading } = useProfile()
  const [dialogDismissed, setDialogDismissed] = useState(false)

  const status = useMemo(() => {
    const requiredMissing = [
      isBlank(profile.business.shopName) ? en.profile.requiredFields.shopName : "",
      isBlank(profile.personal.phone) ? en.profile.requiredFields.phone : "",
      isBlank(profile.business.gstNumber) ? en.profile.requiredFields.gstin : "",
      isBlank(profile.address.address) ? en.profile.requiredFields.address : "",
      isBlank(profile.address.state) ? en.profile.requiredFields.state : "",
      isBlank(profile.address.pincode) ? en.profile.requiredFields.pincode : "",
    ].filter(Boolean)

    const bankMissing = [
      isBlank(profile.banking.accountHolderName),
      isBlank(profile.banking.accountNumber),
      isBlank(profile.banking.ifscCode),
      isBlank(profile.banking.bankName),
    ].some(Boolean)

    return { requiredMissing, bankMissing }
  }, [profile])

  if (loading || pathname === "/dashboard/profile") return null
  if (!status.requiredMissing.length && !status.bankMissing) return null

  const message = status.requiredMissing.length
    ? `${en.profile.missingImportantDataPrefix} ${status.requiredMissing.join(", ")}. ${en.profile.gstinRequiredForBill}`
    : en.profile.bankOptionalDescription

  const goToProfile = () => router.push("/dashboard/profile")

  return (
    <>
      <div className="mb-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-amber-900 shadow-[var(--shadow-card)] dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-300" />
            <div>
              <p className="text-sm font-semibold">{en.profile.completeTitle}</p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-600">
                {message}
                {status.bankMissing && status.requiredMissing.length ? ` ${en.profile.bankHint}` : ""}
              </p>
            </div>
          </div>

          <Button
            title={en.profile.completeAction}
            variant="outline"
            icon={<ArrowRight size={16} />}
            onClick={goToProfile}
            className="shrink-0"
          />
        </div>
      </div>

      {!dialogDismissed && (
        <Modal
          title={en.profile.completeTitle}
          description={en.profile.profileWarningDescription}
          titleIcon={<AlertCircle size={22} />}
          onClose={() => setDialogDismissed(true)}
          size="md"
          primaryLabel={en.profile.completeAction}
          primaryVariant="warning"
          onPrimary={goToProfile}
          cancelLabel={en.profile.dismissWarning}
        >
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>{message}</p>
            {status.requiredMissing.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {status.requiredMissing.map((field) => (
                  <StatusBadge key={field} tone="warning">{field}</StatusBadge>
                ))}
              </div>
            )}
            {status.bankMissing && <p>{en.profile.bankHint}</p>}
          </div>
        </Modal>
      )}
    </>
  )
}
