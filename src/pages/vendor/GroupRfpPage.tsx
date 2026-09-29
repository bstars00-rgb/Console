import { useEffect, useMemo, useState } from 'react'
import { Send, XCircle, CheckCircle2 } from 'lucide-react'
import { FilterPanel, Field } from '../../components/ui/FilterPanel'
import { Select, Button, TextInput, DateInput } from '../../components/ui/controls'
import { DataGrid, type Column } from '../../components/ui/DataGrid'
import { Pager } from '../../components/ui/Pager'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { useRfps } from '../../data/hooks'
import { submitVendorQuote, declineRfp, confirmRfpBooking, rejectRfpBooking } from '../../data/store'
import { usePagedFilter } from '../../lib/usePagedFilter'
import { remaining, fmtDateTime, useNow } from '../../lib/deadline'
import type { GroupRfp, RfpStatus, Currency, VendorQuote, CancelPolicyId } from '../../data/types'

/**
 * Group RFP — 단체 견적 요청(역경매 공급측). 마켓플레이스 셀러 단체 문의가 호텔 콘솔에 도착.
 * 호텔: 경쟁 견적 제출(blind) → 낙찰 시 리퀘스트 예약 컨펌/거절. ※ 원본에 없던 신규(NEW).
 * 지역 타깃팅 B(거리 표시) · 취소규정 선택 · 결제 마감(호텔 설정) · 정산(OMH 대신 수금·지불).
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

/** 표시·필터용 유효 상태 — 신규 요청인데 회신 기한이 지났으면 '마감'(견적 제출 불가). */
const effStatus = (r: GroupRfp, now: number): RfpStatus =>
  r.status === 'New' && remaining(r.quoteDeadline, now).expired ? 'Expired' : r.status

/** 인박스 정렬 우선순위 — 회신 가능한 신규(기한 임박순) → 컨펌 대기 → 견적 제출 → 종료 건. */
const PRIORITY: Record<RfpStatus, number> = { New: 0, Won: 1, Quoted: 2, Expired: 3, Confirmed: 3, Lost: 3, Declined: 3, Cancelled: 3 }

/** 취소 규정 프리셋 — 호텔이 견적 시 선택(선택권). */
const CANCEL_POLICIES: { id: CancelPolicyId; label: string; days: number }[] = [
  { id: 'non-refundable', label: '비환불 (Non-refundable)', days: -1 },
  { id: 'free-3d', label: '체크인 3일 전까지 100% 무료취소', days: 3 },
  { id: 'free-7d', label: '체크인 7일 전까지 100% 무료취소', days: 7 },
  { id: 'free-14d', label: '체크인 14일 전까지 100% 무료취소', days: 14 },
]
const CANCEL_OPTS = CANCEL_POLICIES.map((p) => ({ value: p.id, label: p.label }))
const policyOf = (id: CancelPolicyId) => CANCEL_POLICIES.find((p) => p.id === id) ?? CANCEL_POLICIES[0]
const STD_COMMISSION = 10 // 표준 커미션 %(콘솔 표시용)

const amountHint = (r: GroupRfp) =>
  r.contractType === 'Commission'
    ? '단가(판매가) 기준 제출 — 커미션은 OMH 정산 시 차감'
    : 'net(원가) 기준 제출 — 고객가 마크업은 OMH(마켓)에서 적용'

/** 정산(OMH가 대신 수금·지불) 요약. */
function settlement(r: GroupRfp, amount: number) {
  if (r.contractType === 'Commission') {
    const hotel = Math.round(amount * (1 - STD_COMMISSION / 100))
    return { customerPay: amount, hotelReceive: hotel, omhMargin: amount - hotel, note: `단가 − 커미션 ${STD_COMMISSION}%` }
  }
  return { customerPay: null as number | null, hotelReceive: amount, omhMargin: null as number | null, note: 'net 지불 — 고객가 마크업은 OMH(마켓)에서 적용' }
}

