/**
 * Prototype "AI" photo analysis — runs entirely in the browser (no backend, no
 * external model). It combines filename keywords with real pixel heuristics
 * (brightness, colour dominance, aspect ratio) to suggest a photo category with
 * a confidence, auto-tags, and quality flags. In production this is where a real
 * vision API (e.g. image classification) would plug in; the interface is the same.
 */
import type { PhotoCategory } from '../data/types'

export interface PhotoAnalysis {
  category: PhotoCategory
  confidence: number // 0..1
  tags: string[]
  flags: { lowRes: boolean; portrait: boolean; dark: boolean }
  source: 'filename' | 'vision'
}

export interface PixelSummary {
  r: number
  g: number
  b: number
  brightness: number // 0..255
  width: number
  height: number
}

const FILENAME_RULES: { re: RegExp; category: PhotoCategory; tags: string[] }[] = [
  { re: /(bath|toilet|shower|washroom|욕실|화장실)/i, category: 'bathroom', tags: ['bathroom'] },
  { re: /(bed|bedroom|twin|double|king|suite|침실|객실\s*내부)/i, category: 'bedroom', tags: ['bedroom'] },
  { re: /(lobby|reception|entrance|로비|리셉션)/i, category: 'lobby', tags: ['lobby'] },
  { re: /(pool|swim|jacuzzi|수영|풀)/i, category: 'pool', tags: ['pool'] },
  { re: /(restaurant|dining|breakfast|buffet|cafe|bar|레스토랑|식당|조식)/i, category: 'restaurant', tags: ['restaurant'] },
  { re: /(exterior|facade|building|outside|street|외관|건물|전경)/i, category: 'exterior', tags: ['exterior'] },
  { re: /(view|ocean|sea|city|mountain|balcony|skyline|전망|뷰|오션|시티)/i, category: 'view', tags: ['view'] },
  { re: /(gym|fitness|spa|sauna|facility|lounge|시설|피트니스|스파|사우나)/i, category: 'facility', tags: ['facility'] },
  { re: /(room|객실)/i, category: 'room', tags: ['room'] },
]

/** Filename keyword match (high confidence signal). Pure & testable. */
export function categoryFromFilename(name: string): { category: PhotoCategory; tags: string[] } | null {
  for (const rule of FILENAME_RULES) if (rule.re.test(name)) return { category: rule.category, tags: rule.tags }
  return null
}

/** Colour/brightness heuristic when the filename gives no hint. Pure & testable. */
export function categoryFromPixels(p: PixelSummary): { category: PhotoCategory; confidence: number; tags: string[] } {
  const blueness = p.b - (p.r + p.g) / 2
  const greenness = p.g - (p.r + p.b) / 2
  const warmth = p.r - p.b
  if (blueness > 28 && p.brightness > 120) return { category: 'pool', confidence: 0.62, tags: ['pool', 'water'] }
  if (blueness > 16) return { category: 'view', confidence: 0.55, tags: ['view', 'sky'] }
  if (greenness > 22) return { category: 'view', confidence: 0.5, tags: ['view', 'garden'] }
  if (p.brightness > 178) return { category: 'lobby', confidence: 0.52, tags: ['lobby', 'bright'] }
  if (warmth > 26 && p.brightness < 120) return { category: 'restaurant', confidence: 0.5, tags: ['restaurant', 'warm'] }
  if (warmth > 14) return { category: 'bedroom', confidence: 0.46, tags: ['bedroom'] }
  return { category: 'other', confidence: 0.32, tags: [] }
}

/** Clamp a suggested category to the categories allowed in this scope. */
export function clampCategory(cat: PhotoCategory, allowed: PhotoCategory[]): PhotoCategory {
  if (allowed.includes(cat)) return cat
  const fallbackByScope: Record<string, PhotoCategory> = {
    // room scope
    pool: 'view',
    lobby: 'room',
    restaurant: 'room',
    exterior: 'room',
    facility: 'room',
    // hotel scope
    bedroom: 'other',
    bathroom: 'other',
    view: allowed.includes('facility') ? 'facility' : 'other',
    room: 'other',
  }
  const mapped = fallbackByScope[cat]
  if (mapped && allowed.includes(mapped)) return mapped
  return allowed.includes('other') ? 'other' : allowed[allowed.length - 1]
}

/** Sample an average colour from a loaded image via a tiny canvas. */
export function summarizePixels(img: HTMLImageElement): PixelSummary {
  const w = img.naturalWidth || img.width || 1
  const h = img.naturalHeight || img.height || 1
  const size = 24
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  let r = 128
  let g = 128
  let b = 128
  try {
    if (ctx) {
      ctx.drawImage(img, 0, 0, size, size)
      const data = ctx.getImageData(0, 0, size, size).data
      let sr = 0
      let sg = 0
      let sb = 0
      const n = data.length / 4
      for (let i = 0; i < data.length; i += 4) {
        sr += data[i]
        sg += data[i + 1]
        sb += data[i + 2]
      }
      r = sr / n
      g = sg / n
      b = sb / n
    }
  } catch {
    /* tainted/undrawable (e.g. some SVGs) — fall back to neutral grey */
  }
  return { r, g, b, brightness: (r + g + b) / 3, width: w, height: h }
}

/** Full analysis for a loaded image + its filename. Combines all signals. */
export function analyzePhoto(img: HTMLImageElement, filename: string): PhotoAnalysis {
  const px = summarizePixels(img)
  const flags = {
    lowRes: px.width < 1024 || px.height < 768,
    portrait: px.height > px.width,
    dark: px.brightness < 55,
  }
  const byName = categoryFromFilename(filename)
  if (byName) {
    return { category: byName.category, confidence: 0.92, tags: byName.tags, flags, source: 'filename' }
  }
  const byPixels = categoryFromPixels(px)
  return { category: byPixels.category, confidence: byPixels.confidence, tags: byPixels.tags, flags, source: 'vision' }
}

export const CATEGORY_KO: Record<PhotoCategory, string> = {
  exterior: '외관',
  lobby: '로비',
  restaurant: '레스토랑',
  pool: '수영장',
  facility: '주요 시설',
  room: '객실 전체',
  bedroom: '침실',
  bathroom: '욕실',
  view: '전망/특징',
  other: '기타',
}
