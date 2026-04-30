"use client"

import Button from "@/app/components/utility/Button"
import Input from "@/app/components/utility/CommonInput"

type DownloadSectionProps = {
  fromDate: string
  toDate: string
  setFromDate: (value: string) => void
  setToDate: (value: string) => void
  downloading: boolean
  onDownloadAll: () => void
  onDownloadRange: () => void
}

export default function DownloadSection({
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  downloading,
  onDownloadAll,
  onDownloadRange,
}: DownloadSectionProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold sm:text-xl">Download Data</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Saara data ya selected date range ka export yahin se nikalo.
          </p>
        </div>
        <Button onClick={onDownloadAll} disabled={downloading} title={`${downloading ? "Downloading..." : "Download All"}`} className="w-full sm:w-auto" />
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
        <div className="mb-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Download between date range</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">From aur To date select karke filtered logs download karo.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Input
            type="date"
            label="From date"
            value={fromDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)}
          />
          <Input
            type="date"
            label="To date"
            value={toDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)}
          />
          <div className="flex items-end">
            <Button
              onClick={onDownloadRange}
              disabled={downloading}
              title={`${downloading ? "Downloading..." : "Download Range"}`}
              className="w-full md:w-auto"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
