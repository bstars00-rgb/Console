import { useState } from 'react'
import { MapPin, Sparkles, Languages, CheckCircle2, Wand2, RefreshCw, Check, X, Plus } from 'lucide-react'
import type { Hotel, RoomType, LangText } from '../../../data/types'
import type { MissionKey } from '../../../lib/contentScore'
import type { HighlightKey } from './highlight'
import { PhotoManager } from './PhotoManager'
import { enrichDescription, describeGaps, type Tone } from '../../../lib/descriptionEnrich'
import { facilityIcon } from './facilityIcon'
import { translateDraft } from '../../../lib/aiTranslate'

const FACILITY_OPTIONS = ['Free Wi-Fi', 'Swimming Pool', 'Indoor Pool', 'Fitness Center', 'Spa & Sauna', 'Restaurant', 'Bar', 'Rooftop Bar', 'Parking', 'Valet Parking', 'Airport Shuttle', 'Room Service', 'Business Center', 'Pet Friendly', 'Laundry', 'Concierge', '24h Front Desk', 'Onsen', 'Karaoke', 'Kids Play Area', 'Executive Lounge']
const BED_OPTIONS = ['1 King Bed', '1 Queen Bed', '2 Twin Beds', '1 Double Bed', '2 Queen Beds', '1 King Bed + Sofa', 'Japanese Futon']
const VIEW_OPTIONS = ['City View', 'Ocean View', 'Garden View', 'Mountain View', 'Pool View', 'No View']
const ROOM_AMENITIES = ['Air Conditioning', 'Minibar', 'Safe', 'Bathtub', 'Free Wi-Fi', 'Coffee Machine', 'Balcony', 'Hair Dryer', 'Slippers', 'Bathrobe', 'Work Desk', 'Smart TV']
const POLICY_OPTIONS = ['Free cancellation up to 24h before check-in', 'Free cancellation up to 48h before check-in', 'Non-smoking rooms', 'Pets not allowed', 'Pets allowed (fee applies)', 'Children welcome', 'Children under 6 stay free', 'City tax not included', 'Photo ID required at check-in']
const LANGS: (keyof LangText)[] = ['EN', 'KO', 'JA', 'VI', 'ZH']
const LANG_LABEL: Record<keyof LangText, string> = { EN: 'English', KO: '한국어', JA: '日本語', VI: 'Tiếng Việt', ZH: '中文' }

interface Props {
  mission: MissionKey
  hotel: Hotel
  setHotel: (patch: Partial<Hotel>) => void
  rooms: RoomType[]
  setRoom: (seq: number, patch: Partial<RoomType>) => void
  setHighlight: (k: HighlightKey) => void
}

export function MissionInput(props: Props) {
  const { mission } = props
  switch (mission) {
    case 'basic-info':
      return <BasicInfo {...props} />
    case 'description':
      return <Description {...props} />
    case 'location':
      return <Location {...props} />
    case 'facilities':
      return <Facilities {...props} />
    case 'hotel-photos':
      return <HotelPhotos {...props} />
    case 'room-info':
      return <RoomInfo {...props} />
    case 'room-photos':
      return <RoomPhotos {...props} />
    case 'policies':
      return <Policies {...props} />
    case 'multilingual':
      return <Multilingual {...props} />
    case 'review':
      return <Review {...props} />
    default:
      return null
  }
}

// ---- Shared field primitives -------------------------------------------
function Q({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {sub && <p className="mt-0.5 text-md text-muted">{sub}</p>}
    </div>
  )
}

function Field({
  label,
  required,
  example,
  where,
  children,
}: {
  label: string
  required?: boolean
  example?: string
  where?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-line-soft pb-4">
      <div className="flex items-center gap-1.5">
        <span className="text-md font-semibold text-ink">{label}</span>
        {required ? (
          <span className="rounded-sm bg-danger/10 px-1 text-[10px] font-semibold text-danger">필수</span>
        ) : (
          <span className="rounded-sm bg-info/10 px-1 text-[10px] font-semibold text-info">추천</span>
        )}
      </div>
      {children}
      {example && <p className="text-caption text-muted">예시: {example}</p>}
      {where && (
        <p className="flex items-center gap-1 text-caption text-primary">
          <MapPin size={11} /> 고객 화면 표시 위치: {where}
        </p>
      )}
    </div>
  )
}

