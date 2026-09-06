/**
 * Content Strength Score service ("콘텐츠 경쟁력 점수").
 *
 * Pure, framework-free scoring of a hotel's content completeness out of 100,
 * following the category weights in docs/content-booster-spec.md. The UI reads
 * everything from here — no score numbers are hardcoded in components.
 */
import type { Hotel, RoomType, HotelImage } from '../data/types'

export type CategoryKey =
  | 'hotel-photos'
  | 'room-photos'
  | 'room-info'
  | 'facilities'
  | 'basic-location'
  | 'policies'
  | 'description'
  | 'multilingual'

export type MissionKey =
  | 'basic-info'
  | 'description'
  | 'location'
  | 'facilities'
  | 'hotel-photos'
  | 'room-info'
  | 'room-photos'
  | 'policies'
  | 'multilingual'
  | 'review'

export interface ScoreItem {
  key: string
  label: string
  labelKo: string
  points: number
  earned: boolean
  category: CategoryKey
  section: MissionKey
  required: boolean
  estMinutes: number
  /** Why this helps sales / the customer (allowed, non-guaranteeing phrasing). */
  whyKo: string
}

export interface CategoryScore {
  key: CategoryKey
  label: string
  labelKo: string
  max: number
  earned: number
  items: ScoreItem[]
}

export interface MissionScore {
  key: MissionKey
  label: string
  labelKo: string
  max: number
  earned: number
  doneCount: number
  totalCount: number
  missingCount: number
  percent: number
  estMinutes: number
  status: 'Not started' | 'In progress' | 'Completed' | 'Needs review'
  whyKo: string
  items: ScoreItem[]
}

export interface ScoreBand {
  min: number
  max: number
  labelKo: string
  color: string
  tone: 'red' | 'orange' | 'yellow' | 'blue' | 'green'
}

export interface ScoreResult {
  total: number
  band: ScoreBand
  grade: string
  gradeColor: string
  categories: CategoryScore[]
  missions: MissionScore[]
  items: ScoreItem[]
  doneCount: number
  requiredRemaining: number
}

export const SCORE_BANDS: ScoreBand[] = [
  { min: 0, max: 39, labelKo: '시작 필요', color: '#D0021B', tone: 'red' },
  { min: 40, max: 59, labelKo: '기본 정보 부족', color: '#EF7F29', tone: 'orange' },
  { min: 60, max: 79, labelKo: '판매 준비 중', color: '#E1B000', tone: 'yellow' },
  { min: 80, max: 94, labelKo: '경쟁력 있음', color: '#1976D2', tone: 'blue' },
  { min: 95, max: 100, labelKo: '판매 준비 완료', color: '#2E7D32', tone: 'green' },
]

export function bandFor(score: number): ScoreBand {
  return SCORE_BANDS.find((b) => score >= b.min && score <= b.max) ?? SCORE_BANDS[0]
}

/** Letter grade (S+ … F) for a score, with a colour aligned to the band scale. */
const GRADE_TABLE: [number, string, string][] = [
  [95, 'S+', '#2E7D32'],
  [90, 'S', '#2E7D32'],
  [85, 'A+', '#1976D2'],
  [80, 'A', '#1976D2'],
  [75, 'A-', '#1976D2'],
  [70, 'B+', '#B48A00'],
  [65, 'B', '#B48A00'],
  [60, 'B-', '#B48A00'],
  [55, 'C+', '#EF7F29'],
  [45, 'C', '#EF7F29'],
  [30, 'D', '#C0362C'],
  [0, 'F', '#C0362C'],
]
export function gradeFor(score: number): { grade: string; color: string } {
  const row = GRADE_TABLE.find(([min]) => score >= min) ?? GRADE_TABLE[GRADE_TABLE.length - 1]
  return { grade: row[1], color: row[2] }
}

