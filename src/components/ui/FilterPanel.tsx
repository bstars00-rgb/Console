/**
 * Filter panel matching the original: a light bordered card holding a wrapping
 * grid of `label(80px) + control` fields, with the Search/Reset actions pinned
 * to the top-right corner.
 */
export function FilterPanel({ actions, children }: { actions: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative border-b border-line pb-3">
      <div className="grid grid-cols-1 gap-x-5 gap-y-2.5 pr-0 md:grid-cols-2 md:pr-[160px] xl:grid-cols-3 2xl:grid-cols-4">
        {children}
      </div>
      <div className="mt-3 flex justify-end gap-2 md:absolute md:right-0 md:top-0 md:mt-0">{actions}</div>
    </div>
  )
}

/** One label + control unit. `span` widens the field across grid columns. */
export function Field({
  label,
  children,
  span = 1,
}: {
  label?: string
  children: React.ReactNode
  span?: 1 | 2 | 3
}) {
  const spanCls = span === 3 ? 'xl:col-span-3' : span === 2 ? 'md:col-span-2' : ''
  return (
    <div className={`flex items-center gap-2 ${spanCls}`}>
      {label !== undefined && (
        <label className="w-20 shrink-0 text-base text-ink" title={label}>
          {label}
        </label>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
