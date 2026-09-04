import { Inbox, Loader2 } from 'lucide-react'

/** Matches the original grid's "No records available." empty state. */
export function EmptyState({ message = 'No records available.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted">
      <Inbox size={28} className="text-faint" />
      <p className="text-base">{message}</p>
    </div>
  )
}

export function Loading({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-muted">
      <Loader2 size={18} className="animate-spin text-primary" />
      <span className="text-base">{message}</span>
    </div>
  )
}

export function SkeletonRows({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-line-soft">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3 px-2 py-2.5">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3.5 flex-1 animate-pulse rounded bg-line-soft" />
          ))}
        </div>
      ))}
    </div>
  )
}
