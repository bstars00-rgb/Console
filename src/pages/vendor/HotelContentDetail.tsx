import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Save, X, Plus, Star, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { Button, TextInput } from '../../components/ui/controls'
import { Modal } from '../../components/ui/Modal'
import { DataStatusBadge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { useHotels, useRoomTypes } from '../../data/hooks'
import { updateHotel } from '../../data/store'
import { placeholderImage } from '../../data/placeholder'
import type { Hotel, HotelImage } from '../../data/types'

type Tab = 'basic' | 'facilities' | 'policies' | 'rooms' | 'images'
const TABS: { key: Tab; label: string }[] = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'facilities', label: 'Facilities & Services' },
  { key: 'policies', label: 'Policies' },
  { key: 'rooms', label: 'Room Types' },
  { key: 'images', label: 'Images' },
]

export function HotelContentDetail({ code }: { code: string }) {
  const navigate = useNavigate()
  const toast = useToast()
  const hotels = useHotels()
  const roomTypes = useRoomTypes()
  const original = hotels.find((h) => h.code === code)
  const [tab, setTab] = useState<Tab>('basic')
  const [draft, setDraft] = useState<Hotel | null>(original ? structuredClone(original) : null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState(false)

  if (!original || !draft) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted">
        <p>Hotel not found.</p>
        <Button variant="secondary" onClick={() => navigate('/vendor/hotel-content')}>Back to list</Button>
      </div>
    )
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(original)
  const completeness = computeCompleteness(draft)
  const set = (patch: Partial<Hotel>) => setDraft({ ...draft, ...patch })

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!draft.name.EN.trim()) e['name.EN'] = 'English name is required'
    if (!draft.address.trim()) e.address = 'Address is required'
    if (!draft.phone.trim()) e.phone = 'Phone is required'
    if (!draft.checkIn.trim()) e.checkIn = 'Check-in time is required'
    if (!draft.checkOut.trim()) e.checkOut = 'Check-out time is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = () => {
    if (!validate()) {
      toast.push('Please fix required fields', 'error')
      setTab('basic')
      return
    }
    updateHotel(code, draft)
    toast.push('Hotel content saved', 'success')
  }

  const hotelRooms = roomTypes.filter((r) => r.hotelCode === code)

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/vendor/hotel-content')}><ArrowLeft size={15} /> List</Button>
          <h2 className="text-lg font-semibold text-ink">{draft.name.EN || '(Untitled hotel)'}</h2>
          <span className="text-caption text-muted">Code {draft.code}</span>
          <DataStatusBadge status={draft.status} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setPreview(true)}><Eye size={14} /> Preview</Button>
          <Button variant="secondary" onClick={() => setDraft(structuredClone(original))} disabled={!dirty}><X size={14} /> Cancel</Button>
          <Button variant="primary" onClick={save} disabled={!dirty}><Save size={14} /> Save</Button>
        </div>
      </div>

      {/* Completeness meter */}
      <div className="flex items-center gap-3 rounded border border-line bg-canvas/50 px-3 py-2">
        <span className="text-base text-muted">Content completeness</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completeness}%` }} />
        </div>
        <span className="text-base font-semibold text-ink">{completeness}%</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-base ${tab === t.key ? 'border-primary font-medium text-primary' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'basic' && <BasicInfo draft={draft} set={set} errors={errors} />}
      {tab === 'facilities' && <ChipEditor label="Facility / Service" items={draft.facilities} onChange={(facilities) => set({ facilities })} suggestions={FACILITY_SUGGESTIONS} />}
      {tab === 'policies' && <ChipEditor label="Policy" items={draft.policies} onChange={(policies) => set({ policies })} textarea />}
      {tab === 'rooms' && <RoomsTab rooms={hotelRooms} />}
      {tab === 'images' && <ImagesTab images={draft.images} onChange={(images) => set({ images })} hotelName={draft.name.EN} />}

      <PreviewModal open={preview} onClose={() => setPreview(false)} hotel={draft} />
    </div>
  )
}

function BasicInfo({ draft, set, errors }: { draft: Hotel; set: (p: Partial<Hotel>) => void; errors: Record<string, string> }) {
  const langs: [keyof Hotel['name'], string][] = [['EN', 'Hotel Name (EN)'], ['KO', 'Hotel Name (KO)'], ['JA', 'Hotel Name (JA)'], ['VI', 'Hotel Name (VI)'], ['ZH', 'Hotel Name (ZH)']]
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {langs.map(([k, label]) => (
        <FormRow key={k} label={label} required={k === 'EN'} error={k === 'EN' ? errors['name.EN'] : undefined}>
          <TextInput className="w-full" value={draft.name[k]} onChange={(e) => set({ name: { ...draft.name, [k]: e.target.value } })} />
        </FormRow>
      ))}
      <FormRow label="Grade (stars)"><TextInput className="w-full" value={draft.grade} onChange={(e) => set({ grade: e.target.value })} /></FormRow>
      <FormRow label="Hotel Type"><TextInput className="w-full" value={draft.hotelType} onChange={(e) => set({ hotelType: e.target.value })} /></FormRow>
      <FormRow label="Phone No." required error={errors.phone}><TextInput className="w-full" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} /></FormRow>
      <FormRow label="Email"><TextInput className="w-full" value={draft.email} onChange={(e) => set({ email: e.target.value })} /></FormRow>
      <FormRow label="Country"><TextInput className="w-full" value={draft.country} onChange={(e) => set({ country: e.target.value })} /></FormRow>
      <FormRow label="Region"><TextInput className="w-full" value={draft.regionName} onChange={(e) => set({ regionName: e.target.value })} /></FormRow>
      <FormRow label="Address" required error={errors.address} span2><TextInput className="w-full" value={draft.address} onChange={(e) => set({ address: e.target.value })} /></FormRow>
      <FormRow label="Check-in" required error={errors.checkIn}><TextInput className="w-full" value={draft.checkIn} onChange={(e) => set({ checkIn: e.target.value })} placeholder="15:00" /></FormRow>
      <FormRow label="Check-out" required error={errors.checkOut}><TextInput className="w-full" value={draft.checkOut} onChange={(e) => set({ checkOut: e.target.value })} placeholder="11:00" /></FormRow>
      <FormRow label="Description" span2>
        <textarea className="min-h-[90px] w-full rounded border border-line px-2.5 py-2 text-base outline-none focus:border-primary" value={draft.description} onChange={(e) => set({ description: e.target.value })} />
      </FormRow>
    </div>
  )
}

function FormRow({ label, required, error, span2, children }: { label: string; required?: boolean; error?: string; span2?: boolean; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 ${span2 ? 'md:col-span-2' : ''}`}>
      <span className="text-base text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {children}
      {error && <span className="text-caption text-danger">{error}</span>}
    </label>
  )
}

