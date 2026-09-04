import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, LayoutGrid, LayoutList } from 'lucide-react'
import { logout, getSession } from '../../auth/session'
import { LANGUAGES, getLang, setLang, type LangCode } from '../../i18n/lang'
import { ConfirmDialog } from '../ui/Modal'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/controls'
import { useToast } from '../ui/Toast'

export function Header() {
  const navigate = useNavigate()
  const toast = useToast()
  const session = getSession()
  const [lang, setLangState] = useState<LangCode>(getLang())
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [pwModal, setPwModal] = useState(false)
  const [accountModal, setAccountModal] = useState<null | 'user' | 'corp'>(null)

  return (
    <header className="flex h-header items-center justify-between bg-canvas pl-3 pr-4">
      {/* Layout preset buttons (visual parity) */}
      <div className="flex items-center gap-1">
        <IconToggle title="Layout 1" active>
          <LayoutList size={15} />
        </IconToggle>
        <IconToggle title="Layout 2">
          <LayoutGrid size={15} />
        </IconToggle>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-4 text-base text-muted">
        <LangMenu
          value={lang}
          onChange={(c) => {
            setLang(c)
            setLangState(c)
            toast.push('Language updated', 'info')
          }}
        />
        <DropMenu
          label={session?.hotelName ?? 'Tracy Test Hotel'}
          items={[
            { label: 'User Info', onClick: () => setAccountModal('user') },
            { label: 'Corporation Profile', onClick: () => setAccountModal('corp') },
          ]}
        />
        <button className="hover:text-ink" onClick={() => setPwModal(true)}>
          Change password
        </button>
        <button className="hover:text-ink" onClick={() => setConfirmLogout(true)}>
          Log out
        </button>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => {
          logout()
          navigate('/login', { replace: true })
        }}
        title="Log out"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
      />

      <Modal
        open={pwModal}
        onClose={() => setPwModal(false)}
        title="Change password"
        width={420}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPwModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setPwModal(false)
                toast.push('Password changed (mock)', 'success')
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <PwRow label="Current password" />
          <PwRow label="New password" />
          <PwRow label="Confirm new password" />
          <p className="text-caption text-faint">This is a prototype — no real password is changed.</p>
        </div>
      </Modal>

      <Modal open={accountModal === 'user'} onClose={() => setAccountModal(null)} title="User Info" width={440}>
        <InfoList
          rows={[
            ['Name', session?.name ?? 'Vendor Admin'],
            ['Email', session?.email ?? 'tram.tt@ohmyhotel.com'],
            ['Role', 'Vendor Administrator'],
            ['Last login', new Date(session?.loggedInAt ?? Date.now()).toLocaleString()],
          ]}
        />
      </Modal>
      <Modal open={accountModal === 'corp'} onClose={() => setAccountModal(null)} title="Corporation Profile" width={440}>
        <InfoList
          rows={[
            ['Corporation', 'Tracy Test Hotel Co., Ltd.'],
            ['Business No.', '123-45-67890'],
            ['Contract', 'Vendor (Net / Commission)'],
            ['Settlement cycle', 'Every 15 days'],
            ['Country', 'Vietnam'],
          ]}
        />
      </Modal>
    </header>
  )
}

function IconToggle({ title, active, children }: { title: string; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      title={title}
      aria-label={title}
      className={`flex h-7 w-[34px] items-center justify-center rounded border ${
        active ? 'border-primary text-primary' : 'border-line text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function LangMenu({ value, onChange }: { value: LangCode; onChange: (c: LangCode) => void }) {
  const label = LANGUAGES.find((l) => l.code === value)?.label ?? 'English'
  const display = value === 'AUTO' ? 'English' : label
  return (
    <DropMenu
      label={display}
      items={LANGUAGES.filter((l) => l.code !== 'AUTO').map((l) => ({ label: l.label, onClick: () => onChange(l.code) }))}
    />
  )
}

function DropMenu({ label, items }: { label: string; items: { label: string; onClick: () => void }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button className="flex items-center gap-0.5 hover:text-ink" onClick={() => setOpen((o) => !o)}>
        {label}
        <ChevronDown size={13} />
      </button>
      {open && (
        <ul className="absolute right-0 z-50 mt-1 min-w-[150px] rounded border border-line bg-white py-1 shadow-dropdown">
          {items.map((it) => (
            <li key={it.label}>
              <button
                className="block w-full px-3 py-1.5 text-left text-base text-ink hover:bg-primary-light"
                onClick={() => {
                  it.onClick()
                  setOpen(false)
                }}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PwRow({ label }: { label: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-base text-ink">{label}</span>
      <input type="password" className="h-control rounded border border-line px-2.5 text-base outline-none focus:border-primary" />
    </label>
  )
}

function InfoList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-line-soft">
      {rows.map(([k, v]) => (
        <div key={k} className="flex py-2">
          <dt className="w-32 shrink-0 text-muted">{k}</dt>
          <dd className="text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