const CATEGORY_META: Record<CategoryKey, { label: string; labelKo: string }> = {
  'hotel-photos': { label: 'Hotel photos', labelKo: '호텔 사진' },
  'room-photos': { label: 'Room photos', labelKo: '객실 사진' },
  'room-info': { label: 'Room information', labelKo: '객실 정보' },
  facilities: { label: 'Facilities & services', labelKo: '시설 및 서비스' },
  'basic-location': { label: 'Basic info & location', labelKo: '호텔 기본정보와 위치' },
  policies: { label: 'Policies & usage', labelKo: '정책과 이용정보' },
  description: { label: 'Description & highlights', labelKo: '호텔 설명과 특징' },
  multilingual: { label: 'Multilingual', labelKo: '다국어 완성도' },
}

const MISSION_META: Record<MissionKey, { label: string; labelKo: string; whyKo: string }> = {
  'basic-info': { label: 'Basic info', labelKo: '기본정보', whyKo: '정확한 기본정보는 고객이 호텔을 신뢰하고 검색에서 찾는 데 도움이 됩니다.' },
  description: { label: 'Description', labelKo: '호텔 설명', whyKo: '호텔의 매력을 설명하면 고객이 예약을 결정하는 데 도움이 됩니다.' },
  location: { label: 'Location & nearby', labelKo: '위치 및 주변 정보', whyKo: '위치와 주변 정보는 고객이 여행을 계획하는 데 도움이 됩니다.' },
  facilities: { label: 'Facilities & services', labelKo: '시설 및 서비스', whyKo: '시설 정보는 검색 필터 노출과 고객 기대치 관리에 도움이 됩니다.' },
  'hotel-photos': { label: 'Hotel photos', labelKo: '호텔 사진', whyKo: '풍부한 호텔 사진은 고객이 호텔 분위기를 이해하는 데 가장 큰 도움이 됩니다.' },
  'room-info': { label: 'Room information', labelKo: '객실 정보', whyKo: '정확한 객실 정보는 고객이 알맞은 객실을 고르는 데 도움이 됩니다.' },
  'room-photos': { label: 'Room photos', labelKo: '객실 사진', whyKo: '객실 사진은 고객이 객실 구조를 이해하고 예약을 결정하는 데 도움이 됩니다.' },
  policies: { label: 'Policies & usage', labelKo: '정책 및 이용정보', whyKo: '명확한 정책은 고객의 오해를 줄이고 신뢰를 높이는 데 도움이 됩니다.' },
  multilingual: { label: 'Multilingual content', labelKo: '다국어 콘텐츠', whyKo: '다국어 콘텐츠는 더 많은 고객이 호텔을 이해하는 데 도움이 됩니다.' },
  review: { label: 'Final review', labelKo: '최종 점검', whyKo: '게시 전 최종 점검으로 고객 화면을 확인할 수 있습니다.' },
}

// ---- Predicate helpers --------------------------------------------------
const has = (s?: string) => !!s && s.trim().length > 0
const roomImages = (rooms: RoomType[]) => rooms.flatMap((r) => r.images)
const catCount = (imgs: HotelImage[], cat: string) => imgs.filter((i) => i.category === cat).length
const allRes = (imgs: HotelImage[]) => imgs.length > 0 && imgs.every((i) => (i.width ?? 0) >= 1024 && (i.height ?? 0) >= 768)
const tagged = (imgs: HotelImage[]) => imgs.filter((i) => (i.tags?.length ?? 0) > 0).length

interface ItemDef {
  key: string
  label: string
  labelKo: string
  points: number
  category: CategoryKey
  section: MissionKey
  required: boolean
  estMinutes: number
  whyKo: string
  test: (h: Hotel, rooms: RoomType[]) => boolean
}

