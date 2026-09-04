import { useEffect, useState } from 'react'
import { X, Search, Plus, Star, Trash2, Info } from 'lucide-react'
import { Button } from '../../components/ui/controls'
import { useToast } from '../../components/ui/Toast'
import { updateHotel } from '../../data/store'
import { placeholderImage } from '../../data/placeholder'
import type { Hotel, HotelImage, LangText } from '../../data/types'

type Tab = 'basic' | 'description' | 'photo'

/**
 * "Hotel Master" popup — the hotel-content detail, reproduced from the original.
 * Dark title bar; Basic / Description / Photo tabs. Country/Province/Region and
 * Additional Region are managed by Ohmyhotel (read-only for the vendor).
 */
export function HotelMasterModal({ hotel, onClose }: { hotel: Hotel; onClose: () => void }) {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('basic')
  const [draft, setDraft] = useState<Hotel>(() => structuredClone(hotel))
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const set = (patch: Partial<Hotel>) => setDraft((d) => ({ ...d, ...patch }))
  const setName = (k: keyof LangText, v: string) => set({ name: { ...draft.name, [k]: v } })
  const setAddr = (k: keyof LangText, v: string) => set({ addresses: { ...draft.addresses, [k]: v } })
  const setDesc = (k: keyof LangText, v: string) => set({ descriptions: { ...draft.descriptions, [k]: v } })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!draft.name.EN.trim()) e.nameEN = 'Required'
    if (!draft.name.KO.trim()) e.nameKO = 'Required'
    if (!draft.hotelType.trim()) e.type = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = () => {
    if (!validate()) {
      setTab('basic')
      toast.push('Please fill required fields (*)', 'error')
      return
    }
    updateHotel(draft.code, draft)
    toast.push('Hotel content saved', 'success')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-auto bg-black/40 p-4" onMouseDown={onClose}>
      <div
        className="mt-[3vh] w-full max-w-[1040px] rounded bg-white shadow-modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Hotel Master"
      >
        {/* Dark title bar */}
        <div className="flex h-11 items-center justify-between rounded-t bg-[#3d3d3d] px-4">
          <h2 className="text-md font-semibold text-white">Hotel Master</h2>
          <button onClick={onClose} aria-label="Close" className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[82vh] overflow-auto px-6 py-5">
          {/* Info block */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
            <h3 className="text-lg font-bold text-ink">
              [{draft.code}] {draft.name.EN} {draft.name.KO && <span>({draft.name.KO})</span>}
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-caption text-muted">
              <span>First Insert Date : {draft.firstInsertTime}</span>
              <span>Last Update Date : {draft.lastUpdateTime}</span>
              <span>First Insert User : dy.kim@ohmyhotel.com</span>
              <span>Last Update User : tuyen.tb@ohmyhotel.com</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-3 flex gap-6 border-b border-line">
            {(['basic', 'description', 'photo'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`-mb-px border-b-2 pb-2 pt-1 text-md capitalize ${
                  tab === t ? 'border-primary font-semibold text-primary' : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'basic' && (
            <div className="mt-5 grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-2">
              <Row label="Hotel code" required>
                <input value={draft.code} disabled className={INPUT_DISABLED} />
              </Row>
              <Row label="Register status" required>
                <div className="flex h-control items-center gap-4 text-md">
                  {(['Approval Pending', 'Approved', 'Sale Suspended'] as const).map((s) => (
                    <label key={s} className="flex items-center gap-1.5 text-muted">
                      <input type="radio" name="regstatus" checked={draft.registerStatus === s} readOnly className="accent-primary" />
                      {s}
                    </label>
                  ))}
                </div>
              </Row>

              <Row label="Country" required>
                <LookupField value={draft.country} />
              </Row>
              <Row label="Province / State">
                <LookupField value={draft.province} />
              </Row>

              <Row label="Region" required help="Managed by Ohmyhotel — contact admin to change Country / Province / Region.">
                <LookupField value={draft.regionName} />
              </Row>
              <Row label="Additional Region" required info>
                <div className="flex flex-wrap items-center gap-2">
                  {draft.additionalRegions.map((r) => (
                    <span key={r} className="inline-flex items-center gap-1 rounded-sm border border-line bg-canvas px-2 py-1 text-base text-ink">
                      {r} <X size={11} className="text-faint" />
                    </span>
                  ))}
                  <button className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 text-base text-muted hover:text-ink" disabled>
                    <Plus size={12} /> Add Area
                  </button>
                </div>
              </Row>

              <Row label="Hotel Name (EN)" required error={errors.nameEN}>
                <input aria-label="Hotel Name (EN)" value={draft.name.EN} onChange={(e) => setName('EN', e.target.value)} className={INPUT} />
              </Row>
              <Row label="Hotel Type" required error={errors.type}>
                <select value={draft.hotelType} onChange={(e) => set({ hotelType: e.target.value })} className={INPUT}>
                  {['Hotel', 'Resort', 'Motel', 'Guest House', 'Hostel', 'Serviced Apartment'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Row>

              <Row label="Hotel Name (KO)" required error={errors.nameKO}>
                <input value={draft.name.KO} onChange={(e) => setName('KO', e.target.value)} className={INPUT} />
              </Row>
              <Row label="Chain Brand">
                <LookupField value={draft.chainBrand} placeholder="" editable onChange={(v) => set({ chainBrand: v })} />
              </Row>

              <Row label="Hotel Name (JA)">
                <input value={draft.name.JA} onChange={(e) => setName('JA', e.target.value)} className={INPUT} />
              </Row>
              <Row label="Star">
                <select value={draft.grade} onChange={(e) => set({ grade: e.target.value })} className={INPUT}>
                  <option value="">Select</option>
                  {['1', '2', '3', '4', '5'].map((o) => (
                    <option key={o} value={o}>
                      {o} Star
                    </option>
                  ))}
                </select>
              </Row>

              <Row label="Hotel Name (VI)">
                <input value={draft.name.VI} onChange={(e) => setName('VI', e.target.value)} className={INPUT} />
              </Row>
              <Row label="Tel">
                <input value={draft.phone} onChange={(e) => set({ phone: e.target.value })} className={INPUT} />
              </Row>

              <Row label="Hotel Name (ZH)">
                <input value={draft.name.ZH} onChange={(e) => setName('ZH', e.target.value)} className={INPUT} />
              </Row>
              <Row label="Fax No.">
                <input
                  aria-label="Fax No."
                  value={draft.fax}
                  onChange={(e) => set({ fax: e.target.value })}
                  placeholder="e.g. 82-2-1234-1234(Include country phone number)"
                  className={INPUT}
                />
              </Row>

              <Row label="Address (EN)">
                <input value={draft.addresses.EN} onChange={(e) => setAddr('EN', e.target.value)} className={INPUT} />
              </Row>
              <Row label="Email">
                <input value={draft.email} onChange={(e) => set({ email: e.target.value })} placeholder="email" className={INPUT} />
              </Row>

              <Row label="Address (KO)">
                <input value={draft.addresses.KO} onChange={(e) => setAddr('KO', e.target.value)} className={INPUT} />
              </Row>
              <Row label="Post code">
                <input value={draft.postCode} onChange={(e) => set({ postCode: e.target.value })} className={INPUT} />
              </Row>

              <Row label="Address (JA)">
                <input value={draft.addresses.JA} onChange={(e) => setAddr('JA', e.target.value)} className={INPUT} />
              </Row>
              <Row label="Check-in / out">
                <div className="flex items-center gap-2">
                  <input value={draft.checkIn} onChange={(e) => set({ checkIn: e.target.value })} className={INPUT} placeholder="15:00" />
                  <span className="text-muted">~</span>
                  <input value={draft.checkOut} onChange={(e) => set({ checkOut: e.target.value })} className={INPUT} placeholder="11:00" />
                </div>
              </Row>

              <Row label="Address (VI)">
                <input value={draft.addresses.VI} onChange={(e) => setAddr('VI', e.target.value)} className={INPUT} />
              </Row>
              <Row label="Address (ZH)">
                <input value={draft.addresses.ZH} onChange={(e) => setAddr('ZH', e.target.value)} className={INPUT} />
              </Row>
            </div>
          )}

          {tab === 'description' && (
            <div className="mt-5 flex flex-col gap-4">
              {(['EN', 'KO', 'JA', 'VI', 'ZH'] as (keyof LangText)[]).map((k) => (
                <Row key={k} label={`Description (${k})`} stack>
                  <textarea
                    value={draft.descriptions[k]}
                    onChange={(e) => setDesc(k, e.target.value)}
                    className="min-h-[80px] w-full rounded border border-line px-2.5 py-2 text-md outline-none focus:border-primary"
                  />
                </Row>
              ))}
            </div>
          )}

          {tab === 'photo' && <PhotoTab images={draft.images} onChange={(images) => set({ images })} hotelName={draft.name.EN} />}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 rounded-b border-t border-line bg-canvas/40 px-4 py-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

const INPUT = 'h-control w-full rounded border border-line px-2.5 text-md text-ink outline-none focus:border-primary'
const INPUT_DISABLED = 'h-control w-full rounded border border-line bg-canvas px-2.5 text-md text-muted'

function Row({
  label,
  required,
  info,
  help,
  error,
  stack,
  children,
}: {
  label: string
  required?: boolean
  info?: boolean
  help?: string
  error?: string
  stack?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={stack ? 'flex flex-col gap-1' : 'grid grid-cols-[130px_1fr] items-start gap-3'}>
      <label className="flex items-center gap-1 pt-1.5 text-md font-medium text-ink">
        {label}
        {required && <span className="text-primary">*</span>}
        {info && <Info size={12} className="text-info" />}
      </label>
      <div className="min-w-0">
        {children}
        {help && <p className="mt-1 text-caption text-muted">{help}</p>}
        {error && <p className="mt-1 text-caption text-danger">{error}</p>}
      </div>
    </div>
  )
}

/** Read-only lookup field with a search-icon button (managed by Ohmyhotel), or editable. */
function LookupField({
  value,
  placeholder,
  editable,
  onChange,
}: {
  value: string
  placeholder?: string
  editable?: boolean
  onChange?: (v: string) => void
}) {
  return (
    <div className="flex">
      <input
        value={value}
        placeholder={placeholder}
        disabled={!editable}
        onChange={(e) => onChange?.(e.target.value)}
        className={`h-control w-full rounded-l border border-line px-2.5 text-md outline-none focus:border-primary ${
          editable ? 'text-ink' : 'bg-canvas text-muted'
        }`}
      />
      <button
        type="button"
        className="flex h-control w-9 shrink-0 items-center justify-center rounded-r border border-l-0 border-line bg-canvas text-muted hover:text-ink"
        aria-label="Lookup"
        disabled={!editable}
      >
        <Search size={13} />
      </button>
    </div>
  )
}

function PhotoTab({ images, onChange, hotelName }: { images: HotelImage[]; onChange: (v: HotelImage[]) => void; hotelName: string }) {
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= images.length) return
    const copy = [...images]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    onChange(copy)
  }
  const setRep = (id: string) => onChange(images.map((im) => ({ ...im, isRepresentative: im.id === id })))
  const remove = (id: string) => onChange(images.filter((im) => im.id !== id))
  const add = () => {
    const n = images.length + 1
    onChange([...images, { id: `new-${Date.now()}`, url: placeholderImage(`${hotelName} ${n}`, n), caption: `Photo ${n}`, isRepresentative: images.length === 0 }])
  }
  return (
    <div className="mt-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-caption text-muted">Reorder with the arrows, mark a representative photo with the star, or remove.</p>
        <Button variant="secondary" onClick={add}>
          <Plus size={14} /> Add photo
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {images.map((im, i) => (
          <div key={im.id} className={`overflow-hidden rounded border ${im.isRepresentative ? 'border-primary ring-1 ring-primary' : 'border-line'} bg-white`}>
            <div className="relative">
              <img src={im.url} alt={im.caption} className="h-28 w-full object-cover" />
              {im.isRepresentative && (
                <span className="absolute left-1 top-1 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">Representative</span>
              )}
            </div>
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="truncate text-caption text-muted" title={im.caption}>
                {im.caption}
              </span>
              <div className="flex items-center gap-1 text-faint">
                <button title="Move left" onClick={() => move(i, -1)} disabled={i === 0} className="hover:text-ink disabled:opacity-30">
                  ‹
                </button>
                <button title="Move right" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="hover:text-ink disabled:opacity-30">
                  ›
                </button>
                <button title="Set representative" onClick={() => setRep(im.id)} className={im.isRepresentative ? 'text-primary' : 'hover:text-primary'}>
                  <Star size={14} />
                </button>
                <button title="Remove" onClick={() => remove(im.id)} className="hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {images.length === 0 && <p className="col-span-full py-6 text-center text-faint">No photos. Add one to get started.</p>}
      </div>
    </div>
  )
}