function TextInput({ value, onChange, onFocus, placeholder }: { value: string; onChange: (v: string) => void; onFocus?: () => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      placeholder={placeholder}
      className="h-control w-full rounded border border-line px-2.5 text-md text-ink outline-none focus:border-primary"
    />
  )
}

function ChipMulti({
  options,
  value,
  onChange,
  onFocus,
  withIcon,
  allowCustom,
  customPlaceholder = '목록에 없는 항목을 직접 추가',
}: {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
  onFocus?: () => void
  withIcon?: boolean
  allowCustom?: boolean
  customPlaceholder?: string
}) {
  const [custom, setCustom] = useState('')
  const toggle = (o: string) => (value.includes(o) ? onChange(value.filter((x) => x !== o)) : onChange([...value, o]))
  // Show presets plus any custom (selected) values not in the preset list.
  const allChips = [...options, ...value.filter((v) => !options.includes(v))]
  const addCustom = () => {
    const v = custom.trim()
    if (v && !value.includes(v)) {
      onFocus?.()
      onChange([...value, v])
    }
    setCustom('')
  }
  return (
    <div className="flex flex-col gap-2" onFocus={onFocus}>
      <div className="flex flex-wrap gap-1.5">
        {allChips.map((o) => {
          const on = value.includes(o)
          const isCustom = !options.includes(o)
          return (
            <button
              key={o}
              type="button"
              onClick={() => {
                onFocus?.()
                toggle(o)
              }}
              aria-pressed={on}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-caption transition-colors ${
                on ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:border-primary'
              }`}
            >
              {withIcon ? facilityIcon(o, 12, on ? 'text-white' : 'text-primary') : on ? <Check size={12} /> : null}
              {o}
              {isCustom && (
                <X
                  size={11}
                  className={on ? 'text-white/80 hover:text-white' : 'text-faint hover:text-danger'}
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(value.filter((x) => x !== o))
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
      {allowCustom && (
        <div className="flex max-w-md gap-1.5">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onFocus={onFocus}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustom()
              }
            }}
            placeholder={customPlaceholder}
            className="h-8 flex-1 rounded-full border border-dashed border-line px-3 text-caption text-ink outline-none focus:border-primary"
          />
          <button type="button" onClick={addCustom} className="inline-flex h-8 items-center gap-1 rounded-full border border-primary px-3 text-caption font-medium text-primary hover:bg-primary-light">
            <Plus size={12} /> 추가
          </button>
        </div>
      )}
    </div>
  )
}

function ChipSingle({ options, value, onChange, onFocus }: { options: string[]; value: string; onChange: (v: string) => void; onFocus?: () => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => {
            onFocus?.()
            onChange(o)
          }}
          aria-pressed={value === o}
          className={`rounded-full border px-2.5 py-1 text-caption transition-colors ${
            value === o ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:border-primary'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

/** Card-style multi-select (icon + name, selectable) with custom entries. */
function CardMulti({
  options,
  value,
  onChange,
  onFocus,
  customPlaceholder = '목록에 없는 항목을 직접 추가',
}: {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
  onFocus?: () => void
  customPlaceholder?: string
}) {
  const [custom, setCustom] = useState('')
  const toggle = (o: string) => (value.includes(o) ? onChange(value.filter((x) => x !== o)) : onChange([...value, o]))
  const allCards = [...options, ...value.filter((v) => !options.includes(v))]
  const addCustom = () => {
    const v = custom.trim()
    if (v && !value.includes(v)) {
      onFocus?.()
      onChange([...value, v])
    }
    setCustom('')
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {allCards.map((o) => {
          const on = value.includes(o)
          const isCustom = !options.includes(o)
          return (
            <button
              key={o}
              type="button"
              onClick={() => {
                onFocus?.()
                toggle(o)
              }}
              aria-pressed={on}
              className={`relative flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-lg border p-2 text-center transition-colors ${
                on ? 'border-primary bg-primary-light shadow-card' : 'border-line bg-white hover:border-primary hover:bg-canvas'
              }`}
            >
              {on && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                  <Check size={11} />
                </span>
              )}
              {isCustom && (
                <X
                  size={13}
                  className="absolute left-1.5 top-1.5 text-faint hover:text-danger"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(value.filter((x) => x !== o))
                  }}
                />
              )}
              {facilityIcon(o, 20, on ? 'text-primary' : 'text-muted')}
              <span className={`text-caption font-medium leading-tight ${on ? 'text-ink' : 'text-muted'}`}>{o}</span>
            </button>
          )
        })}
      </div>
      <div className="flex max-w-md gap-1.5">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onFocus={onFocus}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustom()
            }
          }}
          placeholder={customPlaceholder}
          className="h-8 flex-1 rounded-full border border-dashed border-line px-3 text-caption text-ink outline-none focus:border-primary"
        />
        <button type="button" onClick={addCustom} className="inline-flex h-8 items-center gap-1 rounded-full border border-primary px-3 text-caption font-medium text-primary hover:bg-primary-light">
          <Plus size={12} /> 추가
        </button>
      </div>
    </div>
  )
}

// ---- Missions -----------------------------------------------------------
function BasicInfo({ hotel, setHotel, setHighlight }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <Q title="호텔의 기본 정보를 알려주세요" sub="정확한 기본정보는 고객이 호텔을 신뢰하고 검색에서 찾는 데 도움이 됩니다." />
      <Field label="호텔명 (영문)" required where="상세 상단 제목" example="Ohmy Grand Hotel Seoul">
        <TextInput value={hotel.name.EN} onChange={(v) => setHotel({ name: { ...hotel.name, EN: v } })} onFocus={() => setHighlight('name')} />
      </Field>
      <Field label="성급" example="4성급">
        <ChipSingle options={['1', '2', '3', '4', '5']} value={hotel.grade} onChange={(v) => setHotel({ grade: v })} onFocus={() => setHighlight('stars')} />
      </Field>
      <Field label="연락처" required example="+82-2-733-0550">
        <TextInput value={hotel.phone} onChange={(v) => setHotel({ phone: v })} onFocus={() => setHighlight('name')} />
      </Field>
      <Field label="주소 (영문)" required where="상세 상단 주소" example="120 Sejong-daero, Jung-gu, Seoul">
        <TextInput value={hotel.addresses.EN} onChange={(v) => setHotel({ addresses: { ...hotel.addresses, EN: v } })} onFocus={() => setHighlight('address')} />
      </Field>
      <Field label="우편번호" example="04520">
        <TextInput value={hotel.postCode} onChange={(v) => setHotel({ postCode: v })} onFocus={() => setHighlight('address')} />
      </Field>
    </div>
  )
}