export default function GroupRfpPage() {
  const rfps = useRfps()
  const toast = useToast()
  const now = useNow()
  const [status, setStatus] = useState('')
  const [region, setRegion] = useState('')
  const [applied, setApplied] = useState(0)
  const [active, setActive] = useState<GroupRfp | null>(null)

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

  const regionOpts = useMemo(
    () => [{ value: '', label: 'All' }, ...Array.from(new Set(rfps.map((r) => r.region))).map((rg) => ({ value: rg, label: rg }))],
    [rfps],
  )

  const predicate = (r: GroupRfp) => {
    if (status && effStatus(r, now) !== status) return false
    if (region && r.region !== region) return false
    return true
  }
  const { page, pageSize, total, pageRows, setPage, setPageSize, resetPage } = usePagedFilter(rows, predicate, [applied])

  const columns: Column<GroupRfp>[] = [
    { key: 'ref', header: 'RFP No.', align: 'left', render: (r) => <span className="font-mono text-caption">{r.ref}</span> },
    { key: 'seller', header: '고객사', align: 'left', render: (r) => r.sellerName },
    {
      key: 'dest', header: '지역 / 거리', align: 'left',
      render: (r) => (
        <div>
          <div>{r.country} · {r.region}{r.area ? ` · ${r.area}` : ''}</div>
          <div className="text-caption text-faint">
            {r.anchorName ? `📍 ${r.anchorName} · 차량 ${r.anchorRadiusMin}분` : '지역 일치'}
            {r.distanceKm != null && <span className="ml-1 text-primary">· 우리 호텔 약 {r.distanceKm}km</span>}
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
        return <Badge tone={STATUS_TONE[s]}>{STATUS_LABEL[s]}</Badge>
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
        단체 견적 요청함 — <b>우리 호텔이 있는 도시</b>의 요청만 도착합니다(도시 불일치 시 미발송). 세부 지역이 다르면 <b>거리</b>를 표시하니 참고해 견적하세요.
        고객사가 정한 <b>회신 기한</b> 안에 제출해야 하며(<b>남은 시간</b> 표시 · 기한 임박순 정렬), 기한이 지나면 <b>마감</b>되어 제출할 수 없습니다. 행 클릭 → <b>경쟁 견적 제출</b>(blind).
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

function RfpDetail({ rfp, now, onClose, toast }: { rfp: GroupRfp; now: number; onClose: () => void; toast: ReturnType<typeof useToast> }) {
  const [amount, setAmount] = useState('')
  const [availability, setAvailability] = useState('')
  const [cancelPolicy, setCancelPolicy] = useState<CancelPolicyId>('free-3d')
  const [deadlineHours, setDeadlineHours] = useState('3')
  const [validUntil, setValidUntil] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    setAmount(''); setAvailability(`${roomsText(rfp)} 확보 가능`); setCancelPolicy('free-3d')
    setDeadlineHours('3'); setValidUntil(defaultValidUntil(rfp.quoteDeadline)); setNote('')
  }, [rfp.id, rfp.quoteDeadline]) // eslint-disable-line react-hooks/exhaustive-deps

  const rem = remaining(rfp.quoteDeadline, now)
  const eff = effStatus(rfp, now)
  // 회신 기한 내 신규 요청만 견적 제출 가능 — 기한 경과 시 마감
  const quoting = eff === 'New'
  const awarded = rfp.status === 'Won'
  const amtNum = Number(amount) || 0
  const hrs = Math.max(1, Number(deadlineHours) || 3)
  const canSubmit = quoting && amtNum > 0 && availability.trim() && validUntil

  const submit = () => {
    if (!canSubmit) return
    const pol = policyOf(cancelPolicy)
    const freeCancelUntil = pol.days > 0 ? new Date(new Date(rfp.checkIn).getTime() - pol.days * 86400000).toISOString().slice(0, 10) : undefined
    const q: VendorQuote = {
      amount: amtNum, currency: rfp.currency, availability: availability.trim(),
      cancelPolicy, cancellation: pol.label, freeCancelUntil, paymentDeadlineHours: hrs,
      validUntil, note: note.trim() || undefined, submittedAt: new Date().toISOString().slice(0, 10),
    }
    submitVendorQuote(rfp.id, q)
    toast.push('견적을 제출했습니다 — 고객사 리스트업에 반영됩니다.', 'success')
    onClose()
  }
  const decline = () => { declineRfp(rfp.id); toast.push('요청을 거절했습니다.', 'info'); onClose() }
  const confirmBooking = () => { confirmRfpBooking(rfp.id); toast.push('예약을 컨펌했습니다 — 확정되었습니다.', 'success'); onClose() }
  const rejectBooking = () => { rejectRfpBooking(rfp.id); toast.push('리퀘스트 예약을 거절했습니다 — 문의가 취소됩니다.', 'info'); onClose() }

  const info = (label: string, value: React.ReactNode) => (
    <div><div className="text-caption text-faint">{label}</div><div className="text-base text-ink">{value}</div></div>
  )
  const set = settlement(rfp, rfp.quote?.amount ?? amtNum)

  return (
    <Modal open onClose={onClose} width={720} title={`Group RFP — ${rfp.ref}`}
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
        <Badge tone={STATUS_TONE[eff]}>{STATUS_LABEL[eff]}</Badge>
        <span className="text-caption text-muted">고객사 {rfp.sellerName} · 회신 기한 {fmtDateTime(rfp.quoteDeadline)}</span>
        {(eff === 'New' || eff === 'Quoted') && <Badge tone={rem.tone}>⏱ {rem.label}</Badge>}
        {rfp.holdRequired && <Badge tone="info">객실 홀드 요청</Badge>}
        {rfp.distanceKm != null && <Badge tone="neutral">우리 호텔 약 {rfp.distanceKm}km</Badge>}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="취소 규정 (선택)"><Select value={cancelPolicy} onChange={(v) => setCancelPolicy(v as CancelPolicyId)} options={CANCEL_OPTS} /></Field>
            <Field label="결제 마감 (컨펌 후, 시간)">
              <TextInput type="number" min={1} value={deadlineHours} onChange={(e) => setDeadlineHours(e.target.value)} className="w-full" />
            </Field>
          </div>
          <p className="-mt-1 text-caption text-muted">※ 낙찰·컨펌 후 <b>{hrs}시간</b> 내 미결제 시 자동취소(호텔 설정). 취소 규정은 위 프리셋에서 선택.</p>
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
            {info('취소 규정', rfp.quote.cancellation)}
            {info('무료취소 마감', rfp.quote.freeCancelUntil ?? (rfp.quote.cancelPolicy === 'non-refundable' ? '비환불' : '—'))}
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
          <p className="mt-1 text-caption text-faint">OMH가 Merchant of Record — 고객사가 OMH에 결제, OMH가 호텔에 정산(Billings 15일 주기). 취소 수수료는 정책 구간에 따라 고객 청구 후 호텔 전달.</p>
        </div>
      )}

      {/* 상태별 안내 */}
      {awarded && rfp.quote && (
        <div className="mt-3 rounded border border-warning/40 bg-warning/15 px-3 py-2 text-base text-[#9a6a00]">
          🎉 <b>낙찰</b> — 리퀘스트 예약이 생성되었습니다. <b>예약을 컨펌</b>하거나 거절(문의 취소)하세요.
          컨펌 후 고객이 <b>{rfp.quote.paymentDeadlineHours}시간</b> 내 미결제 시 자동취소됩니다.
        </div>
      )}
      {rfp.status === 'Quoted' && (
        <div className="mt-3 rounded border border-info/30 bg-info/10 px-3 py-2 text-base text-info">견적 제출 완료 — 고객사 선택 결과를 기다립니다. (경쟁 견적 blind)</div>
      )}
      {rfp.status === 'Confirmed' && (
        <div className="mt-3 rounded border border-success/30 bg-success/10 px-3 py-2 text-base font-medium text-success">✅ 예약 확정 — Billings 정산 대상으로 편입됩니다.</div>
      )}
      {rfp.status === 'Cancelled' && (
        <div className="mt-3 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-base text-danger">문의가 취소되었습니다.</div>
      )}
    </Modal>
  )
}
