import { useEffect, useMemo, useState } from 'react'
import { Send, XCircle, CheckCircle2 } from 'lucide-react'
import { FilterPanel, Field } from '../../components/ui/FilterPanel'
import { Select, Button, TextInput, DateInput } from '../../components/ui/controls'
import { DataGrid, type Column } from '../../components/ui/DataGrid'
import { Pager } from '../../components/ui/Pager'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { useAllRfps } from '../../data/hooks'
import { submitVendorQuote, declineRfp, confirmRfpBooking, rejectRfpBooking } from '../../data/store'
import { addBusDecline, addBusQuote, cancelLabel, CANCEL_REASON_LABEL, sweepUnpaid, upsertDeal } from '../../data/groupBus'
import { usePagedFilter } from '../../lib/usePagedFilter'
import { remaining, fmtDateTime, useNow } from '../../lib/deadline'
import type { GroupRfp, RfpStatus, Currency, VendorQuote } from '../../data/types'

/**
 * Group RFP — 단체 견적 요청(역경매 공급측). 마켓플레이스 셀러 단체 문의(5실 이상)가 호텔 콘솔에 도착.
 * 호텔: 경쟁 견적 제출(blind) → 낙찰 시 리퀘스트 예약 컨펌/거절 → 고객 결제(마감 내) → 정산.
 * **마켓플레이스 실연동**(groupBus · 라이브 같은 브라우저) + 데모 시드. ※ 원본에 없던 신규(NEW).
 * 지역 타깃팅 B(도시 일치 · 거리 표시) · **취소 마감 지정(이후 취소·환불 불가)** · 결제 마감(호텔 설정) · 정산(OMH 대신 수금·지불).
 */

const money = (n: number, c: Currency) => `${c} ${Math.round(n).toLocaleString()}`
const roomsText = (r: GroupRfp) => r.rooms.map((x) => `${x.roomType} ×${x.count}`).join(', ')
const roomsTotal = (r: GroupRfp) => r.rooms.reduce((s, x) => s + x.count, 0)

const STATUS_TONE: Record<RfpStatus, 'info' | 'warning' | 'success' | 'neutral' | 'danger'> = {
  New: 'neutral', Quoted: 'info', Won: 'warning', Confirmed: 'success', Lost: 'neutral', Declined: 'neutral', Cancelled: 'danger', Expired: 'danger',
}
const STATUS_LABEL: Record<RfpStatus, string> = {
  New: '신규 요청', Quoted: '견적 제출', Won: '낙찰 · 컨펌 대기', Confirmed: '확정', Lost: '미선택', Declined: '거절', Cancelled: '취소', Expired: '마감',
}
const STATUS_OPTS = [{ value: '', label: 'All' }, ...(Object.keys(STATUS_LABEL) as RfpStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))]

/**
 * 표시·필터용 유효 상태 — 신규 요청인데 회신 기한이 지났으면 '마감'(견적 제출 불가),
 * 확정인데 결제 마감이 지나도록 미결제면 '취소'(자동취소).
 */
const effStatus = (r: GroupRfp, now: number): RfpStatus => {
  if (r.status === 'New' && remaining(r.quoteDeadline, now).expired) return 'Expired'
  if (r.status === 'Confirmed' && !r.paidAt && r.paymentDueAt && now > new Date(r.paymentDueAt).getTime()) return 'Cancelled'
  return r.status
}
/** 확정 건 세부 라벨 — 결제 대기 / 결제 완료 */
const statusText = (r: GroupRfp, s: RfpStatus) => (s === 'Confirmed' ? (r.paidAt ? '확정 · 결제 완료' : '확정 · 결제 대기') : STATUS_LABEL[s])

/** 인박스 정렬 우선순위 — 회신 가능한 신규(기한 임박순) → 컨펌 대기 → 견적 제출 → 종료 건. */
const PRIORITY: Record<RfpStatus, number> = { New: 0, Won: 1, Quoted: 2, Expired: 3, Confirmed: 3, Lost: 3, Declined: 3, Cancelled: 3 }

