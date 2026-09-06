# Content Booster — "Boost your hotel" (판매력 높이기)

A new tab inside the existing **Hotel Master** popup that helps hotel staff
complete complex content easily, feel progress as they add content, and see
immediately how their input appears on the OHMYTRIP customer site.

The existing **Basic / Description / Photo** tabs, the Hotel Master modal, the
shell, routing, data model, and GitHub Pages deploy are all preserved. The new
tab shares the same draft state, so edits in any tab reflect everywhere.

## User flow
1. See the current **Content Strength Score** (콘텐츠 경쟁력 점수).
2. Get guided to the highest-impact next action (top recommendation + Quick wins).
3. Complete one short mission at a time (3–5 questions per screen).
4. Score rises immediately on save (count-up + progress animation).
5. See the change live in the OHMYTRIP preview.
6. Move naturally to the next mission.

## OTA principles applied (adapted to OHMYHOTEL, not copied)
- **Expedia**: auto-detect missing info; recommend by sales impact; explain *why*
  each task matters for exposure / trust / conversion; one-click CTAs.
- **Booking.com**: a clear overall score used as a checklist toward 100%; done vs
  not-done clearly separated; small actionable items completed one by one.
- **Agoda**: photos weighted highest; hotel vs room photos separated; min count,
  resolution, photo types, per-room coverage evaluated; facility → photo prompts;
  per-room bedroom/bathroom/view checks.

## Content Strength Score
0–100, computed by `src/lib/contentScore.ts` (pure, tested). Bands:

| Range | Label (KO) | Colour |
|------:|------------|--------|
| 0–39 | 시작 필요 | Red `#D0021B` |
| 40–59 | 기본 정보 부족 | Orange `#EF7F29` |
| 60–79 | 판매 준비 중 | Yellow `#E1B000` |
| 80–94 | 경쟁력 있음 | Blue `#1976D2` |
| 95–100 | 판매 준비 완료 | Green `#2E7D32` |

Dashboard shows: current score + band, previous score, session gain (오늘 상승),
completed count, remaining required count, completion %, last-updated time, and
the single most valuable next action.

**Phrasing** — allowed: "콘텐츠를 완성하면 고객이 호텔을 더 쉽게 이해할 수 있습니다",
"검색 필터 노출과 예약전환에 도움이 됩니다". **Forbidden**: any guarantee of search
rank, bookings, or revenue. The UI never promises ranking or sales outcomes.

## Scoring weights (total 100)
| Category | Points |
|---|--:|
| 호텔 사진 | 30 |
| 객실 사진 | 20 |
| 객실 정보 | 15 |
| 시설 및 서비스 | 10 |
| 호텔 기본정보와 위치 | 10 |
| 정책과 이용정보 | 8 |
| 호텔 설명과 특징 | 5 |
| 다국어 완성도 | 2 |

### 호텔 사진 (30)
대표 사진 4 · 10장 이상 8 · 20장 이상 +5 · 로비 2 · 외관 2 · 레스토랑 2 ·
주요 시설 3 · 최소 해상도(1024×768) 2 · 사진 태그 2.

### 객실 사진 (20)
모든 객실 사진 존재 6 · 객실별 4장 이상 6 · 침실 3 · 욕실 3 · 전망/특징 2.
(침실·욕실은 모든 객실 충족 시 획득.)

### 객실 정보 (15)
객실명 2 · 크기 3 · 침대 구성 3 · 최대 투숙인원 2 · 전망 2 · 편의시설(3+) 3.

### 시설 및 서비스 (10)
시설 3개 이상 4 · 8개 이상 3 · 시설 사진 3.

### 호텔 기본정보와 위치 (10)
호텔명(EN) 1 · 연락처 1 · 주소(EN) 2 · 우편번호 1 · 성급 1 · 국가·지역 1 ·
지도 위치 2 · 주변 정보(3+) 1.

### 정책과 이용정보 (8)
체크인 2 · 체크아웃 2 · 정책 2개 이상 2 · 4개 이상 2.

### 호텔 설명과 특징 (5)
설명 입력(20자+) 3 · 상세 설명(100자+) 2.

### 다국어 완성도 (2)
호텔명 5개 언어 1 · 설명 3개 언어 이상 1.

