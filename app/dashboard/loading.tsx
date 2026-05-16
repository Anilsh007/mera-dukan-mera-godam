export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="h-28 animate-pulse rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-[24px] border border-[var(--border-card)] bg-[var(--bg-card-strong)]" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)]" />
    </div>
  )
}
