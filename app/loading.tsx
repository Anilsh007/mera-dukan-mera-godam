export default function AppLoading() {
  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg-page)] px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-8 w-56 animate-pulse rounded-full bg-[var(--bg-elevated)]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-[24px] border border-[var(--border-card)] bg-[var(--bg-card-strong)]" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)]" />
      </div>
    </main>
  )
}