const ITEMS: ItemDef[] = [
  // ---- Hotel photos (30) ----
  { key: 'rep-photo', label: 'Representative photo set', labelKo: '대표 사진 설정', points: 4, category: 'hotel-photos', section: 'hotel-photos', required: true, estMinutes: 1, whyKo: '대표 사진은 검색 결과와 상세 상단에 노출되어 첫인상을 결정합니다.', test: (h) => h.images.some((i) => i.isRepresentative) },
  { key: 'hotel-10', label: '10+ hotel photos', labelKo: '호텔 사진 10장 이상', points: 8, category: 'hotel-photos', section: 'hotel-photos', required: true, estMinutes: 5, whyKo: '사진이 많을수록 고객이 호텔 분위기를 더 잘 이해할 수 있습니다.', test: (h) => h.images.length >= 10 },
  { key: 'hotel-20', label: '20+ hotel photos', labelKo: '호텔 사진 20장 이상', points: 5, category: 'hotel-photos', section: 'hotel-photos', required: false, estMinutes: 5, whyKo: '충분한 사진은 고객의 예약 결정을 돕는 데 효과적입니다.', test: (h) => h.images.length >= 20 },
  { key: 'photo-lobby', label: 'Lobby photo', labelKo: '로비 사진', points: 2, category: 'hotel-photos', section: 'hotel-photos', required: false, estMinutes: 1, whyKo: '로비 사진은 호텔의 첫인상과 분위기를 전달합니다.', test: (h) => catCount(h.images, 'lobby') > 0 },
  { key: 'photo-exterior', label: 'Exterior photo', labelKo: '외관 사진', points: 2, category: 'hotel-photos', section: 'hotel-photos', required: false, estMinutes: 1, whyKo: '외관 사진은 고객이 호텔을 쉽게 찾는 데 도움이 됩니다.', test: (h) => catCount(h.images, 'exterior') > 0 },
  { key: 'photo-restaurant', label: 'Restaurant photo', labelKo: '레스토랑 사진', points: 2, category: 'hotel-photos', section: 'hotel-photos', required: false, estMinutes: 1, whyKo: '레스토랑 사진은 식음 시설에 대한 기대를 전달합니다.', test: (h) => catCount(h.images, 'restaurant') > 0 },
  { key: 'photo-facility', label: 'Key facility photos', labelKo: '주요 시설 사진', points: 3, category: 'hotel-photos', section: 'hotel-photos', required: false, estMinutes: 2, whyKo: '시설 사진은 고객 신뢰도를 높이는 데 도움이 됩니다.', test: (h) => catCount(h.images, 'facility') + catCount(h.images, 'pool') > 0 },
  { key: 'photo-res', label: 'All photos meet min resolution', labelKo: '모든 사진 최소 해상도 충족', points: 2, category: 'hotel-photos', section: 'hotel-photos', required: false, estMinutes: 2, whyKo: '선명한 사진은 고객에게 더 나은 인상을 줍니다.', test: (h) => allRes(h.images) },
  { key: 'photo-tags', label: 'Photo tags set', labelKo: '사진 태그 설정', points: 2, category: 'hotel-photos', section: 'hotel-photos', required: false, estMinutes: 2, whyKo: '사진 태그는 고객이 원하는 사진을 쉽게 찾도록 돕습니다.', test: (h) => tagged(h.images) >= Math.min(3, h.images.length) && h.images.length > 0 },

  // ---- Room photos (20) ----
  { key: 'room-all-photos', label: 'Every room has photos', labelKo: '모든 객실에 사진 존재', points: 6, category: 'room-photos', section: 'room-photos', required: true, estMinutes: 5, whyKo: '모든 객실에 사진이 있으면 고객이 객실을 비교하기 쉽습니다.', test: (_h, rooms) => rooms.length > 0 && rooms.every((r) => r.images.length > 0) },
  { key: 'room-4-photos', label: '4+ photos per room', labelKo: '객실별 사진 4장 이상', points: 6, category: 'room-photos', section: 'room-photos', required: false, estMinutes: 6, whyKo: '객실당 사진이 많을수록 객실 구조를 이해하기 쉽습니다.', test: (_h, rooms) => rooms.length > 0 && rooms.every((r) => r.images.length >= 4) },
  { key: 'room-bedroom', label: 'Bedroom photo per room', labelKo: '침실 전체 사진', points: 3, category: 'room-photos', section: 'room-photos', required: false, estMinutes: 3, whyKo: '침실 사진은 고객이 잠자리 환경을 확인하는 데 도움이 됩니다.', test: (_h, rooms) => rooms.length > 0 && rooms.every((r) => r.images.some((i) => i.category === 'bedroom')) },
  { key: 'room-bathroom', label: 'Bathroom photo per room', labelKo: '욕실 사진', points: 3, category: 'room-photos', section: 'room-photos', required: false, estMinutes: 3, whyKo: '욕실 사진은 고객이 청결과 편의를 확인하는 데 도움이 됩니다.', test: (_h, rooms) => rooms.length > 0 && rooms.every((r) => r.images.some((i) => i.category === 'bathroom')) },
  { key: 'room-view', label: 'Room view / feature photo', labelKo: '객실 전망·특징 사진', points: 2, category: 'room-photos', section: 'room-photos', required: false, estMinutes: 2, whyKo: '전망·특징 사진은 객실의 장점을 부각합니다.', test: (_h, rooms) => roomImages(rooms).some((i) => i.category === 'view') },

  // ---- Room info (15) ----
  { key: 'room-name', label: 'Room names', labelKo: '객실명', points: 2, category: 'room-info', section: 'room-info', required: true, estMinutes: 1, whyKo: '명확한 객실명은 고객이 객실을 구분하는 데 도움이 됩니다.', test: (_h, rooms) => rooms.length > 0 && rooms.every((r) => has(r.name.EN)) },
  { key: 'room-size', label: 'Room size', labelKo: '객실 크기', points: 3, category: 'room-info', section: 'room-info', required: false, estMinutes: 1, whyKo: '객실 크기는 고객이 공간을 예상하는 데 도움이 됩니다.', test: (_h, rooms) => rooms.length > 0 && rooms.every((r) => (r.sizeSqm ?? 0) > 0) },
  { key: 'room-bed', label: 'Bed configuration', labelKo: '침대 구성', points: 3, category: 'room-info', section: 'room-info', required: false, estMinutes: 1, whyKo: '침대 구성은 고객이 인원과 잠자리를 준비하는 데 도움이 됩니다.', test: (_h, rooms) => rooms.length > 0 && rooms.every((r) => has(r.bedConfig)) },
  { key: 'room-occ', label: 'Max occupancy', labelKo: '최대 투숙인원', points: 2, category: 'room-info', section: 'room-info', required: false, estMinutes: 1, whyKo: '최대 투숙인원은 고객이 인원에 맞는 객실을 고르는 데 도움이 됩니다.', test: (_h, rooms) => rooms.length > 0 && rooms.every((r) => r.maxOccupancy > 0) },
  { key: 'room-view-info', label: 'Room view', labelKo: '객실 전망', points: 2, category: 'room-info', section: 'room-info', required: false, estMinutes: 1, whyKo: '전망 정보는 객실 선택의 기준이 됩니다.', test: (_h, rooms) => rooms.length > 0 && rooms.every((r) => has(r.view)) },
  { key: 'room-amenities', label: 'Room amenities', labelKo: '객실 편의시설', points: 3, category: 'room-info', section: 'room-info', required: false, estMinutes: 2, whyKo: '객실 편의시설은 고객 기대치를 정확히 전달합니다.', test: (_h, rooms) => rooms.length > 0 && rooms.every((r) => r.amenities.length >= 3) },

  // ---- Facilities (10) ----
  { key: 'fac-3', label: '3+ facilities', labelKo: '주요 시설 3개 이상', points: 4, category: 'facilities', section: 'facilities', required: true, estMinutes: 2, whyKo: '시설 선택은 검색 필터 노출에 도움이 됩니다.', test: (h) => h.facilities.length >= 3 },
  { key: 'fac-8', label: '8+ facilities', labelKo: '시설 8개 이상', points: 3, category: 'facilities', section: 'facilities', required: false, estMinutes: 2, whyKo: '풍부한 시설 정보는 고객의 기대를 명확히 합니다.', test: (h) => h.facilities.length >= 8 },
  { key: 'fac-photos', label: 'Facility photos', labelKo: '시설 사진 연결', points: 3, category: 'facilities', section: 'facilities', required: false, estMinutes: 3, whyKo: '선택한 시설의 사진은 고객 신뢰도를 높이는 데 도움이 됩니다.', test: (h) => catCount(h.images, 'facility') + catCount(h.images, 'pool') > 0 },

  // ---- Basic info & location (10) ----
  { key: 'name-en', label: 'Hotel name (EN)', labelKo: '호텔명 (EN)', points: 1, category: 'basic-location', section: 'basic-info', required: true, estMinutes: 1, whyKo: '호텔명은 검색과 표시의 기본입니다.', test: (h) => has(h.name.EN) },
  { key: 'phone', label: 'Phone', labelKo: '연락처', points: 1, category: 'basic-location', section: 'basic-info', required: true, estMinutes: 1, whyKo: '연락처는 고객 문의와 운영에 필요합니다.', test: (h) => has(h.phone) },
  { key: 'address-en', label: 'Address (EN)', labelKo: '주소 (EN)', points: 2, category: 'basic-location', section: 'basic-info', required: true, estMinutes: 1, whyKo: '주소는 고객이 위치를 파악하는 데 필요합니다.', test: (h) => has(h.addresses?.EN) || has(h.address) },
  { key: 'postcode', label: 'Post code', labelKo: '우편번호', points: 1, category: 'basic-location', section: 'basic-info', required: false, estMinutes: 1, whyKo: '우편번호는 정확한 위치 표시에 도움이 됩니다.', test: (h) => has(h.postCode) },
  { key: 'star', label: 'Star grade', labelKo: '성급', points: 1, category: 'basic-location', section: 'basic-info', required: false, estMinutes: 1, whyKo: '성급은 고객이 호텔 수준을 이해하는 데 도움이 됩니다.', test: (h) => has(h.grade) },
  { key: 'region', label: 'Country & region', labelKo: '국가·지역', points: 1, category: 'basic-location', section: 'basic-info', required: false, estMinutes: 1, whyKo: '국가·지역 정보는 검색 노출에 도움이 됩니다.', test: (h) => has(h.country) && has(h.regionName) },
  { key: 'map', label: 'Map location', labelKo: '지도 위치', points: 2, category: 'basic-location', section: 'location', required: false, estMinutes: 2, whyKo: '지도 위치는 고객이 여행 동선을 계획하는 데 도움이 됩니다.', test: (h) => typeof h.latitude === 'number' && typeof h.longitude === 'number' },
  { key: 'nearby', label: 'Nearby places', labelKo: '주변 정보', points: 1, category: 'basic-location', section: 'location', required: false, estMinutes: 2, whyKo: '주변 정보는 고객이 위치의 장점을 이해하는 데 도움이 됩니다.', test: (h) => (h.nearby?.length ?? 0) >= 3 },

  // ---- Policies (8) ----
  { key: 'checkin', label: 'Check-in time', labelKo: '체크인 시간', points: 2, category: 'policies', section: 'policies', required: true, estMinutes: 1, whyKo: '체크인 시간은 고객이 도착을 준비하는 데 필요합니다.', test: (h) => has(h.checkIn) },
  { key: 'checkout', label: 'Check-out time', labelKo: '체크아웃 시간', points: 2, category: 'policies', section: 'policies', required: true, estMinutes: 1, whyKo: '체크아웃 시간은 고객 일정 관리에 필요합니다.', test: (h) => has(h.checkOut) },
  { key: 'policy-2', label: '2+ policies', labelKo: '정책 2개 이상', points: 2, category: 'policies', section: 'policies', required: false, estMinutes: 2, whyKo: '명확한 정책은 고객의 오해를 줄이는 데 도움이 됩니다.', test: (h) => h.policies.length >= 2 },
  { key: 'policy-4', label: '4+ policies', labelKo: '정책 4개 이상', points: 2, category: 'policies', section: 'policies', required: false, estMinutes: 2, whyKo: '상세한 이용정보는 고객 신뢰를 높이는 데 도움이 됩니다.', test: (h) => h.policies.length >= 4 },

  // ---- Description (5) ----
  { key: 'desc-20', label: 'Description present', labelKo: '호텔 설명 입력', points: 3, category: 'description', section: 'description', required: false, estMinutes: 3, whyKo: '호텔 설명은 호텔의 매력을 전달하는 데 도움이 됩니다.', test: (h) => (h.descriptions?.EN?.trim().length ?? h.description.trim().length) >= 20 },
  { key: 'desc-100', label: 'Detailed description', labelKo: '상세 설명 (100자 이상)', points: 2, category: 'description', section: 'description', required: false, estMinutes: 3, whyKo: '상세한 설명은 고객이 호텔의 특징을 이해하는 데 도움이 됩니다.', test: (h) => (h.descriptions?.EN?.trim().length ?? h.description.trim().length) >= 100 },

  // ---- Multilingual (2) ----
  { key: 'name-langs', label: 'Name in all languages', labelKo: '호텔명 다국어 완성', points: 1, category: 'multilingual', section: 'multilingual', required: false, estMinutes: 3, whyKo: '다국어 호텔명은 더 많은 고객이 호텔을 찾는 데 도움이 됩니다.', test: (h) => Object.values(h.name).every(has) },
  { key: 'desc-langs', label: 'Description in 3+ languages', labelKo: '설명 3개 언어 이상', points: 1, category: 'multilingual', section: 'multilingual', required: false, estMinutes: 5, whyKo: '다국어 설명은 해외 고객의 이해를 돕습니다.', test: (h) => Object.values(h.descriptions ?? {}).filter((v) => has(v as string)).length >= 3 },
]

