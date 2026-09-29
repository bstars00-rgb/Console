import { useEffect, useMemo, useState } from 'react'
import { Send, XCircle } from 'lucide-react'
import { FilterPanel, Field } from '../../components/ui/FilterPanel'
import { Select, Button, TextInput, DateInput } from '../../components/ui/controls'
import { DataGrid, type Column } from '../../components/ui/DataGrid'
import { Pager } from '../../components/ui/Pager'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { useRfps } from '../../data/hooks'
import { submitVendorQuote, declineRfp } from '../../data/store'
import { usePagedFilter } from '../../lib/usePagedFilter'
import type { GroupRfp, RfpStatus, Currency, VendorQuote } from '../../data/types'

/**
 * Group RFP — 단체 견적 요청(역경매 공급측). 마켓플레이스 셀러가 넣은 단체 문의가
 * 이 호텔(벤더) 콘솔에 도착. 호텔은 여기서 경쟁 견적을 제출(blind)하거나 거절한다.
 * ※ 원본 콘솔에 없던 신규(NEW) 화면 — 단체 문의·역경매 연계.
 */

const money = (n: number, c: Currency) => `${c} ${Math.round(n).toLocaleString()}`
const roomsText = (r: GroupRfp) => r.rooms.map((x) => `${x.roomType} ×${x.count}`).join(', ')
const roomsTotal = (r: GroupRfp) => r.rooms.reduce((s, x) => s + x.count, 0)

const STATUS_TONE: Record<RfpStatus, 'info' | 'warning' | 'success' | 'neutral' | 'danger'> = {
  New: 'info',
  Quoted: 'warning',
  Won: 'success',
  Lost: 'neutral',
  Declined: 'neutral',
  Expired: 'danger',
}
const STATUS_LABEL: Record<RfpStatus, string> = {
  New: '신규 요청',
  Quoted: '견적 제출',
  Won: '낙찰',
  Lost: '미선택',
  Declined: '거절',
  Expired: '마감',
}
const STATUS_OPTS = [{ value: '', label: 'All' }, ...(Object.keys(STATUS_LABEL) as RfpStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))]

/** 계약형태에 따른 금액 입력 안내 */
const amountHint = (r: GroupRfp) =>
  r.contractType === 'Commission'
    ? '단가(판매가) 기준으로 제출 — 커미션은 별도 정산'
    : 'net(원가) 기준으로 제출 — 마켓 마크업은 우리가 적용'

