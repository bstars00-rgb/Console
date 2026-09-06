import { useEffect, useMemo, useRef, useState } from 'react'
import { Monitor, Smartphone, ExternalLink, ArrowRight, Clock, Sparkles, Save, Send, CheckCircle2, ListChecks } from 'lucide-react'
import type { Hotel, RoomType, PublishStatus } from '../../../data/types'
import { computeContentScore, quickWins, topRecommendation, type MissionKey } from '../../../lib/contentScore'
import { readJSON, writeJSON } from '../../../lib/storage'
import { useToast } from '../../../components/ui/Toast'
import { ScoreGauge } from './ScoreGauge'
import { OhmytripPreview } from './OhmytripPreview'
import { MissionInput } from './MissionInput'
import type { HighlightKey } from './highlight'

const OHMYTRIP_URL = 'https://bstars00-rgb.github.io/OHMYTRIP/'
const STATUS_TONE: Record<PublishStatus, string> = {
  Editing: 'text-muted bg-canvas',
  Saving: 'text-info bg-info/10',
  Saved: 'text-success bg-success/10',
  Draft: 'text-muted bg-canvas',
  'Needs review': 'text-[#9a6a00] bg-warning/15',
  Published: 'text-success bg-success/10',
  Rejected: 'text-danger bg-danger/10',
}