const STD_COMMISSION = 10 // 표준 커미션 %(국가 커미션율이 없을 때)
const commissionOf = (r: GroupRfp) => r.commissionPct ?? STD_COMMISSION

const amountHint = (r: GroupRfp) =>
  r.contractType === 'Commission'
    ? '단가(판매가) 기준 제출 — 커미션은 OMH 정산 시 차감'
    : 'net(원가) 기준 제출 — 고객가 마크업은 OMH(마켓)에서 적용'

/** 정산(OMH가 대신 수금·지불) 요약. */
function settlement(r: GroupRfp, amount: number) {
  if (r.contractType === 'Commission') {
    const pct = commissionOf(r)
    const margin = Math.round((amount * pct) / 100)
    return { customerPay: amount, hotelReceive: amount - margin, omhMargin: margin, note: `단가 − 커미션 ${pct}%` }
  }
  return { customerPay: null as number | null, hotelReceive: amount, omhMargin: null as number | null, note: 'net 지불 — 고객가 마크업은 OMH(마켓)에서 적용' }
}

export default function GroupRfpPage() {
  const rfps = useAllRfps()
  const toast = useToast()
  const now = useNow()
  const [status, setStatus] = useState('')
  const [region, setRegion] = useState('')
  const [applied, setApplied] = useState(0)
  const [active, setActive] = useState<GroupRfp | null>(null)

  // 결제 마감 경과 건 자동취소 기록 (마켓플레이스와 공유 — 먼저 본 쪽이 기록)
  useEffect(() => sweepUnpaid(now), [now])

  // 회신 가능한 신규 요청을 기한 임박순으로 맨 위에
  const rows = useMemo(
    () =>
      [...rfps].sort((a, b) => {
        const pa = PRIORITY[effStatus(a, now)]
        const pb = PRIORITY[effStatus(b, now)]
        if (pa !== pb) return pa - pb
        return new Date(a.quoteDeadline).getTime() - new Date(b.quoteDeadline).getTime()
      }),
    [rfps, now],
  )
  const liveCount = rfps.filter((r) => r.source === 'marketplace').length

  const regionOpts = useMemo(
    () => [{ value: '', label: 'All' }, ...Array.from(new Set(rfps.map((r) => r.region))).map((rg) => ({ value: rg, label: rg }))],
    [rfps],
  )

  const predicate = (r: GroupRfp) => {
    if (status && effStatus(r, now) !== status) return false
    if (region && r.region !== region) return false
    return true
  }
  const { page, pageSize, total, pageRows, setPage, setPageSize, resetPage } = usePagedFilter(rows, predicate, [applied, rfps.length])

  const columns: Column<GroupRfp>[] = [
    {
      key: 'ref', header: 'RFP No.', align: 'left',
      render: (r) => (
        <div>
          <span className="font-mono text-caption">{r.ref}</span>
          {r.source === 'marketplace' && <div><Badge tone="success">마켓 실시간</Badge></div>}
        </div>
      ),
    },
    { key: 'seller', header: '고객사', align: 'left', render: (r) => r.sellerName },
    {
      key: 'dest', header: '지역 / 거리', align: 'left',
      render: (r) => (
        <div>
          <div>{r.country} · {r.region}{r.area ? ` · ${r.area}` : ''}</div>
          <div className="text-caption text-faint">
            {r.anchorName ? `📍 ${r.anchorName} · 차량 ${r.anchorRadiusMin}분` : '지역 일치'}
            {r.distanceKm != null && <span className="ml-1 text-primary">· 우리 호텔 약 {r.distanceKm}km</span>}
            {r.ourHotelName && <span className="ml-1">· 수신 {r.ourHotelName}</span>}
          </div>
        </div>
      ),
    },
    { key: 'period', header: '기간', render: (r) => `${r.checkIn} ~ ${r.checkOut} (${r.nights}박)` },
    { key: 'rooms', header: '룸 / 인원', align: 'left', render: (r) => `${roomsTotal(r)}실 · ${r.guests}명` },
    { key: 'type', header: '성격', align: 'left', render: (r) => `${r.groupType ?? '단체'}${r.scope === 'rooms_plus' ? ' · 부대' : ''}` },
    { key: 'budget', header: '고객 예산(참고)', align: 'right', render: (r) => (r.budgetTotal ? money(r.budgetTotal, r.currency) : '—') },
    {
      key: 'deadline', header: '회신 기한 / 남은 시간', sortable: true, sortValue: (r) => new Date(r.quoteDeadline).getTime(),
      render: (r) => {
        const s = effStatus(r, now)
        const rem = remaining(r.quoteDeadline, now)
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-caption text-muted">{fmtDateTime(r.quoteDeadline)}</span>
            {s === 'New' || s === 'Quoted' ? (
              <Badge tone={rem.tone}>⏱ {rem.label}</Badge>
            ) : s === 'Expired' ? (
              <Badge tone="neutral">마감 · 미회신</Badge>
            ) : (
              <span className="text-caption text-faint">회신 종료</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'status', header: '상태', align: 'center',
      render: (r) => {
        const s = effStatus(r, now)
        return <Badge tone={STATUS_TONE[s]}>{statusText(r, s)}</Badge>
      },
    },
  ]

  const doSearch = () => { setApplied((n) => n + 1); resetPage() }
  const reset = () => { setStatus(''); setRegion(''); setApplied((n) => n + 1); resetPage() }
  const activeLive = active ? rows.find((r) => r.id === active.id) ?? active : null

  return (
    <div className="flex flex-col gap-3">
      <FilterPanel actions={<><Button variant="primary" onClick={doSearch}>Search</Button><Button variant="secondary" onClick={reset}>Reset</Button></>}>
        <Field label="Status"><Select value={status} onChange={setStatus} options={STATUS_OPTS} /></Field>
        <Field label="Region"><Select value={region} onChange={setRegion} options={regionOpts} clearable /></Field>
      </FilterPanel>

      <p className="px-1 text-caption text-muted">
        단체 견적 요청함(<b>5실 이상</b> 그룹 예약) — <b>우리 호텔이 있는 도시</b>의 요청만 도착합니다(도시 불일치 시 미발송). 세부 지역이 다르면 <b>거리</b>를 표시하니 참고해 견적하세요.
        고객사가 정한 <b>회신 기한</b> 안에 제출해야 하며(<b>남은 시간</b> 표시 · 기한 임박순 정렬), 기한이 지나면 <b>마감</b>됩니다. 견적 때 <b>취소 마감</b>을 지정하세요 — 마감 이후엔 <b>취소 불가·환불 불가</b>.
        {' '}<b className="text-success">마켓 실시간 {liveCount}건</b> — 마켓플레이스에서 접수된 문의가 같은 브라우저(라이브)에서 바로 도착합니다.
      </p>

      <div>
        <DataGrid kendo columns={columns} rows={pageRows} rowKey={(r) => r.id} onRowClick={(r) => setActive(r)} minWidth={1320} emptyMessage="요청이 없습니다." />
        <Pager kendo page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={setPageSize} />
      </div>

      {activeLive && <RfpDetail rfp={activeLive} now={now} onClose={() => setActive(null)} toast={toast} />}
    </div>
  )
}

// ─────────────────────────── 상세 + 견적/컨펌 ───────────────────────────
/** 견적 유효기한 기본값 — 회신 기한 + 3일 (YYYY-MM-DD) */
const defaultValidUntil = (deadlineIso: string) => new Date(new Date(deadlineIso).getTime() + 3 * 86400000).toISOString().slice(0, 10)
/** 체크인 N일 전 (YYYY-MM-DD) */
const daysBefore = (checkIn: string, n: number) => new Date(new Date(`${checkIn}T00:00:00Z`).getTime() - n * 86400000).toISOString().slice(0, 10)
const todayStr = () => new Date().toISOString().slice(0, 10)

function RfpDetail({ rfp, now, onClose, toast }: { rfp: GroupRfp; now: number; onClose: () => void; toast: ReturnType<typeof useToast> }) {
  const [amount, setAmount] = useState('')
  const [availability, setAvailability] = useState('')
  /** 취소 마감 — 날짜 지정 / 마감 없음(처음부터 취소·환불 불가) */
  const [noCancel, setNoCancel] = useState(false)
  const [cancelDeadline, setCancelDeadline] = useState('')
  const [deadlineHours, setDeadlineHours] = useState('3')
  const [validUntil, setValidUntil] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    setAmount(''); setAvailability(`${roomsText(rfp)} 확보 가능`); setNoCancel(false)
    setCancelDeadline(daysBefore(rfp.checkIn, 3)); setDeadlineHours('3'); setValidUntil(defaultValidUntil(rfp.quoteDeadline)); setNote('')
  }, [rfp.id, rfp.quoteDeadline]) // eslint-disable-line react-hooks/exhaustive-deps

  const rem = remaining(rfp.quoteDeadline, now)
  const eff = effStatus(rfp, now)
  const live = rfp.source === 'marketplace'
  // 회신 기한 내 신규 요청만 견적 제출 가능 — 기한 경과 시 마감
  const quoting = eff === 'New'
  const awarded = rfp.status === 'Won'
  const amtNum = Number(amount) || 0
  const hrs = Math.max(1, Number(deadlineHours) || 3)
  const cdlInvalid = !noCancel && (!cancelDeadline || cancelDeadline < todayStr() || cancelDeadline >= rfp.checkIn)
  const canSubmit = quoting && amtNum > 0 && availability.trim() && validUntil && !cdlInvalid

  const submit = () => {
    if (!canSubmit) return
    const cdl = noCancel ? undefined : cancelDeadline
    if (live && rfp.ourHotelCode) {
      addBusQuote({
        ref: rfp.ref, quoteId: `${rfp.ref}-${rfp.ourHotelCode}`, hotelCode: rfp.ourHotelCode, hotelName: rfp.ourHotelName ?? rfp.ourHotelCode, city: rfp.region,
        amount: amtNum, currency: rfp.currency, availability: availability.trim(), cancelDeadline: cdl, paymentDeadlineHours: hrs,
        validUntil, note: note.trim() || undefined, submittedAt: new Date().toISOString(),
      })
      toast.push('견적을 제출했습니다 — 마켓플레이스 고객사 견적 리스트에 바로 표시됩니다.', 'success')
    } else {
      const q: VendorQuote = {
        amount: amtNum, currency: rfp.currency, availability: availability.trim(), cancelDeadline: cdl, cancellation: cancelLabel(cdl),
        paymentDeadlineHours: hrs, validUntil, note: note.trim() || undefined, submittedAt: new Date().toISOString().slice(0, 10),
      }
      submitVendorQuote(rfp.id, q)
      toast.push('견적을 제출했습니다 — 고객사 리스트업에 반영됩니다.', 'success')
    }
    onClose()
  }
  const decline = () => {
    if (live && rfp.ourHotelCode) addBusDecline(rfp.ref, rfp.ourHotelCode)
    else declineRfp(rfp.id)
    toast.push('요청을 거절했습니다.', 'info'); onClose()
  }
  const confirmBooking = () => {
    if (live) upsertDeal(rfp.ref, { hotelDecision: 'confirmed', decidedAt: new Date().toISOString() })
    else confirmRfpBooking(rfp.id)
    toast.push(`예약을 컨펌했습니다 — 고객사가 ${rfp.quote?.paymentDeadlineHours ?? 3}시간 내 계약 동의·결제하면 확정됩니다.`, 'success'); onClose()
  }
  const rejectBooking = () => {
    const at = new Date().toISOString()
    if (live) upsertDeal(rfp.ref, { hotelDecision: 'rejected', decidedAt: at, cancelledAt: at, cancelReason: 'hotel_rejected' })
    else rejectRfpBooking(rfp.id)
    toast.push('리퀘스트 예약을 거절했습니다 — 문의가 취소됩니다.', 'info'); onClose()
  }

  const info = (label: string, value: React.ReactNode) => (
    <div><div className="text-caption text-faint">{label}</div><div className="text-base text-ink">{value}</div></div>
  )
  const set = settlement(rfp, rfp.quote?.amount ?? amtNum)
  const payRem = rfp.paymentDueAt ? remaining(rfp.paymentDueAt, now) : null
  const cancelReason = rfp.cancelReason ?? (eff === 'Cancelled' && rfp.status === 'Confirmed' ? 'unpaid_timeout' : undefined)

  return (
    <Modal open onClose={onClose} width={760} title={`Group RFP — ${rfp.ref}`}
      footer={
        quoting ? (
          <><Button variant="danger" onClick={decline}><XCircle size={14} /> 거절</Button>
            <Button variant="primary" onClick={submit} disabled={!canSubmit}><Send size={14} /> 견적 제출</Button></>
        ) : awarded ? (
          <><Button variant="danger" onClick={rejectBooking}><XCircle size={14} /> 거절(문의 취소)</Button>
            <Button variant="primary" onClick={confirmBooking}><CheckCircle2 size={14} /> 예약 컨펌</Button></>
        ) : (
          <Button variant="secondary" onClick={onClose}>닫기</Button>
        )
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_TONE[eff]}>{statusText(rfp, eff)}</Badge>
        {live && <Badge tone="success">마켓 실시간</Badge>}
        <span className="text-caption text-muted">고객사 {rfp.sellerName} · 회신 기한 {fmtDateTime(rfp.quoteDeadline)}</span>
        {(eff === 'New' || eff === 'Quoted') && <Badge tone={rem.tone}>⏱ {rem.label}</Badge>}
        {rfp.holdRequired && <Badge tone="info">객실 홀드 요청</Badge>}
        {rfp.distanceKm != null && <Badge tone="neutral">우리 호텔 약 {rfp.distanceKm}km</Badge>}
        {rfp.ourHotelName && <Badge tone="neutral">수신 호텔 {rfp.ourHotelName}</Badge>}
      </div>

      {eff === 'Expired' && (
        <div className="mb-3 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-base text-danger">
          ⏰ 고객사가 정한 <b>회신 기한({fmtDateTime(rfp.quoteDeadline)})</b>이 지나 <b>마감</b>되었습니다 — 견적을 제출할 수 없습니다.
        </div>
      )}
      {eff === 'New' && rem.tone === 'danger' && (
        <div className="mb-3 rounded border border-warning/40 bg-warning/15 px-3 py-2 text-base text-[#9a6a00]">
          ⚠ 회신 기한 임박 — <b>{rem.label}</b>. 기한 내 제출하지 않으면 자동 마감됩니다.
        </div>
      )}

      {/* 요청 요건 */}
      <div className="grid grid-cols-2 gap-3 rounded border border-line bg-canvas/40 p-3 md:grid-cols-3">
        {info('목적지', `${rfp.country} · ${rfp.region}${rfp.area ? ` · ${rfp.area}` : ''}`)}
        {info('기준점 / 거리', rfp.anchorName ? `${rfp.anchorName} · 차량 ${rfp.anchorRadiusMin}분` : (rfp.distanceKm != null ? `우리 호텔 약 ${rfp.distanceKm}km` : '지역 일치'))}
        {info('기간', `${rfp.checkIn} ~ ${rfp.checkOut} (${rfp.nights}박)`)}
        {info('룸', `${roomsText(rfp)} (${roomsTotal(rfp)}실)`)}
        {info('식사', rfp.mealPlan)}
        {info('인원 / 국적', `${rfp.guests}명${rfp.nationality ? ` · ${rfp.nationality}` : ''}`)}
        {info('성격 / 범위', `${rfp.groupType ?? '단체'} · ${rfp.scope === 'rooms_plus' ? '객실+부대' : '객실만'}`)}
        {info('부대 서비스', rfp.ancillary?.length ? rfp.ancillary.join(', ') : '—')}
        {info('고객 예산(참고)', rfp.budgetTotal ? `${money(rfp.budgetTotal, rfp.currency)} (1실·1박 ${money(rfp.budgetPerRoomNight ?? 0, rfp.currency)})` : '—')}
      </div>
      {rfp.goldenKey && (
        <div className="mt-2 rounded border border-primary/30 bg-primary-light px-3 py-2 text-base text-ink">
          <span className="font-semibold text-primary">Golden Key</span> — {rfp.goldenKey}
        </div>
      )}

      {/* 견적 제출 */}
      {quoting && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="text-md font-semibold text-ink">견적 제출</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`견적 금액 (${rfp.currency})`}>
              <TextInput type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="총액" className="w-full" />
            </Field>
            <Field label="유효기한"><DateInput value={validUntil} onChange={setValidUntil} className="w-full" /></Field>
          </div>
          <p className="-mt-1 text-caption text-muted">
            계약형태: <b>{rfp.contractType}</b> — {amountHint(rfp)}
            {amtNum > 0 && rfp.budgetTotal ? (
              <span className={amtNum > rfp.budgetTotal ? ' text-danger' : ' text-success'}>
                {' · '}고객 예산 대비 {amtNum > rfp.budgetTotal ? `초과 +${money(amtNum - rfp.budgetTotal, rfp.currency)}` : `이내 −${money(rfp.budgetTotal - amtNum, rfp.currency)}`}
              </span>
            ) : null}
          </p>
          <Field label="가용 확보"><TextInput value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full" /></Field>

          {/* 취소 마감 — 호텔 지정. 마감 이후 취소 불가·환불 불가 */}
          <div className="rounded border border-line bg-canvas/40 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-ink">취소 마감</span>
              <span className="text-caption text-muted">— 이 날짜 23:59까지 예약 전체 무료취소(전액 환불), <b className="text-danger">이후엔 취소 불가·환불 불가</b></span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DateInput value={noCancel ? '' : cancelDeadline} onChange={(v) => { setNoCancel(false); setCancelDeadline(v) }} className="w-40" />
              {[3, 7, 14].map((n) => (
                <Button key={n} variant="secondary" onClick={() => { setNoCancel(false); setCancelDeadline(daysBefore(rfp.checkIn, n)) }}>체크인 {n}일 전</Button>
              ))}
              <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-base text-ink">
                <input type="checkbox" checked={noCancel} onChange={(e) => setNoCancel(e.target.checked)} /> 취소 마감 없음 (처음부터 취소·환불 불가)
              </label>
            </div>
            <p className={`mt-1 text-caption ${cdlInvalid ? 'text-danger' : 'text-muted'}`}>
              {cdlInvalid ? '취소 마감은 오늘 이후 · 체크인 전 날짜로 지정하세요.' : `고객사에 표시: ${cancelLabel(noCancel ? undefined : cancelDeadline)}`}
            </p>
          </div>

          <Field label="결제 마감 (컨펌 후, 시간)">
            <TextInput type="number" min={1} value={deadlineHours} onChange={(e) => setDeadlineHours(e.target.value)} className="w-40" />
          </Field>
          <p className="-mt-1 text-caption text-muted">※ 낙찰·컨펌 후 <b>{hrs}시간</b> 내 고객사가 계약 조건에 동의하고 결제하지 않으면 자동취소(호텔 설정).</p>
          <Field label="메모 (선택)"><TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="부대 조건·특이사항" className="w-full" /></Field>
        </div>
      )}

      {/* 제출/낙찰/확정 — 견적 조회 + 정산 */}
      {!quoting && rfp.quote && (
        <div className="mt-4">
          <div className="mb-2 text-md font-semibold text-ink">제출 견적</div>
          <div className="grid grid-cols-2 gap-3 rounded border border-line bg-white p-3 md:grid-cols-3">
            {info('견적 금액', money(rfp.quote.amount, rfp.quote.currency))}
            {info('가용', rfp.quote.availability)}
            {info('취소 조건', rfp.quote.cancellation)}
            {info('결제 마감', `컨펌 후 ${rfp.quote.paymentDeadlineHours}시간`)}
            {info('유효기한', rfp.quote.validUntil)}
            {rfp.quote.note && info('메모', rfp.quote.note)}
          </div>

          {/* 정산(OMH 대신 수금·지불) */}
          <div className="mb-1 mt-3 text-md font-semibold text-ink">정산 (OMH가 대신 수금·지불)</div>
          <div className="grid grid-cols-2 gap-3 rounded border border-line bg-canvas/40 p-3 md:grid-cols-3">
            {info('고객 결제(→OMH)', set.customerPay != null ? money(set.customerPay, rfp.currency) : '마켓 고객가(마크업 적용)')}
            {info('호텔 수령(OMH→)', money(set.hotelReceive, rfp.currency))}
            {info('정산 방식', set.note)}
          </div>
          <p className="mt-1 text-caption text-faint">OMH가 Merchant of Record — 고객사가 OMH에 결제, OMH가 호텔에 정산(Billings 15일 주기). 취소 마감 전 취소는 전액 환불, 마감 후 취소·환불 불가.</p>
        </div>
      )}

      {/* 상태별 안내 */}
      {awarded && rfp.quote && (
        <div className="mt-3 rounded border border-warning/40 bg-warning/15 px-3 py-2 text-base text-[#9a6a00]">
          🎉 <b>낙찰</b> — 리퀘스트 예약이 생성되었습니다. <b>예약을 컨펌</b>하거나 거절(문의 취소)하세요.
          컨펌 후 고객이 <b>{rfp.quote.paymentDeadlineHours}시간</b> 내 계약 동의·결제하지 않으면 자동취소됩니다.
        </div>
      )}
      {rfp.status === 'Quoted' && (
        <div className="mt-3 rounded border border-info/30 bg-info/10 px-3 py-2 text-base text-info">견적 제출 완료 — 고객사 선택 결과를 기다립니다. (경쟁 견적 blind)</div>
      )}
      {eff === 'Confirmed' && !rfp.paidAt && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded border border-warning/40 bg-warning/15 px-3 py-2 text-base text-[#9a6a00]">
          ✅ 컨펌 완료 — <b>고객사 결제 대기</b>{rfp.paymentDueAt && <> · 마감 {fmtDateTime(rfp.paymentDueAt)}</>}
          {payRem && !payRem.expired && <Badge tone={payRem.tone}>⏱ {payRem.label}</Badge>}
          <span className="text-caption">— 마감까지 미결제 시 자동취소</span>
        </div>
      )}
      {eff === 'Confirmed' && rfp.paidAt && (
        <div className="mt-3 rounded border border-success/30 bg-success/10 px-3 py-2 text-base font-medium text-success">
          ✅ 고객사 결제 완료({fmtDateTime(rfp.paidAt)}) — 예약 확정 · Billings 정산 대상으로 편입됩니다.
        </div>
      )}
      {eff === 'Cancelled' && (
        <div className="mt-3 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-base text-danger">
          문의가 취소되었습니다{cancelReason ? ` — ${CANCEL_REASON_LABEL[cancelReason]}` : ''}.
        </div>
      )}
      {eff === 'Lost' && (
        <div className="mt-3 rounded border border-line bg-canvas/40 px-3 py-2 text-base text-muted">고객사가 다른 호텔 견적을 선택했습니다.</div>
      )}
    </Modal>
  )
}