export default function GroupRfpPage() {
  const rows = useRfps()
  const toast = useToast()
  const [status, setStatus] = useState('')
  const [region, setRegion] = useState('')
  const [applied, setApplied] = useState(0)
  const [active, setActive] = useState<GroupRfp | null>(null)

  const regionOpts = useMemo(
    () => [{ value: '', label: 'All' }, ...Array.from(new Set(rows.map((r) => r.region))).map((rg) => ({ value: rg, label: rg }))],
    [rows],
  )

  const predicate = (r: GroupRfp) => {
    if (status && r.status !== status) return false
    if (region && r.region !== region) return false
    return true
  }
  const { page, pageSize, total, pageRows, setPage, setPageSize, resetPage } = usePagedFilter(rows, predicate, [applied])

  const columns: Column<GroupRfp>[] = [
    { key: 'ref', header: 'RFP No.', align: 'left', render: (r) => <span className="font-mono text-caption">{r.ref}</span> },
    { key: 'seller', header: '고객사', align: 'left', render: (r) => r.sellerName },
    {
      key: 'dest', header: '지역 / 기준점', align: 'left',
      render: (r) => (
        <div>
          <div>{r.country} · {r.region}</div>
          {r.anchorName && <div className="text-caption text-faint">📍 {r.anchorName} · 차량 {r.anchorRadiusMin}분</div>}
        </div>
      ),
    },
    { key: 'period', header: '기간', render: (r) => `${r.checkIn} ~ ${r.checkOut} (${r.nights}박)` },
    { key: 'rooms', header: '룸 / 인원', align: 'left', render: (r) => `${roomsTotal(r)}실 · ${r.guests}명` },
    { key: 'type', header: '성격', align: 'left', render: (r) => `${r.groupType ?? '단체'}${r.scope === 'rooms_plus' ? ' · 부대' : ''}` },
    { key: 'budget', header: '고객 예산(참고)', align: 'right', render: (r) => (r.budgetTotal ? money(r.budgetTotal, r.currency) : '—') },
    { key: 'deadline', header: '견적 마감', render: (r) => r.quoteDeadline },
    { key: 'status', header: '상태', align: 'center', render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge> },
  ]

  const doSearch = () => { setApplied((n) => n + 1); resetPage() }
  const reset = () => { setStatus(''); setRegion(''); setApplied((n) => n + 1); resetPage() }

  // 항상 최신 rows에서 active를 다시 읽어 모달이 스토어 변경을 반영
  const activeLive = active ? rows.find((r) => r.id === active.id) ?? active : null

  return (
    <div className="flex flex-col gap-3">
      <FilterPanel actions={<><Button variant="primary" onClick={doSearch}>Search</Button><Button variant="secondary" onClick={reset}>Reset</Button></>}>
        <Field label="Status"><Select value={status} onChange={setStatus} options={STATUS_OPTS} /></Field>
        <Field label="Region"><Select value={region} onChange={setRegion} options={regionOpts} clearable /></Field>
      </FilterPanel>

      <p className="px-1 text-caption text-muted">
        단체 견적 요청함 — 마켓플레이스 고객사가 넣은 단체 문의입니다. 행을 클릭해 <b>경쟁 견적을 제출</b>하거나 거절하세요. (다른 호텔의 견적은 보이지 않습니다 · blind)
      </p>

      <div>
        <DataGrid
          kendo
          columns={columns}
          rows={pageRows}
          rowKey={(r) => r.id}
          onRowClick={(r) => setActive(r)}
          minWidth={1180}
          emptyMessage="요청이 없습니다."
        />
        <Pager kendo page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={setPageSize} />
      </div>

      {activeLive && <RfpDetail rfp={activeLive} onClose={() => setActive(null)} toast={toast} />}
    </div>
  )
}

