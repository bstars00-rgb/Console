import { useRef, useState } from 'react'
import { Upload, Star, Trash2, ArrowLeft, ArrowRight, AlertTriangle, Plus } from 'lucide-react'
import type { HotelImage, PhotoCategory } from '../../../data/types'
import { placeholderImage } from '../../../data/placeholder'

const CATEGORY_LABELS: Record<PhotoCategory, string> = {
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

/**
 * Photo management with drag & drop, multi-upload, representative, reorder,
 * category tagging, and resolution/portrait/duplicate warnings. Real files
 * become data-URL thumbnails; "샘플 추가" chips add categorized demo photos.
 */
export function PhotoManager({
  images,
  onChange,
  categories,
  recommend = [],
  namePrefix,
}: {
  images: HotelImage[]
  onChange: (imgs: HotelImage[]) => void
  categories: PhotoCategory[]
  recommend?: { cat: PhotoCategory; label: string }[]
  namePrefix: string
}) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | File[]) => {
    const arr = [...files].filter((f) => /image\/(jpe?g|png|webp)/.test(f.type))
    if (arr.length === 0) return
    setUploading(arr.length)
    arr.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const url = reader.result as string
        const img = new Image()
        img.onload = () => {
          onChange([
            ...currentRef.current,
            {
              id: `${namePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              url,
              caption: file.name,
              isRepresentative: currentRef.current.length === 0,
              category: 'other',
              width: img.naturalWidth,
              height: img.naturalHeight,
            },
          ])
          setUploading((u) => Math.max(0, u - 1))
        }
        img.src = url
      }
      reader.readAsDataURL(file)
    })
  }

  // keep latest images for async file callbacks
  const currentRef = useRef(images)
  currentRef.current = images

  const addSample = (cat: PhotoCategory) => {
    onChange([
      ...images,
      {
        id: `${namePrefix}-${cat}-${Date.now()}`,
        url: placeholderImage(`${namePrefix} ${CATEGORY_LABELS[cat]}`, images.length + cat.length),
        caption: `${CATEGORY_LABELS[cat]} 사진`,
        isRepresentative: images.length === 0,
        category: cat,
        width: 1280,
        height: 854,
      },
    ])
  }

  const update = (id: string, patch: Partial<HotelImage>) => onChange(images.map((im) => (im.id === id ? { ...im, ...patch } : im)))
  const setRep = (id: string) => onChange(images.map((im) => ({ ...im, isRepresentative: im.id === id })))
  const remove = (id: string) => {
    if (!confirm('이 사진을 삭제할까요?')) return
    const next = images.filter((im) => im.id !== id)
    if (next.length && !next.some((i) => i.isRepresentative)) next[0].isRepresentative = true
    onChange(next)
  }
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= images.length) return
    const copy = [...images]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    onChange(copy)
  }

  const captionsSeen = new Set<string>()
  const missingRecommend = recommend.filter((r) => !images.some((im) => im.category === r.cat))

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          addFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed py-6 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary-light' : 'border-line bg-canvas/40 hover:border-primary'
        }`}
        role="button"
        tabIndex={0}
        aria-label="사진 업로드"
      >
        <Upload size={22} className="text-primary" />
        <p className="text-md font-medium text-ink">사진을 끌어다 놓거나 클릭하여 업로드</p>
        <p className="text-caption text-muted">JPG · PNG · WebP · 권장 해상도 1024×768 이상 · 가로형 권장</p>
        {uploading > 0 && <p className="text-caption text-primary">업로드 중… ({uploading})</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Quick sample chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-caption text-muted">샘플 추가:</span>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => addSample(c)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-2 py-0.5 text-caption text-muted hover:border-primary hover:text-primary"
          >
            <Plus size={11} /> {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Missing-type guidance */}
      {missingRecommend.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-caption text-[#9a6a00]">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            추천 사진 종류가 부족합니다: <b>{missingRecommend.map((r) => r.label).join(', ')}</b>. 관련 사진을 추가하면 고객 신뢰도를 높이는 데 도움이 됩니다.
          </span>
        </div>
      )}

      {/* Thumbnails */}
      {images.length === 0 ? (
        <p className="py-4 text-center text-caption text-faint">아직 사진이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((im, i) => {
            const lowRes = (im.width ?? 0) < 1024 || (im.height ?? 0) < 768
            const portrait = (im.height ?? 0) > (im.width ?? 1)
            const dup = im.caption && captionsSeen.has(im.caption)
            if (im.caption) captionsSeen.add(im.caption)
            return (
              <div key={im.id} className={`overflow-hidden rounded-md border ${im.isRepresentative ? 'border-primary ring-1 ring-primary' : 'border-line'} bg-white`}>
                <div className="relative">
                  {im.url ? <img src={im.url} alt={im.caption} className="h-24 w-full object-cover" /> : <div className="h-24 w-full bg-canvas" />}
                  {im.isRepresentative && (
                    <span className="absolute left-1 top-1 rounded-sm bg-primary px-1 py-0.5 text-[9px] font-semibold text-white">대표</span>
                  )}
                  {(lowRes || portrait || dup) && (
                    <span className="absolute right-1 top-1 flex items-center gap-0.5 rounded-sm bg-warning px-1 py-0.5 text-[9px] font-semibold text-white" title="사진 확인 필요">
                      <AlertTriangle size={9} /> 확인
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1 p-1.5">
                  <select
                    value={im.category ?? 'other'}
                    onChange={(e) => update(im.id, { category: e.target.value as PhotoCategory })}
                    aria-label="사진 카테고리"
                    className="h-6 rounded border border-line px-1 text-[11px] text-ink outline-none focus:border-primary"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                    {!categories.includes(im.category ?? 'other') && <option value={im.category}>{CATEGORY_LABELS[im.category ?? 'other']}</option>}
                  </select>
                  {(lowRes || portrait || dup) && (
                    <p className="text-[10px] leading-tight text-[#9a6a00]">
                      {lowRes && '저해상도 '}
                      {portrait && '세로형 '}
                      {dup && '중복 의심'}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-faint">
                    <div className="flex gap-0.5">
                      <button onClick={() => move(i, -1)} disabled={i === 0} className="hover:text-ink disabled:opacity-30" title="앞으로">
                        <ArrowLeft size={12} />
                      </button>
                      <button onClick={() => move(i, 1)} disabled={i === images.length - 1} className="hover:text-ink disabled:opacity-30" title="뒤로">
                        <ArrowRight size={12} />
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setRep(im.id)} className={im.isRepresentative ? 'text-primary' : 'hover:text-primary'} title="대표 사진">
                        <Star size={12} />
                      </button>
                      <button onClick={() => remove(im.id)} className="hover:text-danger" title="삭제">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
