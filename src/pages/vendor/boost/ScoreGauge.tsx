import { useEffect, useState } from 'react'
import type { ScoreBand } from '../../../lib/contentScore'

/**
 * Half-circle content-strength gauge with a count-up animation. Professional
 * (not gamey): a single arc, the score, and the band label. Colour follows the
 * band but the label text is always shown too (accessibility — not colour-only).
 */
export function ScoreGauge({
  score,
  band,
  grade,
  gradeColor,
  size = 200,
}: {
  score: number
  band: ScoreBand
  grade?: string
  gradeColor?: string
  size?: number
}) {
  const display = useCountUp(score)
  const r = size / 2 - 14
  const cx = size / 2
  const cy = size / 2
  const circumference = Math.PI * r // half circle
  const pct = Math.max(0, Math.min(100, score)) / 100

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`콘텐츠 경쟁력 점수 ${score}점, 등급 ${grade ?? ''}, ${band.labelKo}`}>
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        {/* track */}
        <path
          d={arc(cx, cy, r, 180, 360)}
          fill="none"
          stroke="#EEEEEE"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* value */}
        <path
          d={arc(cx, cy, r, 180, 360)}
          fill="none"
          stroke={band.color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .8s ease, stroke .4s ease' }}
        />
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize={size * 0.22} fontWeight={800} fill="#333" data-testid="score-value">
          {display}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={12} fill="#888">
          / 100
        </text>
      </svg>
      <div className="-mt-1 flex items-center gap-2">
        {grade && (
          <span
            className="rounded-md px-2 py-0.5 text-lg font-extrabold leading-none"
            style={{ color: '#fff', background: gradeColor ?? band.color }}
            aria-label={`등급 ${grade}`}
          >
            {grade}
          </span>
        )}
        <span className="rounded-full px-2.5 py-1 text-md font-semibold" style={{ color: band.color, background: `${band.color}14` }}>
          {band.labelKo}
        </span>
      </div>
    </div>
  )
}

function useCountUp(target: number, ms = 700): number {
  const [v, setV] = useState(target)
  useEffect(() => {
    const from = v
    if (from === target) return
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms)
      setV(Math.round(from + (target - from) * easeOut(p)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
  return v
}
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** SVG arc path from startAngle to endAngle (degrees, 0=east, CW). */
function arc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p0 = polar(cx, cy, r, a0)
  const p1 = polar(cx, cy, r, a1)
  const large = a1 - a0 <= 180 ? 0 : 1
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`
}
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