// ─────────────────────────── 상세 + 견적 제출 ───────────────────────────
function RfpDetail({ rfp, onClose, toast }: { rfp: GroupRfp; onClose: () => void; toast: ReturnType<typeof useToast> }) {
  const [amount, setAmount] = useState('')
  const [availability, setAvailability] = useState('')
  const [cancellation, setCancellation] = useState('무료취소 · 체크인 14일 전까지')
  const [freeCancelUntil, setFreeCancelUntil] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    setAmount('')
    setAvailability(`${roomsText(rfp)} 확보 가능`)
    setCancellation('무료취소 · 체크인 14일 전까지')
    setFreeCancelUntil('')
    setValidUntil(rfp.quoteDeadline)
    setNote('')
  }, [rfp.id, rfp.quoteDeadline]) // eslint-disable-line react-hooks/exhaustive-deps

  const editable = rfp.status === 'New'
  const amtNum = Number(amount) || 0
  const canSubmit = editable && amtNum > 0 && availability.trim() && validUntil

  const submit = () => {
    if (!canSubmit) return
    const q: VendorQuote = {
      amount: amtNum, currency: rfp.currency, availability: availability.trim(),
      cancellation: cancellation.trim(), freeCancelUntil: freeCancelUntil || undefined,
      validUntil, note: note.trim() || undefined, submittedAt: new Date().toISOString().slice(0, 10),
    }
    submitVendorQuote(rfp.id, q)
    toast.push('견적을 제출했습니다 — 고객사 리스트업에 반영됩니다.', 'success')
    onClose()
  }
  const decline = () => {
    declineRfp(rfp.id)
    toast.push('요청을 거절했습니다.', 'info')
    onClose()
  }

  const info = (label: string, value: React.ReactNode) => (
    <div>
      <div className="text-caption text-faint">{label}</div>
      <div className="text-base text-ink">{value}</div>
    </div>
  )
  const inputCls = 'w-full'

  return (
    <Modal
      open
      onClose={onClose}
      width={720}
      title={`Group RFP — ${rfp.ref}`}
      footer={
        editable ? (
          <>
            <Button variant="danger" onClick={decline}><XCircle size={14} /> 거절</Button>
            <Button variant="primary" onClick={submit} disabled={!canSubmit}><Send size={14} /> 견적 제출</Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>닫기</Button>
        )
      }
    >
      {/* 상태 */}
      <div className="mb-3 flex items-center gap-2">
        <Badge tone={STATUS_TONE[rfp.status]}>{STATUS_LABEL[rfp.status]}</Badge>
        <span className="text-caption text-muted">고객사 {rfp.sellerName} · 견적 마감 {rfp.quoteDeadline}</span>
        {rfp.holdRequired && <Badge tone="info">객실 홀드 요청</Badge>}
      </div>

      {/* 요청 요건 */}
      <div className="grid grid-cols-2 gap-3 rounded border border-line bg-canvas/40 p-3 md:grid-cols-3">
        {info('목적지', `${rfp.country} · ${rfp.region}`)}
        {info('기준점', rfp.anchorName ? `${rfp.anchorName} · 차량 ${rfp.anchorRadiusMin}분` : '—')}
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

      {/* 견적 제출 / 조회 */}
      <div className="mt-4">
        <div className="mb-2 text-md font-semibold text-ink">견적 {editable ? '제출' : ''}</div>

        {editable ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label={`견적 금액 (${rfp.currency})`}>
                <TextInput type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="총액" className={inputCls} />
              </Field>
              <Field label="유효기한">
                <DateInput value={validUntil} onChange={setValidUntil} className={inputCls} />
              </Field>
            </div>
            <p className="-mt-1 text-caption text-muted">
              계약형태: <b>{rfp.contractType}</b> — {amountHint(rfp)}
              {amtNum > 0 && rfp.budgetTotal ? (
                <span className={amtNum > rfp.budgetTotal ? ' text-danger' : ' text-success'}>
                  {' · '}고객 예산 대비 {amtNum > rfp.budgetTotal ? `초과 +${money(amtNum - rfp.budgetTotal, rfp.currency)}` : `이내 −${money(rfp.budgetTotal - amtNum, rfp.currency)}`}
                </span>
              ) : null}
            </p>
            <Field label="가용 확보">
              <TextInput value={availability} onChange={(e) => setAvailability(e.target.value)} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="취소 규정">
                <TextInput value={cancellation} onChange={(e) => setCancellation(e.target.value)} className={inputCls} />
              </Field>
              <Field label="무료취소 마감 (선택)">
                <DateInput value={freeCancelUntil} onChange={setFreeCancelUntil} className={inputCls} />
              </Field>
            </div>
            <Field label="메모 (선택)">
              <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="부대 조건·특이사항" className={inputCls} />
            </Field>
          </div>
        ) : rfp.quote ? (
          <div className="grid grid-cols-2 gap-3 rounded border border-line bg-white p-3 md:grid-cols-3">
            {info('제출 금액', money(rfp.quote.amount, rfp.quote.currency))}
            {info('가용', rfp.quote.availability)}
            {info('취소 규정', rfp.quote.cancellation)}
            {info('무료취소 마감', rfp.quote.freeCancelUntil ?? '—')}
            {info('유효기한', rfp.quote.validUntil)}
            {info('제출일', rfp.quote.submittedAt)}
            {rfp.quote.note && info('메모', rfp.quote.note)}
          </div>
        ) : (
          <p className="text-base text-muted">제출된 견적이 없습니다.</p>
        )}

        {rfp.status === 'Won' && (
          <div className="mt-3 rounded border border-success/30 bg-success/10 px-3 py-2 text-base font-medium text-success">
            ✅ 낙찰되었습니다 — 리퀘스트 예약으로 확정 진행됩니다.
          </div>
        )}
        {rfp.status === 'Quoted' && (
          <div className="mt-3 rounded border border-warning/40 bg-warning/15 px-3 py-2 text-base text-[#9a6a00]">
            견적 제출 완료 — 고객사 선택 결과를 기다립니다. (경쟁 견적 blind)
          </div>
        )}
      </div>
    </Modal>
  )
}