## Missions (left rail)
기본정보 · 호텔 설명 · 위치 및 주변 정보 · 시설 및 서비스 · 호텔 사진 · 객실 정보 ·
객실 사진 · 정책 및 이용정보 · 다국어 콘텐츠 · 최종 점검. Each shows earned/max,
%, status (Not started / In progress / Completed / Needs review), missing count,
estimated time, why-it-helps, and a start/edit action. The highest-impact
incomplete mission is recommended.

## Quick wins
Incomplete items ranked by: required → efficiency (points ÷ minutes) → points →
time. Each has a one-click "시작하기".

## Layout (desktop)
- **Top**: score dashboard + top recommendation + Continue improving / 고객 화면 보기 / 저장 / 게시 요청.
- **Left**: mission checklist cards.
- **Centre**: step-by-step input (3–5 fields), each with easy explanation, example,
  required/recommended badge, and "고객 화면 표시 위치".
- **Right**: OHMYTRIP live preview (desktop/mobile toggle; focus → 1.6s highlight).

## Preview (two separate features)
1. **실시간 미리보기** — in-console OHMYTRIP hotel-detail reproduction that reflects
   the DRAFT immediately (`OhmytripPreview.tsx`). OHMYTRIP is a separate repo and
   is not modified.
2. **고객 화면 보기** — opens the live OHMYTRIP clone in a new tab.

## Photos
Drag & drop + multi-upload (real files → data-URL thumbnails), sample chips,
representative, reorder, category tag, resolution/portrait/duplicate warnings,
missing-type guidance, facility→photo prompts, delete confirm, score recompute.
Targets: hotel 20+; room 4+ incl. 침실·욕실.

### AI 자동 매칭 (prototype)
On upload each photo is analyzed **in the browser** and auto-matched to a
category with a confidence, tags, and quality flags (`src/lib/aiPhotoAnalysis.ts`):
- **Filename keywords** (e.g. `pool`, `bathroom`, `lobby`, `욕실`, `외관`) → high-confidence match.
- **Pixel heuristics** (average colour, brightness, aspect ratio via a 24×24 canvas)
  when the filename gives no hint — blue+bright → pool, very bright → lobby, warm+dark → restaurant, etc.
- Suggestions are clamped to the categories valid for the scope (hotel vs room).
- Each thumbnail shows an **✨ AI NN%** badge; the user can override the category
  (which clears the AI flag). Controls: an **AI 자동 매칭** on/off switch,
  **AI로 다시 분석** (re-run on all uploaded photos), and **대표사진 AI 추천**
  (auto-pick the best hero photo by category + resolution + landscape).

This is an honest prototype (no backend, no external model). In production the
same interface would call a real vision API; behaviour and UI stay the same.

### AI 설명 풍성화 (prototype)
In the Description mission, **AI로 설명 풍성화** composes a richer description
from the hotel's own structured data — star, type, region, nearby places,
facilities (grouped into wellness / dining / services), room types (names, size
range, common amenities), and check-in/out (`src/lib/descriptionEnrich.ts`,
pure & tested). Tones: 간결하게 / 표준 / 감성적으로. The generated draft is shown
with a **검토 필요** flag; the user can **적용(교체)**, **이어붙이기**, or 닫기.
Applying it raises the description score (20자/100자 items). It also lists which
fields (시설·주변·객실 크기·성급) would make the draft richer. Honest prototype
(no LLM); production would swap the composer for a real text-generation model
behind the same `(hotel, rooms, tone) → text` interface.

## Multilingual
Base language first; per-language status; "자동 번역 초안" mock that stamps a
**검토 필요** state; review flag surfaced in the UI.

## Autosave & publish
Debounced autosave → localStorage-backed store (Draft); states Editing / Saving /
Saved / Draft / Needs review / Published / Rejected; unsaved-while-saving warning.
`저장` = Draft; `게시 요청` = Needs review (or Published at 95+).

## Internal-staff overview
The Hotel Content list shows a **Content NN** badge per hotel (colour by band) so
low-completeness hotels are easy to spot. Mock hotels: A Sakura ~34 (low),
B Hoa Binh 68 (medium), C Ohmy Grand 94 (high).

## Accessibility & design
OHMYHOTEL brand kept. Status shown by text + colour (not colour alone), keyboard
focus states, AA contrast, no horizontal overflow on mobile, professional (not
gamey) feedback.