function Description({ hotel, setHotel, rooms, setHighlight }: Props) {
  const [tone, setTone] = useState<Tone>('rich')
  const [draft, setDraft] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const gaps = describeGaps(hotel, rooms)

  const setDesc = (v: string) => setHotel({ descriptions: { ...hotel.descriptions, EN: v }, description: v })
  const generate = () => {
    setLoading(true)
    // Simulate AI latency, then compose from the hotel's own data.
    window.setTimeout(() => {
      setDraft(enrichDescription(hotel, rooms, tone))
      setLoading(false)
      setHighlight('description')
    }, 550)
  }

  const TONES: { key: Tone; label: string }[] = [
    { key: 'standard', label: '간결하게' },
    { key: 'rich', label: '표준' },
    { key: 'warm', label: '감성적으로' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Q title="호텔을 소개해 주세요" sub="호텔의 매력을 설명하면 고객이 예약을 결정하는 데 도움이 됩니다." />
      <Field label="호텔 설명 (영문)" where="상세 '호텔 소개' 영역" example="위치, 분위기, 대표 시설, 주변 명소를 2~3문장으로 소개해 보세요.">
        <textarea
          value={hotel.descriptions.EN}
          onChange={(e) => setDesc(e.target.value)}
          onFocus={() => setHighlight('description')}
          className="min-h-[120px] w-full rounded border border-line px-3 py-2 text-md leading-relaxed outline-none focus:border-primary"
          placeholder="A flagship 5-star hotel in downtown Seoul overlooking Gyeongbokgung Palace…"
        />
        <p className="mt-1 text-caption text-muted">{hotel.descriptions.EN.trim().length}자 · 100자 이상 작성하면 상세 설명 점수를 받을 수 있습니다.</p>
      </Field>

      {/* AI enrichment */}
      <div className="rounded-md border border-primary/30 bg-primary-light/40 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-md font-semibold text-ink">
            <Sparkles size={15} className="text-primary" /> AI로 설명 풍성화
          </span>
          <div className="flex gap-1">
            {TONES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTone(t.key)}
                className={`rounded-full border px-2 py-0.5 text-caption ${tone === t.key ? 'border-primary bg-primary text-white' : 'border-line text-muted hover:border-primary'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-2 text-caption text-muted">
          입력한 성급·시설·객실·주변 정보를 바탕으로 AI가 초안을 작성합니다 (프로토타입). 생성 후 검토하고 사용하세요.
        </p>
        {gaps.length > 0 && (
          <p className="mb-2 text-caption text-[#9a6a00]">
            <b>{gaps.join(', ')}</b>을(를) 채우면 더 풍성한 설명을 만들 수 있습니다.
          </p>
        )}
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex h-control items-center gap-1.5 rounded bg-primary px-3 text-md font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />} {loading ? 'AI가 작성 중…' : draft ? '다시 생성' : 'AI 초안 생성'}
        </button>

        {draft && !loading && (
          <div className="mt-3 rounded border border-line bg-white p-3">
            <div className="mb-1 flex items-center gap-1.5 text-caption font-semibold text-primary">
              <Sparkles size={12} /> AI 초안 <span className="rounded-sm bg-warning/15 px-1 text-[10px] font-normal text-[#9a6a00]">검토 필요</span>
            </div>
            <p className="whitespace-pre-line text-md leading-relaxed text-ink">{draft}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={() => { setDesc(draft); setDraft(null); setHighlight('description') }} className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1 text-caption font-semibold text-white hover:bg-primary-hover">
                <Check size={12} /> 적용 (교체)
              </button>
              <button onClick={() => { setDesc((hotel.descriptions.EN ? hotel.descriptions.EN.trim() + '\n\n' : '') + draft); setDraft(null); setHighlight('description') }} className="inline-flex items-center gap-1 rounded border border-line px-3 py-1 text-caption text-ink hover:bg-canvas">
                기존 내용에 이어붙이기
              </button>
              <button onClick={() => setDraft(null)} className="rounded border border-line px-3 py-1 text-caption text-muted hover:bg-canvas">
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Location({ hotel, setHotel, setHighlight }: Props) {
  const [place, setPlace] = useState('')
  const hasMap = typeof hotel.latitude === 'number'
  return (
    <div className="flex flex-col gap-4">
      <Q title="위치와 주변 정보를 알려주세요" sub="위치와 주변 정보는 고객이 여행 동선을 계획하는 데 도움이 됩니다." />
      <Field label="지도 위치" where="상세 '위치 및 주변' 지도">
        <div className="flex items-center gap-2">
          <div
            className="flex h-24 flex-1 items-center justify-center rounded border border-line bg-canvas text-caption text-muted"
            onMouseEnter={() => setHighlight('nearby')}
          >
            <MapPin size={16} className="mr-1 text-primary" />
            {hasMap ? `위치 지정됨 (${hotel.latitude?.toFixed(4)}, ${hotel.longitude?.toFixed(4)})` : '지도에서 위치를 지정하세요 (mock)'}
          </div>
          <button
            onClick={() => {
              setHighlight('nearby')
              setHotel({ latitude: 37.5665 + Math.random() * 0.02, longitude: 126.978 + Math.random() * 0.02 })
            }}
            className="h-control rounded bg-primary px-3 text-md font-medium text-white hover:bg-primary-hover"
          >
            현재 위치로 지정
          </button>
        </div>
      </Field>
      <Field label="주변 정보 (3개 이상 추천)" where="상세 '위치 및 주변' 목록" example="Gwanghwamun Station · 0.3km">
        <div className="flex gap-2">
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            onFocus={() => setHighlight('nearby')}
            placeholder="장소명 입력 후 추가"
            className="h-control flex-1 rounded border border-line px-2.5 text-md outline-none focus:border-primary"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && place.trim()) {
                setHotel({ nearby: [...(hotel.nearby ?? []), { name: place.trim(), category: 'Attraction', distanceKm: Number((Math.random() * 2 + 0.2).toFixed(1)) }] })
                setPlace('')
              }
            }}
          />
          <button
            onClick={() => {
              if (place.trim()) {
                setHotel({ nearby: [...(hotel.nearby ?? []), { name: place.trim(), category: 'Attraction', distanceKm: Number((Math.random() * 2 + 0.2).toFixed(1)) }] })
                setPlace('')
              }
            }}
            className="h-control rounded border border-line px-3 text-md hover:bg-canvas"
          >
            추가
          </button>
        </div>
        <ul className="mt-2 flex flex-col gap-1">
          {(hotel.nearby ?? []).map((n, i) => (
            <li key={i} className="flex items-center justify-between rounded border border-line px-2 py-1 text-caption">
              <span>{n.name} · {n.distanceKm}km</span>
              <button className="text-faint hover:text-danger" onClick={() => setHotel({ nearby: (hotel.nearby ?? []).filter((_, j) => j !== i) })}>삭제</button>
            </li>
          ))}
        </ul>
      </Field>
    </div>
  )
}

function Facilities({ hotel, setHotel, setHighlight }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <Q title="어떤 시설과 서비스를 제공하나요?" sub="시설 정보는 검색 필터 노출과 고객 기대치 관리에 도움이 됩니다." />
      <Field label="시설 및 서비스 선택" where="상세 '주요 시설' 영역">
        <CardMulti
          options={FACILITY_OPTIONS}
          value={hotel.facilities}
          onChange={(v) => setHotel({ facilities: v })}
          onFocus={() => setHighlight('facilities')}
          customPlaceholder="목록에 없는 시설·서비스 직접 추가 (예: 루프탑 인피니티 풀)"
        />
        <p className="mt-2 text-caption text-muted">3개 이상 선택하면 기본 점수를, 8개 이상이면 추가 점수를 받을 수 있습니다. 목록에 없으면 직접 추가하세요.</p>
      </Field>
      {hotel.facilities.some((f) => /pool/i.test(f)) && !hotel.images.some((i) => i.category === 'pool') && (
        <div className="flex items-start gap-2 rounded-md border border-info/40 bg-info/10 px-3 py-2 text-caption text-info">
          <Sparkles size={14} className="mt-0.5 shrink-0" />
          <span>수영장을 시설로 등록했습니다. ‘호텔 사진’ 미션에서 수영장 사진을 추가하면 고객 신뢰도를 높이는 데 도움이 됩니다.</span>
        </div>
      )}
    </div>
  )
}

function HotelPhotos({ hotel, setHotel, setHighlight }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <Q title="호텔 사진을 추가해 주세요" sub="풍부한 호텔 사진은 고객이 호텔 분위기를 이해하는 데 가장 큰 도움이 됩니다." />
      <div onMouseEnter={() => setHighlight('gallery')}>
        <PhotoManager
          images={hotel.images}
          onChange={(images) => {
            setHighlight('gallery')
            setHotel({ images })
          }}
          categories={['exterior', 'lobby', 'restaurant', 'pool', 'facility', 'other']}
          recommend={[
            { cat: 'exterior', label: '외관' },
            { cat: 'lobby', label: '로비' },
            { cat: 'restaurant', label: '레스토랑' },
            { cat: 'facility', label: '주요 시설' },
          ]}
          namePrefix="hotel"
        />
      </div>
      <button
        onClick={() => setHotel({ images: hotel.images.map((i) => ({ ...i, tags: i.tags?.length ? i.tags : [i.category ?? 'other'] })) })}
        className="w-fit rounded border border-line px-3 py-1.5 text-caption text-muted hover:border-primary hover:text-primary"
      >
        모든 사진에 태그 자동 설정 (+점수)
      </button>
    </div>
  )
}

function RoomInfo({ rooms, setRoom, setHighlight }: Props) {
  const [seq, setSeq] = useState(rooms[0]?.seq ?? 0)
  const room = rooms.find((r) => r.seq === seq) ?? rooms[0]
  if (!room) return <p className="py-8 text-center text-muted">이 호텔에는 등록된 객실이 없습니다.</p>
  return (
    <div className="flex flex-col gap-4">
      <Q title="객실의 기본 정보를 알려주세요" sub="정확한 객실 정보는 고객이 알맞은 객실을 고르는 데 도움이 됩니다." />
      <div className="flex flex-wrap gap-1.5">
        {rooms.map((r) => (
          <button
            key={r.seq}
            onClick={() => setSeq(r.seq)}
            className={`rounded-full border px-2.5 py-1 text-caption ${r.seq === seq ? 'border-primary bg-primary-light text-primary' : 'border-line text-muted hover:border-primary'}`}
          >
            {r.name.EN}
          </button>
        ))}
      </div>
      <Field label="객실 크기 (㎡)" example="32">
        <input
          type="number"
          value={room.sizeSqm ?? ''}
          onChange={(e) => setRoom(room.seq, { sizeSqm: e.target.value ? Number(e.target.value) : undefined })}
          onFocus={() => setHighlight('rooms')}
          className="h-control w-32 rounded border border-line px-2.5 text-md outline-none focus:border-primary"
        />
      </Field>
      <Field label="침대 구성" example="1 King Bed">
        <ChipSingle options={BED_OPTIONS} value={room.bedConfig ?? ''} onChange={(v) => setRoom(room.seq, { bedConfig: v })} onFocus={() => setHighlight('rooms')} />
      </Field>
      <Field label="최대 투숙인원" example="2">
        <input
          type="number"
          value={room.maxOccupancy}
          onChange={(e) => setRoom(room.seq, { maxOccupancy: Number(e.target.value) })}
          onFocus={() => setHighlight('rooms')}
          className="h-control w-32 rounded border border-line px-2.5 text-md outline-none focus:border-primary"
        />
      </Field>
      <Field label="객실 전망" example="City View">
        <ChipSingle options={VIEW_OPTIONS} value={room.view ?? ''} onChange={(v) => setRoom(room.seq, { view: v })} onFocus={() => setHighlight('rooms')} />
      </Field>
      <Field label="객실 편의시설 (3개 이상 추천)">
        <ChipMulti
          options={ROOM_AMENITIES}
          value={room.amenities}
          onChange={(v) => setRoom(room.seq, { amenities: v })}
          onFocus={() => setHighlight('rooms')}
          withIcon
          allowCustom
          customPlaceholder="목록에 없는 편의시설 직접 추가"
        />
      </Field>
    </div>
  )
}

function RoomPhotos({ rooms, setRoom, setHighlight }: Props) {
  const [seq, setSeq] = useState(rooms[0]?.seq ?? 0)
  const room = rooms.find((r) => r.seq === seq) ?? rooms[0]
  if (!room) return <p className="py-8 text-center text-muted">이 호텔에는 등록된 객실이 없습니다.</p>
  return (
    <div className="flex flex-col gap-4">
      <Q title="객실 사진을 추가해 주세요" sub="객실 사진은 고객이 객실 구조를 이해하고 예약을 결정하는 데 도움이 됩니다." />
      <div className="flex flex-wrap gap-1.5">
        {rooms.map((r) => (
          <button
            key={r.seq}
            onClick={() => setSeq(r.seq)}
            className={`rounded-full border px-2.5 py-1 text-caption ${r.seq === seq ? 'border-primary bg-primary-light text-primary' : 'border-line text-muted hover:border-primary'} ${
              r.images.length === 0 ? 'ring-1 ring-warning/50' : ''
            }`}
          >
            {r.name.EN} ({r.images.length})
          </button>
        ))}
      </div>
      <p className="text-caption text-muted">객실당 4장 이상, 침실과 욕실 사진을 각각 1장 이상 추가하는 것을 권장합니다.</p>
      <div onMouseEnter={() => setHighlight('roomPhotos')}>
        <PhotoManager
          images={room.images}
          onChange={(images) => {
            setHighlight('roomPhotos')
            setRoom(room.seq, { images })
          }}
          categories={['bedroom', 'bathroom', 'view', 'room']}
          recommend={[
            { cat: 'bedroom', label: '침실' },
            { cat: 'bathroom', label: '욕실' },
          ]}
          namePrefix={`room${room.seq}`}
        />
      </div>
    </div>
  )
}

function Policies({ hotel, setHotel, setHighlight }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <Q title="정책과 이용정보를 알려주세요" sub="명확한 정책은 고객의 오해를 줄이고 신뢰를 높이는 데 도움이 됩니다." />
      <div className="grid grid-cols-2 gap-4">
        <Field label="체크인 시간" required where="상세 '이용 안내'" example="15:00">
          <input type="time" value={to24(hotel.checkIn)} onChange={(e) => setHotel({ checkIn: e.target.value })} onFocus={() => setHighlight('checkin')} className="h-control w-full rounded border border-line px-2.5 text-md outline-none focus:border-primary" />
        </Field>
        <Field label="체크아웃 시간" required where="상세 '이용 안내'" example="11:00">
          <input type="time" value={to24(hotel.checkOut)} onChange={(e) => setHotel({ checkOut: e.target.value })} onFocus={() => setHighlight('checkin')} className="h-control w-full rounded border border-line px-2.5 text-md outline-none focus:border-primary" />
        </Field>
      </div>
      <Field label="이용 정책 (2개 이상 추천)" where="상세 '이용 안내' 목록">
        <ChipMulti
          options={POLICY_OPTIONS}
          value={hotel.policies}
          onChange={(v) => setHotel({ policies: v })}
          onFocus={() => setHighlight('policies')}
          allowCustom
          customPlaceholder="목록에 없는 정책 직접 추가 (예: 오전 10시 이후 조식 미제공)"
        />
      </Field>
    </div>
  )
}

function Multilingual({ hotel, setHotel, setHighlight }: Props) {
  const [source, setSource] = useState<keyof LangText>('EN')
  // Review status per field:lang — 'need' after AI translate, 'done' after 확인.
  const [reviewed, setReviewed] = useState<Record<string, 'need' | 'done'>>(() => {
    const init: Record<string, 'need' | 'done'> = {}
    LANGS.forEach((l) => {
      if (hotel.translationReview?.[l]) init[`desc:${l}`] = 'need'
    })
    return init
  })
  const others = LANGS.filter((l) => l !== source)

  const clearStatus = (key: string) => setReviewed((r) => { const n = { ...r }; delete n[key]; return n })
  const setName = (l: keyof LangText, v: string) => { setHotel({ name: { ...hotel.name, [l]: v } }); clearStatus(`name:${l}`) }
  const setDesc = (l: keyof LangText, v: string) => { const d = { ...hotel.descriptions, [l]: v }; setHotel({ descriptions: d, description: d.EN }); clearStatus(`desc:${l}`) }

  const translate = (field: 'name' | 'desc', targets: (keyof LangText)[]) => {
    const src = (field === 'name' ? hotel.name[source] : hotel.descriptions[source])?.trim()
    if (!src || targets.length === 0) return
    if (field === 'name') {
      const p = { ...hotel.name }
      targets.forEach((l) => (p[l] = translateDraft(src, l)))
      setHotel({ name: p })
    } else {
      const p = { ...hotel.descriptions }
      targets.forEach((l) => (p[l] = translateDraft(src, l)))
      setHotel({ descriptions: p, description: p.EN, translationReview: { ...hotel.translationReview, ...Object.fromEntries(targets.map((l) => [l, true])) } })
    }
    setReviewed((r) => { const n = { ...r }; targets.forEach((l) => (n[`${field}:${l}`] = 'need')); return n })
    setHighlight(field === 'desc' ? 'description' : 'name')
  }
  const confirm = (field: 'name' | 'desc', l: keyof LangText) => {
    setReviewed((r) => ({ ...r, [`${field}:${l}`]: 'done' }))
    if (field === 'desc') setHotel({ translationReview: { ...hotel.translationReview, [l]: false } })
  }

  const missing = (field: 'name' | 'desc') => others.filter((l) => !((field === 'name' ? hotel.name[l] : hotel.descriptions[l])?.trim()))
  const translateAll = () => { translate('name', missing('name')); translate('desc', missing('desc')) }
  const needReviewCount = Object.values(reviewed).filter((v) => v === 'need').length

  return (
    <div className="flex flex-col gap-4">
      <Q title="다국어 콘텐츠를 AI로 완성해 보세요" sub="기준 언어로 입력하면 AI가 나머지 언어로 번역합니다. 번역 결과는 ‘검토 필요’로 표시되며, 호텔은 내용이 맞는지 확인만 하면 됩니다." />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary-light/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-md font-semibold text-ink"><Languages size={15} className="text-primary" /> 기준 언어</span>
          <div className="flex flex-wrap gap-1">
            {LANGS.map((l) => (
              <button key={l} onClick={() => setSource(l)} aria-pressed={source === l} className={`rounded-full border px-2.5 py-1 text-caption ${source === l ? 'border-primary bg-primary text-white' : 'border-line text-muted hover:border-primary'}`}>
                {LANG_LABEL[l]}
              </button>
            ))}
          </div>
        </div>
        <button onClick={translateAll} className="inline-flex h-control items-center gap-1.5 rounded bg-primary px-3 text-md font-semibold text-white hover:bg-primary-hover">
          <Wand2 size={14} /> AI로 나머지 언어 자동 번역
        </button>
      </div>
      {needReviewCount > 0 && (
        <p className="-mt-2 text-caption text-[#9a6a00]">검토가 필요한 번역 {needReviewCount}건이 있습니다. 내용을 확인하고 ‘확인’을 눌러 주세요.</p>
      )}

      <LangField label="호텔명" field="name" source={source} values={hotel.name} status={reviewed} onSet={setName} onTranslateOne={(l) => translate('name', [l])} onConfirm={(l) => confirm('name', l)} />
      <LangField label="호텔 설명" field="desc" textarea source={source} values={hotel.descriptions} status={reviewed} onSet={setDesc} onTranslateOne={(l) => translate('desc', [l])} onConfirm={(l) => confirm('desc', l)} />
    </div>
  )
}

function LangField({
  label,
  field,
  source,
  values,
  status,
  onSet,
  onTranslateOne,
  onConfirm,
  textarea,
}: {
  label: string
  field: 'name' | 'desc'
  source: keyof LangText
  values: LangText
  status: Record<string, 'need' | 'done'>
  onSet: (l: keyof LangText, v: string) => void
  onTranslateOne: (l: keyof LangText) => void
  onConfirm: (l: keyof LangText) => void
  textarea?: boolean
}) {
  const doneCount = LANGS.filter((l) => values[l]?.trim()).length
  return (
    <div className="rounded-md border border-line p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-md font-semibold text-ink">{label}</span>
        <span className="text-caption text-muted">{doneCount}/{LANGS.length} 언어</span>
      </div>
      <div className="flex flex-col gap-2">
        {LANGS.map((l) => {
          const isSource = l === source
          const filled = !!values[l]?.trim()
          const st = status[`${field}:${l}`]
          return (
            <div key={l} className="flex items-start gap-2">
              <span className="mt-2 flex w-20 shrink-0 items-center gap-1 text-caption text-muted">
                {LANG_LABEL[l]}
                {isSource && <span className="rounded-sm bg-primary/10 px-1 text-[9px] font-semibold text-primary">기준</span>}
              </span>
              {textarea ? (
                <textarea value={values[l] ?? ''} onChange={(e) => onSet(l, e.target.value)} className={`min-h-[46px] flex-1 rounded border px-2 py-1 text-md outline-none focus:border-primary ${st === 'need' ? 'border-warning/60 bg-warning/5' : 'border-line'}`} />
              ) : (
                <input value={values[l] ?? ''} onChange={(e) => onSet(l, e.target.value)} className={`h-control flex-1 rounded border px-2 text-md outline-none focus:border-primary ${st === 'need' ? 'border-warning/60 bg-warning/5' : 'border-line'}`} />
              )}
              <div className="flex w-[92px] shrink-0 flex-col items-end gap-1 pt-1">
                {isSource ? (
                  <span className="text-[10px] text-muted">기준 언어</span>
                ) : !filled ? (
                  <button onClick={() => onTranslateOne(l)} className="inline-flex items-center gap-0.5 rounded border border-primary px-2 py-0.5 text-[10px] text-primary hover:bg-primary-light">
                    <Wand2 size={10} /> AI 번역
                  </button>
                ) : st === 'need' ? (
                  <>
                    <span className="rounded-sm bg-warning/15 px-1 text-[10px] text-[#9a6a00]">검토 필요</span>
                    <button onClick={() => onConfirm(l)} className="inline-flex items-center gap-0.5 rounded border border-success/50 px-2 py-0.5 text-[10px] text-success hover:bg-success/10">
                      <Check size={10} /> 확인
                    </button>
                  </>
                ) : (
                  <span className="flex items-center gap-0.5 text-[10px] text-success"><CheckCircle2 size={10} /> 완료</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Review({ hotel }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <Q title="최종 점검" sub="게시 전 고객 화면(오른쪽 미리보기)에서 정보가 올바르게 표시되는지 확인하세요." />
      <ul className="flex flex-col gap-2 text-md text-ink">
        <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-success" /> 대표 사진과 호텔명이 표시되는지 확인</li>
        <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-success" /> 객실별 사진과 정보가 정확한지 확인</li>
        <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-success" /> 체크인·체크아웃과 정책이 최신인지 확인</li>
        <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-success" /> 다국어 번역의 ‘검토 필요’ 항목 확인</li>
      </ul>
      <p className="text-caption text-muted">현재 게시 상태: <b className="text-ink">{hotel.publishStatus ?? 'Draft'}</b></p>
    </div>
  )
}

/** Normalize "3:00 PM"/"15:00" to a 24h HH:MM for the time input. */
function to24(v: string): string {
  if (!v) return ''
  if (/^\d{1,2}:\d{2}$/.test(v)) return v.padStart(5, '0')
  return v
}
