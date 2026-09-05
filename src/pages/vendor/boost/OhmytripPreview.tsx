import { MapPin, Star, Wifi, Coffee, Waves, Dumbbell, Car, Utensils, Check } from 'lucide-react'
import type { Hotel, RoomType } from '../../../data/types'
import type { HighlightKey } from './highlight'

/**
 * In-console reproduction of the OHMYTRIP customer hotel-detail page. Renders
 * the DRAFT data live (before save) so hotel staff see exactly how their input
 * appears to customers. Brand: Pretendard + #EF7F29, clean white cards.
 */
export function OhmytripPreview({
  hotel,
  rooms,
  highlight,
  device,
}: {
  hotel: Hotel
  rooms: RoomType[]
  highlight: HighlightKey
  device: 'desktop' | 'mobile'
}) {
  const rep = hotel.images.find((i) => i.isRepresentative) ?? hotel.images[0]
  const gallery = hotel.images.slice(0, 5)
  const stars = Number(hotel.grade) || 0
  const width = device === 'mobile' ? 380 : '100%'

  return (
    <div className="flex justify-center">
      <div
        className="overflow-hidden rounded-lg border border-line bg-white"
        style={{ width, maxWidth: '100%', fontFamily: 'Pretendard, sans-serif' }}
      >
        {/* OHMYTRIP header */}
        <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
          <span className="text-md font-extrabold text-primary">OHMYTRIP</span>
          <span className="text-[10px] text-muted">by OHMYHOTEL</span>
        </div>

        <div className="max-h-[calc(100vh-230px)] overflow-y-auto">
          {/* Gallery */}
          <Region on={highlight === 'gallery' || highlight === 'roomPhotos'}>
            <div className={device === 'mobile' ? 'flex flex-col gap-1' : 'grid grid-cols-4 gap-1'}>
              <div className={device === 'mobile' ? '' : 'col-span-2 row-span-2'}>
                {rep ? (
                  <img src={rep.url} alt={hotel.name.EN} className="h-44 w-full object-cover md:h-full" />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-canvas text-caption text-faint">사진을 추가해 주세요</div>
                )}
              </div>
              {device === 'desktop' &&
                gallery.slice(1, 5).map((im) => <img key={im.id} src={im.url} alt={im.caption} className="h-[86px] w-full object-cover" />)}
            </div>
          </Region>

          <div className="flex flex-col gap-4 p-4">
            {/* Name + stars + address */}
            <div>
              <Region on={highlight === 'stars'} inline>
                <div className="mb-0.5 flex items-center gap-0.5 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill={i < stars ? '#EF7F29' : 'none'} className={i < stars ? '' : 'text-line'} />
                  ))}
                  {stars > 0 && <span className="ml-1 text-caption text-muted">{stars}성급</span>}
                </div>
              </Region>
              <Region on={highlight === 'name'} inline>
                <h2 className="text-xl font-bold text-ink">{hotel.name.EN || '호텔명을 입력해 주세요'}</h2>
              </Region>
              <Region on={highlight === 'address'} inline>
                <p className="mt-1 flex items-center gap-1 text-caption text-muted">
                  <MapPin size={12} /> {hotel.addresses?.EN || hotel.address || '주소를 입력해 주세요'}
                </p>
              </Region>
            </div>

            {/* Facilities */}
            <Region on={highlight === 'facilities'}>
              <Section title="주요 시설">
                {hotel.facilities.length === 0 ? (
                  <p className="text-caption text-faint">시설을 선택해 주세요</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {hotel.facilities.map((f) => (
                      <span key={f} className="flex items-center gap-1 rounded-md bg-canvas px-2 py-1 text-caption text-ink">
                        <FacilityIcon name={f} /> {f}
                      </span>
                    ))}
                  </div>
                )}
              </Section>
            </Region>

            {/* Description */}
            <Region on={highlight === 'description'}>
              <Section title="호텔 소개">
                <p className="whitespace-pre-line text-md leading-relaxed text-ink">
                  {hotel.descriptions?.EN || hotel.description || '호텔 설명을 입력하면 이곳에 표시됩니다.'}
                </p>
              </Section>
            </Region>

            {/* Rooms */}
            <Region on={highlight === 'rooms' || highlight === 'roomPhotos'}>
              <Section title="객실 선택">
                <div className="flex flex-col gap-2">
                  {rooms.length === 0 && <p className="text-caption text-faint">객실 정보를 입력해 주세요</p>}
                  {rooms.map((rm) => {
                    const img = rm.images.find((i) => i.isRepresentative) ?? rm.images[0]
                    return (
                      <div key={rm.seq} className="flex gap-3 rounded-md border border-line p-2">
                        {img ? (
                          <img src={img.url} alt={rm.name.EN} className="h-20 w-28 shrink-0 rounded object-cover" />
                        ) : (
                          <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded bg-canvas text-[10px] text-faint">
                            객실 사진 없음
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-md font-semibold text-ink">{rm.name.EN}</div>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-caption text-muted">
                            {rm.sizeSqm ? <span>{rm.sizeSqm}㎡</span> : null}
                            {rm.bedConfig ? <span>{rm.bedConfig}</span> : null}
                            <span>최대 {rm.maxOccupancy}인</span>
                            {rm.view ? <span>{rm.view}</span> : null}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {rm.amenities.slice(0, 4).map((a) => (
                              <span key={a} className="rounded-sm bg-canvas px-1.5 py-0.5 text-[10px] text-muted">
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="shrink-0 self-end text-right">
                          <div className="text-md font-bold text-primary">${rm.localPrice}</div>
                          <button className="mt-1 rounded bg-primary px-2 py-1 text-[10px] font-semibold text-white">객실 예약</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Section>
            </Region>

            {/* Policies & check-in/out */}
            <Region on={highlight === 'policies' || highlight === 'checkin'}>
              <Section title="이용 안내">
                <div className="mb-2 flex gap-4 text-md">
                  <span className="text-muted">
                    체크인 <b className="text-ink">{hotel.checkIn || '—'}</b>
                  </span>
                  <span className="text-muted">
                    체크아웃 <b className="text-ink">{hotel.checkOut || '—'}</b>
                  </span>
                </div>
                <ul className="flex flex-col gap-1">
                  {hotel.policies.length === 0 && <li className="text-caption text-faint">정책을 입력해 주세요</li>}
                  {hotel.policies.map((p) => (
                    <li key={p} className="flex items-start gap-1.5 text-caption text-ink">
                      <Check size={12} className="mt-0.5 shrink-0 text-success" /> {p}
                    </li>
                  ))}
                </ul>
              </Section>
            </Region>

            {/* Nearby */}
            <Region on={highlight === 'nearby'}>
              <Section title="위치 및 주변">
                {(hotel.nearby?.length ?? 0) === 0 ? (
                  <p className="text-caption text-faint">주변 정보를 추가해 주세요</p>
                ) : (
                  <ul className="flex flex-col gap-1 text-caption text-ink">
                    {hotel.nearby!.map((n) => (
                      <li key={n.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <MapPin size={11} className="text-primary" /> {n.name}
                        </span>
                        <span className="text-muted">{n.distanceKm} km</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </Region>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-md font-bold text-ink">{title}</h3>
      {children}
    </section>
  )
}

/** Wraps a preview region and pulses it when `on` becomes true. */
function Region({ on, inline, children }: { on: boolean; inline?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`${inline ? '' : 'rounded-md'} transition-all duration-500 ${
        on ? 'bg-primary/10 ring-2 ring-primary ring-offset-2' : 'ring-0'
      }`}
    >
      {children}
    </div>
  )
}

function FacilityIcon({ name }: { name: string }) {
  const n = name.toLowerCase()
  const cls = 'text-primary'
  if (n.includes('wi-fi') || n.includes('wifi')) return <Wifi size={12} className={cls} />
  if (n.includes('pool')) return <Waves size={12} className={cls} />
  if (n.includes('fitness') || n.includes('gym')) return <Dumbbell size={12} className={cls} />
  if (n.includes('parking') || n.includes('valet')) return <Car size={12} className={cls} />
  if (n.includes('restaurant') || n.includes('dining')) return <Utensils size={12} className={cls} />
  if (n.includes('breakfast') || n.includes('lounge') || n.includes('bar')) return <Coffee size={12} className={cls} />
  return <Check size={12} className={cls} />
}
