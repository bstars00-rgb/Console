import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastCtx {
  push: (message: string, kind?: ToastKind) => void
}

const Ctx = createContext<ToastCtx | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast must be used within ToastProvider')
  return c
}

let seq = 1

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = seq++
    setItems((prev) => [...prev, { id, kind, message }])
  }, [])

  const remove = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), [])

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[10000] flex flex-col gap-2" role="region" aria-label="Notifications">
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  )
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200)
    return () => clearTimeout(t)
  }, [onClose])

  const Icon = item.kind === 'success' ? CheckCircle2 : item.kind === 'error' ? AlertCircle : Info
  const color = item.kind === 'success' ? 'text-success' : item.kind === 'error' ? 'text-danger' : 'text-info'

  return (
    <div
      className="flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-base text-ink shadow-dropdown min-w-[240px] max-w-[380px] animate-[fadeIn_.15s_ease-out]"
      role="alert"
    >
      <Icon size={16} className={color} />
      <span className="flex-1">{item.message}</span>
      <button onClick={onClose} aria-label="Dismiss" className="text-faint hover:text-ink">
        <X size={14} />
      </button>
    </div>
  )
}