function ChipEditor({ label, items, onChange, suggestions, textarea }: { label: string; items: string[]; onChange: (v: string[]) => void; suggestions?: string[]; textarea?: boolean }) {
  const [val, setVal] = useState('')
  const add = () => {
    const v = val.trim()
    if (v && !items.includes(v)) onChange([...items, v])
    setVal('')
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {textarea ? (
          <input className="h-control flex-1 rounded border border-line px-2.5 text-base outline-none focus:border-primary" placeholder={`Add ${label.toLowerCase()}…`} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        ) : (
          <TextInput className="flex-1" placeholder={`Add ${label.toLowerCase()}…`} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        )}
        <Button variant="primary" onClick={add}><Plus size={14} /> Add</Button>
      </div>
      {suggestions && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.filter((s) => !items.includes(s)).map((s) => (
            <button key={s} onClick={() => onChange([...items, s])} className="rounded-full border border-dashed border-line px-2 py-0.5 text-caption text-muted hover:border-primary hover:text-primary">
              + {s}
            </button>
          ))}
        </div>
      )}
      <ul className="flex flex-col gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between rounded border border-line bg-white px-3 py-1.5 text-base">
            <span>{it}</span>
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-faint hover:text-danger"><Trash2 size={14} /></button>
          </li>
        ))}
        {items.length === 0 && <li className="text-caption text-faint">Nothing added yet.</li>}
      </ul>
    </div>
  )
}