export function BoostTab({
  hotel,
  rooms,
  setHotel,
  setRoom,
  commit,
}: {
  hotel: Hotel
  rooms: RoomType[]
  setHotel: (patch: Partial<Hotel>) => void
  setRoom: (seq: number, patch: Partial<RoomType>) => void
  commit: () => void
}) {
  const toast = useToast()
  const result = useMemo(() => computeContentScore(hotel, rooms), [hotel, rooms])
  const wins = useMemo(() => quickWins(result, 6), [result])
  const top = topRecommendation(result)

  const startScore = useRef(result.total)
  const [activeMission, setActiveMission] = useState<MissionKey>(top?.section ?? 'basic-info')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [highlight, setHighlightState] = useState<HighlightKey>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [saveState, setSaveState] = useState<PublishStatus>(hotel.publishStatus ?? 'Draft')
  const [lastSaved, setLastSaved] = useState<string>(hotel.lastUpdateTime)
  const [onboard, setOnboard] = useState(() => !readJSON<boolean>('boostOnboarded', false))
  const hlTimer = useRef<number>()

  const setHighlight = (k: HighlightKey) => {
    setHighlightState(k)
    window.clearTimeout(hlTimer.current)
    hlTimer.current = window.setTimeout(() => setHighlightState(null), 1600)
  }

  // Autosave: debounce → commit draft to the store (Draft) and stamp the time.
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    setSaveState('Saving')
    const t = window.setTimeout(() => {
      commit()
      setSaveState('Saved')
      setLastSaved(nowStr())
    }, 800)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotel, rooms])

  // Warn on unsaved-ish navigation while saving.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (saveState === 'Saving') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [saveState])

  const saveNow = () => {
    commit()
    setSaveState('Saved')
    setLastSaved(nowStr())
    toast.push('임시 저장되었습니다 (Draft)', 'success')
  }
  const requestPublish = () => {
    const status: PublishStatus = result.total >= 95 ? 'Published' : 'Needs review'
    setHotel({ publishStatus: status })
    setSaveState(status)
    toast.push(status === 'Published' ? '판매 준비가 완료되어 게시되었습니다' : '게시 요청이 접수되었습니다 (검토 필요)', 'success')
  }

  const activeMissionData = result.missions.find((m) => m.key === activeMission)!
  const sessionGain = Math.max(0, result.total - startScore.current)

  return (
    <div className="flex flex-col gap-4">
      {onboard && <Onboarding onClose={() => { setOnboard(false); writeJSON('boostOnboarded', true) }} onStart={() => { setOnboard(false); writeJSON('boostOnboarded', true); if (top) setActiveMission(top.section) }} />}

      {/* ===== Top: score dashboard ===== */}
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-line bg-white p-4 lg:grid-cols-[auto_1fr_auto]">
        <div className="flex flex-col items-center">
          <span className="mb-1 text-caption font-semibold text-muted">콘텐츠 경쟁력 점수</span>
          <ScoreGauge score={result.total} band={result.band} grade={result.grade} gradeColor={result.gradeColor} size={180} />
        </div>

        <div className="flex flex-col justify-center gap-3">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-md">
            <Stat label="이전 점수" value={`${startScore.current}점`} />
            <Stat label="오늘 상승" value={`+${sessionGain}점`} accent />
            <Stat label="완료율" value={`${Math.round((result.doneCount / result.items.length) * 100)}%`} />
            <Stat label="완료 항목" value={`${result.doneCount}개`} />
            <Stat label="남은 필수 항목" value={`${result.requiredRemaining}개`} />
          </div>
          <p className="text-caption text-muted">마지막 업데이트 {lastSaved} · 콘텐츠를 완성하면 고객이 호텔을 더 쉽게 이해할 수 있습니다.</p>
          {top && (
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-primary/30 bg-primary-light/50 p-3">
              <Sparkles size={18} className="shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-md font-semibold text-ink">{top.labelKo}을(를) 완료하고 +{top.points}점을 받으세요</p>
                <p className="text-caption text-muted">약 {top.estMinutes}분 소요 · {top.whyKo}</p>
              </div>
              <button
                onClick={() => setActiveMission(top.section)}
                className="h-control shrink-0 rounded bg-primary px-3 text-md font-semibold text-white hover:bg-primary-hover"
              >
                바로 시작
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-stretch justify-center gap-2 lg:w-48">
          <span className={`self-start rounded-full px-2 py-0.5 text-caption font-semibold ${STATUS_TONE[saveState]}`}>● {saveState}</span>
          <button onClick={() => setActiveMission(top?.section ?? 'basic-info')} className="flex h-control items-center justify-center gap-1.5 rounded bg-primary text-md font-semibold text-white hover:bg-primary-hover">
            Continue improving <ArrowRight size={15} />
          </button>
          <button onClick={() => window.open(OHMYTRIP_URL, '_blank', 'noopener')} className="flex h-control items-center justify-center gap-1.5 rounded border border-line text-md text-ink hover:bg-canvas">
            <ExternalLink size={14} /> 고객 화면 보기
          </button>
          <div className="flex gap-2">
            <button onClick={saveNow} className="flex h-control flex-1 items-center justify-center gap-1 rounded border border-line text-caption text-ink hover:bg-canvas">
              <Save size={13} /> 저장
            </button>
            <button onClick={requestPublish} className="flex h-control flex-1 items-center justify-center gap-1 rounded border border-primary text-caption font-semibold text-primary hover:bg-primary-light">
              <Send size={13} /> 게시 요청
            </button>
          </div>
        </div>
      </div>

      {/* ===== Quick wins ===== */}
      {wins.length > 0 && (
        <div className="rounded-lg border border-line bg-white p-3">
          <div className="mb-2 flex items-center gap-1.5 text-md font-bold text-ink">
            <Sparkles size={15} className="text-primary" /> Quick wins · 짧은 시간에 점수를 올릴 수 있는 작업
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {wins.map((w) => (
              <button
                key={w.key}
                onClick={() => setActiveMission(w.section)}
                className="flex min-w-[190px] shrink-0 flex-col gap-1 rounded-md border border-line p-2.5 text-left hover:border-primary hover:bg-primary-light/40"
              >
                <span className="text-md font-semibold text-ink">{w.labelKo}</span>
                <span className="flex items-center gap-2 text-caption text-muted">
                  <Clock size={11} /> 약 {w.estMinutes}분 · <span className="font-semibold text-primary">+{w.points}점</span>
                  {w.required && <span className="rounded-sm bg-danger/10 px-1 text-[10px] text-danger">필수</span>}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-caption font-medium text-primary">시작하기 <ArrowRight size={11} /></span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== 3-column workspace ===== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_420px]">
        {/* Left: missions */}
        <div className="flex flex-col gap-2">
          <h3 className="flex items-center gap-1.5 text-md font-bold text-ink"><ListChecks size={15} /> 콘텐츠 미션</h3>
          {result.missions.map((m) => (
            <MissionCard key={m.key} m={m} active={m.key === activeMission} recommended={top?.section === m.key} onClick={() => setActiveMission(m.key)} />
          ))}
        </div>

        {/* Center: step input */}
        <div className="flex min-h-[420px] flex-col rounded-lg border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <h3 className="text-lg font-bold text-ink">{activeMissionData.labelKo}</h3>
              <p className="text-caption text-muted">{activeMissionData.earned}/{activeMissionData.max}점 · {activeMissionData.percent}% 완료</p>
            </div>
            <button onClick={() => setPreviewOpen(true)} className="flex items-center gap-1 rounded border border-line px-2 py-1 text-caption text-ink hover:bg-canvas xl:hidden">
              <Monitor size={13} /> 미리보기
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <MissionInput mission={activeMission} hotel={hotel} setHotel={setHotel} rooms={rooms} setRoom={setRoom} setHighlight={setHighlight} />
          </div>
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            <span className="text-caption text-muted">입력 내용은 자동으로 저장됩니다.</span>
            <button onClick={saveNow} className="flex h-control items-center gap-1.5 rounded bg-primary px-4 text-md font-semibold text-white hover:bg-primary-hover">
              <CheckCircle2 size={15} /> 저장하고 계속
            </button>
          </div>
        </div>

        {/* Right: live preview (inline on xl) */}
        <div className="hidden xl:block">
          <PreviewPanel hotel={hotel} rooms={rooms} highlight={highlight} device={device} setDevice={setDevice} />
        </div>
      </div>

      {/* Preview drawer for < xl */}
      {previewOpen && (
        <div className="fixed inset-0 z-[10001] flex justify-end bg-black/40 xl:hidden" onMouseDown={() => setPreviewOpen(false)}>
          <div className="h-full w-full max-w-[460px] overflow-auto bg-white p-3" onMouseDown={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-md font-bold text-ink">OHMYTRIP 실시간 미리보기</span>
              <button onClick={() => setPreviewOpen(false)} className="text-muted hover:text-ink">닫기</button>
            </div>
            <PreviewPanel hotel={hotel} rooms={rooms} highlight={highlight} device={device} setDevice={setDevice} />
          </div>
        </div>
      )}
    </div>
  )
}

function PreviewPanel({
  hotel,
  rooms,
  highlight,
  device,
  setDevice,
}: {
  hotel: Hotel
  rooms: RoomType[]
  highlight: HighlightKey
  device: 'desktop' | 'mobile'
  setDevice: (d: 'desktop' | 'mobile') => void
}) {
  return (
    <div className="sticky top-0 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-md font-bold text-ink">OHMYTRIP 실시간 미리보기</span>
        <div className="flex overflow-hidden rounded border border-line">
          <button onClick={() => setDevice('desktop')} className={`flex items-center gap-1 px-2 py-1 text-caption ${device === 'desktop' ? 'bg-primary text-white' : 'text-muted'}`} aria-pressed={device === 'desktop'}>
            <Monitor size={12} /> 데스크톱
          </button>
          <button onClick={() => setDevice('mobile')} className={`flex items-center gap-1 px-2 py-1 text-caption ${device === 'mobile' ? 'bg-primary text-white' : 'text-muted'}`} aria-pressed={device === 'mobile'}>
            <Smartphone size={12} /> 모바일
          </button>
        </div>
      </div>
      <OhmytripPreview hotel={hotel} rooms={rooms} highlight={highlight} device={device} />
      <p className="text-[10px] text-muted">저장 전 입력 내용이 즉시 반영됩니다. 실제 게시 화면은 상단 ‘고객 화면 보기’에서 확인하세요.</p>
    </div>
  )
}

function MissionCard({ m, active, recommended, onClick }: { m: ReturnType<typeof computeContentScore>['missions'][number]; active: boolean; recommended: boolean; onClick: () => void }) {
  const statusKo: Record<string, string> = { 'Not started': '시작 전', 'In progress': '진행 중', Completed: '완료', 'Needs review': '검토 필요' }
  return (
    <button onClick={onClick} className={`flex flex-col gap-1.5 rounded-md border p-3 text-left transition-colors ${active ? 'border-primary bg-primary-light/40' : 'border-line bg-white hover:border-primary/60'}`}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-md font-semibold text-ink">
          {m.status === 'Completed' && <CheckCircle2 size={14} className="text-success" />}
          {m.labelKo}
        </span>
        {recommended && m.status !== 'Completed' && <span className="rounded-sm bg-primary px-1 text-[10px] font-semibold text-white">추천</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${m.percent}%` }} />
      </div>
      <div className="flex items-center justify-between text-caption text-muted">
        <span>{m.earned}/{m.max}점 · {statusKo[m.status]}</span>
        <span>{m.missingCount > 0 ? `${m.missingCount}개 남음 · ~${m.estMinutes}분` : '완료'}</span>
      </div>
    </button>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-caption text-muted">{label}</span>
      <span className={`text-lg font-bold ${accent ? 'text-primary' : 'text-ink'}`}>{value}</span>
    </div>
  )
}

function Onboarding({ onClose, onStart }: { onClose: () => void; onStart: () => void }) {
  const steps = [
    { t: '콘텐츠 경쟁력 점수를 확인하세요', d: '현재 콘텐츠 완성도를 0~100점으로 보여드립니다.' },
    { t: '추천 미션을 하나씩 완료하세요', d: '가장 효과가 큰 작업부터 안내해 드립니다. 한 번에 하나씩!' },
    { t: '고객 화면에서 결과를 확인하세요', d: '입력한 내용이 OHMYTRIP 고객 화면에 어떻게 보이는지 바로 확인할 수 있습니다.' },
  ]
  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center gap-1.5 text-lg font-bold text-ink"><Sparkles size={18} className="text-primary" /> 판매력 높이기</div>
        <p className="mb-4 text-md text-muted">3단계로 콘텐츠를 쉽게 완성해 보세요.</p>
        <ol className="mb-5 flex flex-col gap-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-caption font-bold text-white">{i + 1}</span>
              <div>
                <p className="text-md font-semibold text-ink">{s.t}</p>
                <p className="text-caption text-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="h-control rounded border border-line px-3 text-md text-ink hover:bg-canvas">나중에</button>
          <button onClick={onStart} className="h-control rounded bg-primary px-4 text-md font-semibold text-white hover:bg-primary-hover">5분 안에 시작하기</button>
        </div>
      </div>
    </div>
  )
}

function nowStr(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
