/**
 * Prototype "AI" translator. Given a source string, it produces a draft in the
 * target language which the hotel then reviews and confirms. It uses a small
 * demo translation memory for the sample hotels' known strings (so the demo
 * shows real, correct output) and a compact hotel-domain glossary fallback for
 * anything else. No backend/model; production swaps in a real translation API
 * behind the same `(text, to) → draft` interface.
 */
import type { LangText } from '../data/types'

export type Lang = keyof LangText
export const TRANSLATABLE: Lang[] = ['EN', 'KO', 'JA', 'VI', 'ZH']
export const LANG_LABEL: Record<Lang, string> = { EN: 'English', KO: '한국어', JA: '日本語', VI: 'Tiếng Việt', ZH: '中文' }

/** EN source → other-language translations for the demo hotels (names + descriptions). */
const TM: Record<string, Partial<Record<Lang, string>>> = {
  'Hoa Binh Independence Hotel': { KO: '호아빈 독립 호텔', JA: 'ホアビン独立ホテル', VI: 'Khách sạn Độc Lập Hòa Bình', ZH: '和平独立酒店' },
  'Ohmy Grand Hotel Seoul': { KO: '오마이 그랜드 호텔 서울', JA: 'オーマイグランドホテルソウル', VI: 'Khách sạn Ohmy Grand Seoul', ZH: '首尔欧买大酒店' },
  'Sakura Bay Resort Osaka': { KO: '사쿠라 베이 리조트 오사카', JA: 'さくらベイリゾート大阪', VI: 'Sakura Bay Resort Osaka', ZH: '大阪樱花湾度假村' },
  'Hoa Binh Independence Hotel offers comfortable rooms and attentive service, conveniently located for both business and leisure travellers.': {
    KO: '호아빈 독립 호텔은 편안한 객실과 세심한 서비스를 제공하며, 비즈니스와 레저 여행객 모두에게 편리한 위치에 있습니다.',
    JA: 'ホアビン独立ホテルは快適な客室と行き届いたサービスを提供し、ビジネスにもレジャーにも便利な立地です。',
    VI: 'Khách sạn Độc Lập Hòa Bình mang đến phòng nghỉ thoải mái và dịch vụ chu đáo, vị trí thuận tiện cho cả công tác và nghỉ dưỡng.',
    ZH: '和平独立酒店提供舒适的客房和周到的服务，地理位置优越，适合商务和休闲旅客。',
  },
  'A flagship 5-star property in downtown Seoul overlooking Gyeongbokgung Palace, featuring a spa, indoor pool, and three signature restaurants.': {
    KO: '경복궁이 내려다보이는 서울 도심의 5성급 대표 호텔로 스파, 실내 수영장, 3개의 시그니처 레스토랑을 갖추고 있습니다.',
    JA: 'ソウル都心にあり景福宮を望む5つ星の旗艦ホテル。スパ、屋内プール、3つのシグネチャーレストランを備えています。',
    VI: 'Khách sạn 5 sao hàng đầu tại trung tâm Seoul nhìn ra Cung Gyeongbokgung, có spa, hồ bơi trong nhà và ba nhà hàng đặc trưng.',
    ZH: '首尔市中心的五星级旗舰酒店，俯瞰景福宫，设有水疗中心、室内泳池和三家招牌餐厅。',
  },
  'A relaxed bayside resort near Osaka Bay.': {
    KO: '오사카 베이 인근의 여유로운 해변 리조트입니다.',
    JA: '大阪湾近くのくつろげるベイサイドリゾートです。',
    VI: 'Khu nghỉ dưỡng ven vịnh thư giãn gần Vịnh Osaka.',
    ZH: '大阪湾附近轻松惬意的海湾度假村。',
  },
}

/** Compact hotel-domain glossary for the fallback draft (EN → target). */
const GLOSSARY: Record<Lang, [RegExp, string][]> = {
  EN: [],
  KO: [['hotel', '호텔'], ['resort', '리조트'], ['star', '성급'], ['rooms?', '객실'], ['suite', '스위트'], ['breakfast', '조식'], ['restaurant', '레스토랑'], ['pool', '수영장'], ['spa', '스파'], ['near', '인근'], ['downtown', '도심'], ['city', '도시'], ['ocean', '오션'], ['view', '뷰'], ['guests?', '고객'], ['comfortable', '편안한'], ['convenient(ly)?', '편리한'], ['business', '비즈니스'], ['leisure', '레저'], ['travell?ers?', '여행객'], ['welcome to', '오신 것을 환영합니다']].map(([a, b]) => [new RegExp(a as string, 'gi'), b as string]),
  JA: [['hotel', 'ホテル'], ['resort', 'リゾート'], ['rooms?', '客室'], ['breakfast', '朝食'], ['restaurant', 'レストラン'], ['pool', 'プール'], ['spa', 'スパ'], ['near', '近く'], ['city', '都市'], ['view', 'ビュー'], ['guests?', 'ゲスト'], ['comfortable', '快適な'], ['business', 'ビジネス'], ['leisure', 'レジャー']].map(([a, b]) => [new RegExp(a as string, 'gi'), b as string]),
  VI: [['hotel', 'khách sạn'], ['resort', 'khu nghỉ dưỡng'], ['rooms?', 'phòng'], ['breakfast', 'bữa sáng'], ['restaurant', 'nhà hàng'], ['pool', 'hồ bơi'], ['spa', 'spa'], ['near', 'gần'], ['city', 'thành phố'], ['view', 'tầm nhìn'], ['guests?', 'khách'], ['comfortable', 'thoải mái'], ['business', 'công tác'], ['leisure', 'nghỉ dưỡng']].map(([a, b]) => [new RegExp(a as string, 'gi'), b as string]),
  ZH: [['hotel', '酒店'], ['resort', '度假村'], ['rooms?', '客房'], ['breakfast', '早餐'], ['restaurant', '餐厅'], ['pool', '泳池'], ['spa', '水疗'], ['near', '附近'], ['city', '城市'], ['view', '景观'], ['guests?', '宾客'], ['comfortable', '舒适'], ['business', '商务'], ['leisure', '休闲']].map(([a, b]) => [new RegExp(a as string, 'gi'), b as string]),
}

/** Produce a draft translation of `text` into `to`. Always to be reviewed. */
export function translateDraft(text: string, to: Lang): string {
  const src = text.trim()
  if (!src || to === 'EN') return src
  const tm = TM[src]?.[to]
  if (tm) return tm
  // Fallback: glossary substitution over the source (rough draft).
  let out = src
  for (const [re, rep] of GLOSSARY[to]) out = out.replace(re, rep)
  return out
}
