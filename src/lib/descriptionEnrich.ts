/**
 * Prototype "AI" hotel-description enrichment. Composes a richer, natural-reading
 * description from the hotel's own structured data (star, type, location, nearby,
 * facilities, room types, check-in/out). No backend or LLM — deterministic and
 * testable. In production this is where a real text-generation model would plug
 * in; the interface (hotel + rooms + tone → text) stays the same.
 */
import type { Hotel, RoomType } from '../data/types'

export type Tone = 'standard' | 'rich' | 'warm'

const WELLNESS = /(pool|spa|sauna|fitness|gym|onsen)/i
const DINING = /(restaurant|bar|breakfast|lounge|cafe|dining)/i
const SERVICE = /(wi-?fi|parking|shuttle|concierge|24h|business|laundry|valet|room service)/i

function starWord(grade: string): string {
  const n = Number(grade)
  return n >= 1 && n <= 5 ? `${n}-star ` : ''
}

function joinList(items: string[], max = 3): string {
  const list = items.slice(0, max)
  if (list.length === 0) return ''
  if (list.length === 1) return list[0]
  if (list.length === 2) return `${list[0]} and ${list[1]}`
  return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`
}

/** Build an enriched description paragraph from the hotel's data. */
export function enrichDescription(hotel: Hotel, rooms: RoomType[], tone: Tone = 'rich'): string {
  const name = hotel.name.EN?.trim() || 'This property'
  const type = (hotel.hotelType || 'hotel').toLowerCase()
  const loc = hotel.regionName
    ? `in ${hotel.regionName}${hotel.country && hotel.country !== hotel.regionName ? `, ${hotel.country}` : ''}`
    : hotel.country
      ? `in ${hotel.country}`
      : ''
  const sentences: string[] = []

  // 1) Opening
  if (tone === 'warm') sentences.push(`Welcome to ${name}, a ${starWord(hotel.grade)}${type} where comfort meets convenience${loc ? ' ' + loc : ''}.`)
  else if (tone === 'standard') sentences.push(`${name} is a ${starWord(hotel.grade)}${type}${loc ? ' ' + loc : ''}.`)
  else sentences.push(`${name} is a welcoming ${starWord(hotel.grade)}${type}${loc ? ' ' + loc : ''}, offering a comfortable base for every kind of traveller.`)

  // 2) Location & nearby
  if (hotel.nearby && hotel.nearby.length) {
    const nearest = [...hotel.nearby].sort((a, b) => a.distanceKm - b.distanceKm)[0]
    const names = hotel.nearby.map((n) => n.name)
    sentences.push(`It is conveniently close to ${joinList(names)}${nearest ? `, just ${nearest.distanceKm} km from ${nearest.name}` : ''}.`)
  }

  // 3) Facilities, grouped for readability
  const wellness = hotel.facilities.filter((f) => WELLNESS.test(f))
  const dining = hotel.facilities.filter((f) => DINING.test(f))
  const service = hotel.facilities.filter((f) => SERVICE.test(f))
  const facBits: string[] = []
  if (wellness.length) facBits.push(`unwind with ${joinList(wellness)}`)
  if (dining.length) facBits.push(`dine at ${joinList(dining)}`)
  if (service.length) facBits.push(`rely on ${joinList(service)}`)
  if (facBits.length) sentences.push(`Guests can ${joinList(facBits, 3)}.`)
  else if (hotel.facilities.length) sentences.push(`On-site facilities include ${joinList(hotel.facilities, 4)}.`)

  // 4) Rooms
  if (rooms.length) {
    const roomNames = joinList(rooms.map((r) => r.name.EN).filter(Boolean), 3)
    const sizes = rooms.map((r) => r.sizeSqm ?? 0).filter((s) => s > 0)
    const sizePhrase = sizes.length ? ` ranging from ${Math.min(...sizes)} to ${Math.max(...sizes)} m²` : ''
    const commonAmenities = [...new Set(rooms.flatMap((r) => r.amenities))]
    const amenityPhrase = commonAmenities.length ? `, appointed with ${joinList(commonAmenities, 3)}` : ''
    sentences.push(`Choose from ${rooms.length} room type${rooms.length > 1 ? 's' : ''}${roomNames ? ` — including ${roomNames}` : ''}${sizePhrase}${amenityPhrase}.`)
  }

  // 5) Check-in / out
  if (hotel.checkIn && hotel.checkOut) sentences.push(`Check-in is from ${hotel.checkIn}, with check-out until ${hotel.checkOut}.`)

  // 6) Closing (tone)
  if (tone === 'warm') sentences.push(`Whether you are travelling for business or leisure, ${name} is ready to make your stay memorable.`)
  else if (tone === 'rich') sentences.push(`${name} is a convenient and comfortable choice for both business and leisure stays.`)

  return sentences.join(' ').replace(/\s+/g, ' ').trim()
}

/** Suggest which fields, if filled, would let the AI write a richer description. */
export function describeGaps(hotel: Hotel, rooms: RoomType[]): string[] {
  const gaps: string[] = []
  if (hotel.facilities.length < 3) gaps.push('시설 및 서비스')
  if (!hotel.nearby || hotel.nearby.length === 0) gaps.push('주변 정보')
  if (rooms.every((r) => !r.sizeSqm)) gaps.push('객실 크기')
  if (!hotel.grade) gaps.push('성급')
  return gaps
}
