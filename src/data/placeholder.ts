/**
 * Self-contained SVG placeholder images as data URIs — no external CDN, works
 * offline and on GitHub Pages. Used in place of the original's real hotel photos.
 */
const PALETTES = [
  ['#EF7F29', '#F6A623'],
  ['#2E86AB', '#48B0C7'],
  ['#6A4C93', '#9A6FBF'],
  ['#2E7D32', '#66B36A'],
  ['#C1436D', '#E27396'],
  ['#3A5A98', '#6C8CCB'],
]

export function placeholderImage(label: string, seed = 0, w = 320, h = 220): string {
  const [a, b] = PALETTES[Math.abs(seed) % PALETTES.length]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/>
    </linearGradient></defs>
    <rect width='${w}' height='${h}' fill='url(#g)'/>
    <text x='50%' y='50%' fill='rgba(255,255,255,0.92)' font-family='sans-serif' font-size='16'
      font-weight='600' text-anchor='middle' dominant-baseline='middle'>${escapeXml(label)}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string,
  )
}
