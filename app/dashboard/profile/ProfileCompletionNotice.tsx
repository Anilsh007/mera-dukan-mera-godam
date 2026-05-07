"use client"

import { useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AlertCircle, ArrowRight } from "lucide-react"
import Button from "@/app/components/utility/Button"
import useProfile from "./useProfile"

function isBlank(value?: string) {
  return !value?.trim()
}

export default function ProfileCompletionNotice() {
  const router = useRouter()
  const pathname = usePathname()
  const { profile, loading } = useProfile()

  const status = useMemo(() => {
    const requiredMissing = [
      isBlank(profile.business.shopName) ? "shop name" : "",
      isBlank(profile.personal.phone) ? "phone number" : "",
      isBlank(profile.business.gstNumber) ? "GSTIN" : "",
      isBlank(profile.address.address) ? "address" : "",
      isBlank(profile.address.state) ? "state" : "",
      isBlank(profile.address.pincode) ? "pincode" : "",
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
    ? `Please complete your profile with important data: ${status.requiredMissing.join(", ")}. GSTIN is compulsory before creating a GST bill.`
    : "Bank details are optional, but adding them makes GST invoices more complete."

  return (
    <div className="mb-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-amber-900 shadow-[var(--shadow-card)] dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-300" />
          <div>
            <p className="text-sm font-semibold">Profile details incomplete</p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
              {message}
              {status.bankMissing && status.requiredMissing.length ? " Bank details are optional, but recommended for invoices." : ""}
            </p>
          </div>
        </div>

        <Button
          title="Complete Profile"
          variant="outline"
          icon={<ArrowRight size={16} />}
          onClick={() => router.push("/dashboard/profile")}
          className="shrink-0"
        />
      </div>
    </div>
  )
}
