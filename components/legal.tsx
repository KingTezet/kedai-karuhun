export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="page max-w-3xl py-5 sm:py-8">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-ink-muted">Terakhir diperbarui: {updated}</p>
      <div className="card mt-5 space-y-5 p-5 text-[16px] leading-relaxed text-ink-soft [&_h2]:mb-1.5 [&_h2]:mt-1 [&_h2]:text-lg [&_h2]:text-ink [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  )
}