function RoomsTab({ rooms }: { rooms: { seq: number; name: { EN: string }; maxOccupancy: number; amenities: string[]; openSales: boolean; localPrice: string }[] }) {
  if (rooms.length === 0) return <p className="py-6 text-center text-muted">No room types for this hotel.</p>
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {rooms.map((r) => (
        <div key={r.seq} className="rounded border border-line bg-white p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-md font-semibold text-ink">{r.name.EN}</span>
            <span className={`text-caption ${r.openSales ? 'text-success' : 'text-faint'}`}>{r.openSales ? 'On sale' : 'Off sale'}</span>
          </div>
          <div className="mb-2 text-caption text-muted">Max occupancy {r.maxOccupancy} · from {r.localPrice}</div>
          <div className="flex flex-wrap gap-1">
            {r.amenities.map((a) => (
              <span key={a} className="rounded-sm bg-canvas px-1.5 py-0.5 text-caption text-muted">{a}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ImagesTab({ images, onChange, hotelName }: { images: HotelImage[]; onChange: (v: HotelImage[]) => void; hotelName: string }) {
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
    onChange([...images, { id: `new-${Date.now()}`, url: placeholderImage(`${hotelName} ${n}`, n), caption: `New photo ${n}`, isRepresentative: images.length === 0 }])
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-caption text-muted">Reorder with the arrows, mark a representative image with the star, or remove.</p>
        <Button variant="secondary" onClick={add}><Plus size={14} /> Add image</Button>
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
              <span className="truncate text-caption text-muted" title={im.caption}>{im.caption}</span>
              <div className="flex items-center gap-1 text-faint">
                <button title="Move left" onClick={() => move(i, -1)} disabled={i === 0} className="hover:text-ink disabled:opacity-30"><ChevronUp size={14} className="-rotate-90" /></button>
                <button title="Move right" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="hover:text-ink disabled:opacity-30"><ChevronDown size={14} className="-rotate-90" /></button>
                <button title="Set representative" onClick={() => setRep(im.id)} className={im.isRepresentative ? 'text-primary' : 'hover:text-primary'}><Star size={14} /></button>
                <button title="Remove" onClick={() => remove(im.id)} className="hover:text-danger"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {images.length === 0 && <p className="col-span-full py-6 text-center text-faint">No images. Add one to get started.</p>}
      </div>
    </div>
  )
}

function PreviewModal({ open, onClose, hotel }: { open: boolean; onClose: () => void; hotel: Hotel }) {
  const rep = hotel.images.find((i) => i.isRepresentative) ?? hotel.images[0]
  return (
    <Modal open={open} onClose={onClose} title="Content Preview" width={680}>
      <div className="flex flex-col gap-3">
        {rep && <img src={rep.url} alt={hotel.name.EN} className="h-52 w-full rounded object-cover" />}
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-ink">{hotel.name.EN}</h3>
          <span className="text-primary">{'★'.repeat(Number(hotel.grade) || 0)}</span>
        </div>
        <p className="text-caption text-muted">{hotel.address} · {hotel.phone}</p>
        <p className="text-base leading-relaxed text-ink">{hotel.description}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="mb-1 text-md font-semibold">Facilities</h4>
            <ul className="flex flex-wrap gap-1">{hotel.facilities.map((f) => <li key={f} className="rounded-sm bg-canvas px-1.5 py-0.5 text-caption">{f}</li>)}</ul>
          </div>
          <div>
            <h4 className="mb-1 text-md font-semibold">Policies</h4>
            <ul className="list-disc pl-4 text-caption text-ink">{hotel.policies.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </div>
        <p className="text-caption text-muted">Check-in {hotel.checkIn} · Check-out {hotel.checkOut}</p>
      </div>
    </Modal>
  )
}

const FACILITY_SUGGESTIONS = ['Free Wi-Fi', 'Swimming Pool', 'Fitness Center', 'Spa', 'Restaurant', 'Bar', 'Parking', 'Airport Shuttle', 'Room Service', 'Business Center', 'Pet Friendly', 'Laundry']

function computeCompleteness(h: Hotel): number {
  const checks = [
    !!h.name.EN, !!h.name.KO, !!h.name.JA, !!h.name.VI, !!h.name.ZH,
    !!h.grade, !!h.hotelType, !!h.phone, !!h.email, !!h.country, !!h.regionName,
    !!h.address, !!h.checkIn, !!h.checkOut, h.description.length > 20,
    h.facilities.length > 0, h.policies.length > 0, h.images.length > 0,
    h.images.some((i) => i.isRepresentative),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export default HotelContentDetail
