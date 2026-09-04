/** Form-control primitives styled to match the original console (30px, radius 5). */
import { forwardRef, useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, Calendar, X } from 'lucide-react'

const CONTROL =
  'h-control rounded border border-line bg-white px-2.5 text-base text-ink outline-none focus:border-primary disabled:bg-canvas disabled:text-faint'

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = '', ...props }, ref) {
    return <input ref={ref} className={`${CONTROL} ${className}`} {...props} />
  },
)

export function SearchInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`relative ${className}`}>
      <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
      <input className={`${CONTROL} w-full pl-7`} {...props} />
    </div>
  )
}

export function Button({
  variant = 'secondary',
  className = '',
  children,
  ...props
}: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: Record<string, string> = {
    primary: 'bg-primary text-white border-primary hover:bg-primary-hover',
    secondary: 'bg-white text-ink border-line hover:bg-canvas',
    ghost: 'bg-transparent text-muted border-transparent hover:text-ink',
    danger: 'bg-white text-danger border-line hover:bg-danger/5',
  }
  return (
    <button
      className={`h-control inline-flex items-center justify-center gap-1 rounded border px-3 text-base font-medium transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export interface Option {
  value: string
  label: string
}

/** ng-select-style single dropdown. */
export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select',
  className = '',
  clearable = false,
}: {
  value: string
  onChange: (v: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  clearable?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const selected = options.find((o) => o.value === value)
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-control w-full rounded border border-line bg-white pl-2.5 pr-7 text-left text-base text-ink outline-none focus:border-primary flex items-center"
      >
        <span className={selected ? '' : 'text-faint'}>{selected ? selected.label : placeholder}</span>
        {clearable && selected && (
          <X
            size={13}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
          />
        )}
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted" />
      </button>
      {open && (
        <ul
          className="absolute z-50 mt-0.5 max-h-56 w-full overflow-auto rounded border border-line bg-white py-1 shadow-dropdown"
          role="listbox"
        >
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              className={`cursor-pointer px-2.5 py-1.5 text-base hover:bg-primary-light ${
                o.value === value ? 'bg-primary-light font-medium text-primary' : 'text-ink'
              }`}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function DateInput({
  value,
  onChange,
  className = '',
  ...props
}: { value: string; onChange: (v: string) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
>) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${CONTROL} w-full pr-8 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:w-4`}
        {...props}
      />
      <Calendar size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-base text-ink select-none cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-primary"
      />
      {label && <span>{label}</span>}
    </label>
  )
}
