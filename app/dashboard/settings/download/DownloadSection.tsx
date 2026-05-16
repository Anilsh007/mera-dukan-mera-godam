"use client"

import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import { en } from "@/app/messages/en"

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
          <h2 className="text-lg font-semibold sm:text-xl">{en.download.title}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {en.download.description}
          </p>
        </div>
        <Button onClick={onDownloadAll} disabled={downloading} title={downloading ? en.download.downloading : en.download.downloadAll} className="w-full sm:w-auto" />
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
        <div className="mb-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{en.download.rangeTitle}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{en.download.rangeDescription}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Input
            type="date"
            label={en.download.fromDate}
            value={fromDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)}
          />
          <Input
            type="date"
            label={en.download.toDate}
            value={toDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)}
          />
          <div className="flex items-end">
            <Button
              onClick={onDownloadRange}
              disabled={downloading}
              title={downloading ? en.download.downloading : en.download.downloadRange}
              className="w-full md:w-auto"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