export function computeContentScore(hotel: Hotel, rooms: RoomType[]): ScoreResult {
  const items: ScoreItem[] = ITEMS.map((d) => ({
    key: d.key,
    label: d.label,
    labelKo: d.labelKo,
    points: d.points,
    earned: d.test(hotel, rooms),
    category: d.category,
    section: d.section,
    required: d.required,
    estMinutes: d.estMinutes,
    whyKo: d.whyKo,
  }))

  const total = clamp(Math.round(items.reduce((s, i) => s + (i.earned ? i.points : 0), 0)))

  const categories: CategoryScore[] = (Object.keys(CATEGORY_META) as CategoryKey[]).map((key) => {
    const catItems = items.filter((i) => i.category === key)
    return {
      key,
      ...CATEGORY_META[key],
      max: catItems.reduce((s, i) => s + i.points, 0),
      earned: catItems.reduce((s, i) => s + (i.earned ? i.points : 0), 0),
      items: catItems,
    }
  })

  const missions: MissionScore[] = (Object.keys(MISSION_META) as MissionKey[]).map((key) => {
    const mItems = items.filter((i) => i.section === key)
    const done = mItems.filter((i) => i.earned)
    const missing = mItems.filter((i) => !i.earned)
    const max = mItems.reduce((s, i) => s + i.points, 0)
    const earned = done.reduce((s, i) => s + i.points, 0)
    const percent = max === 0 ? (key === 'review' ? (total >= 95 ? 100 : 0) : 100) : Math.round((earned / max) * 100)
    const status: MissionScore['status'] =
      mItems.length === 0
        ? total >= 95
          ? 'Completed'
          : 'Not started'
        : done.length === 0
          ? 'Not started'
          : missing.length === 0
            ? 'Completed'
            : 'In progress'
    return {
      key,
      label: MISSION_META[key].label,
      labelKo: MISSION_META[key].labelKo,
      max,
      earned,
      doneCount: done.length,
      totalCount: mItems.length,
      missingCount: missing.length,
      percent,
      estMinutes: missing.reduce((s, i) => s + i.estMinutes, 0),
      status,
      whyKo: MISSION_META[key].whyKo,
      items: mItems,
    }
  })

  const g = gradeFor(total)
  return {
    total,
    band: bandFor(total),
    grade: g.grade,
    gradeColor: g.color,
    categories,
    missions,
    items,
    doneCount: items.filter((i) => i.earned).length,
    requiredRemaining: items.filter((i) => i.required && !i.earned).length,
  }
}

/** Quick wins: incomplete items ranked by required → efficiency (pts/min) → points → time. */
export function quickWins(result: ScoreResult, limit = 6): ScoreItem[] {
  return result.items
    .filter((i) => !i.earned)
    .sort((a, b) => {
      if (a.required !== b.required) return a.required ? -1 : 1
      const effA = a.points / Math.max(1, a.estMinutes)
      const effB = b.points / Math.max(1, b.estMinutes)
      if (effB !== effA) return effB - effA
      if (b.points !== a.points) return b.points - a.points
      return a.estMinutes - b.estMinutes
    })
    .slice(0, limit)
}

/** The single most valuable next action. */
export function topRecommendation(result: ScoreResult): ScoreItem | null {
  return quickWins(result, 1)[0] ?? null
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n))
}
