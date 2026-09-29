/**
 * 회신 기한(고객사가 단체 문의 시 지정) — 남은 시간 계산·표시 헬퍼.
 * 호텔은 기한 내에만 견적을 제출할 수 있고, 경과 시 '마감'으로 처리한다.
 */
import { useEffect, useState } from 'react'

export type RemainTone = 'danger' | 'warning' | 'info' | 'neutral'

export interface Remaining {
  expired: boolean
  label: string
  tone: RemainTone
  /** 정렬용 남은 ms (경과 시 음수) */
  ms: number
}

/** 남은 시간 — 24h 미만 danger · 48h 미만 warning · 그 외 info · 경과 시 neutral('마감'). */
export function remaining(deadlineIso: string, now: number): Remaining {
  const ms = new Date(deadlineIso).getTime() - now
  if (ms <= 0) return { expired: true, label: '마감', tone: 'neutral', ms }
  const totalMin = Math.floor(ms / 60000)
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  const label = d >= 1 ? `D-${d} · ${h}시간 남음` : h >= 1 ? `${h}시간 ${m}분 남음` : `${m}분 남음`
  const hours = ms / 3600000
  return { expired: false, label, tone: hours < 24 ? 'danger' : hours < 48 ? 'warning' : 'info', ms }
}

/** ISO → 'YYYY-MM-DD HH:mm' (로컬) */
export function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 남은 시간 실시간 갱신용 현재시각 (기본 30초 주기) */
export function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}
