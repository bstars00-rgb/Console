import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import { VENDOR_MENU } from '../../app/menu'
import { menuByPath } from '../../app/menu'
import { useWorkspace } from './workspace'
import { Logo } from '../brand/Logo'

export function Sidebar() {
  const location = useLocation()
  const active = menuByPath(location.pathname)
  const { openTab } = useWorkspace()
  const [q, setQ] = useState('')

  const items = VENDOR_MENU.filter((m) => m.label.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <nav className="flex h-full w-sidebar shrink-0 flex-col bg-sidebar">
      {/* Dark logo block */}
      <div className="flex h-header items-center bg-sidebar-dark px-3">
        <Logo height={22} horizontal withWordmark wordmarkColor="#ffffff" />
      </div>

      {/* Menu search */}
      <div className="px-3 pb-2 pt-3">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Enter Menu name"
            className="h-[30px] w-full rounded-sm border border-line bg-white pl-7 pr-2 text-base text-ink outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Group + items */}
      <div className="flex-1 overflow-auto px-3">
        <div className="mb-1 mt-1 px-1 text-base font-bold text-ink">Vendor</div>
        <ul className="flex flex-col">
          {items.map((m) => {
            const isActive = active?.key === m.key
            return (
              <li key={m.key}>
                <button
                  type="button"
                  onClick={() => openTab(m.key)}
                  className={`w-full py-[5px] pl-3 pr-1 text-left text-base transition-colors hover:text-primary ${
                    isActive ? 'font-medium text-primary' : 'text-muted'
                  }`}
                >
                  {m.label}
                </button>
              </li>
            )
          })}
          {items.length === 0 && <li className="px-1 py-2 text-caption text-faint">No menu found</li>}
        </ul>
      </div>
    </nav>
  )
}
