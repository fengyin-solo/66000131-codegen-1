import { useEffect, useMemo, useRef, useState } from 'react'
import { useDesignStore } from '../store/design'
import { useSchemesStore, validateSchemeName } from '../store/schemes'
import { THEMES } from '../themes/palettes'
import { renderPreview, svgToDataUrl } from '../generators/render'
import type { PatternType, Scheme, SchemeParams } from '../types'

const PATTERN_LABELS: Record<PatternType, string> = {
  spiral: '螺旋', fractal: '分形树', wave: '波浪', circles: '圆环', noise: '噪声场', voronoi: '其他',
}

function themeNameOf(themeId: string): string {
  return THEMES.find(t => t.id === themeId)?.name ?? '自定义'
}

function paletteOf(themeId: string): string[] {
  return THEMES.find(t => t.id === themeId)?.colors ?? THEMES[0].colors
}

/** 比较当前画面参数与某方案是否完全一致（八个维度） */
function sameParams(scheme: Scheme, p: SchemeParams): boolean {
  return scheme.pattern === p.pattern
    && scheme.themeId === p.themeId
    && scheme.seed === p.seed
    && scheme.iterations === p.iterations
    && scheme.scale === p.scale
    && scheme.rotation === p.rotation
    && scheme.strokeWidth === p.strokeWidth
    && scheme.opacity === p.opacity
}

type CardStatus = 'active' | 'adjusted' | 'idle'

/* ---------------- 单张方案卡片 ---------------- */

function SchemeCard({ scheme, current, bgColor }: {
  scheme: Scheme
  current: SchemeParams
  bgColor: string
}) {
  const applyScheme = useDesignStore(s => s.applyScheme)
  const activeSchemeId = useDesignStore(s => s.activeSchemeId)
  const setActiveSchemeId = useDesignStore(s => s.setActiveSchemeId)
  const renameScheme = useSchemesStore(s => s.renameScheme)
  const removeScheme = useSchemesStore(s => s.removeScheme)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(scheme.name)
  const [error, setError] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const isActive = activeSchemeId === scheme.id
  const status: CardStatus = isActive
    ? (sameParams(scheme, current) ? 'active' : 'adjusted')
    : 'idle'

  const previewUrl = useMemo(() => {
    const svg = renderPreview({
      width: 800,
      height: 1000,
      pattern: scheme.pattern,
      iterations: scheme.iterations,
      scale: scheme.scale,
      palette: paletteOf(scheme.themeId),
      seed: scheme.seed,
      strokeWidth: scheme.strokeWidth,
      opacity: scheme.opacity,
      bgColor,
      rotation: scheme.rotation,
    })
    return svgToDataUrl(svg)
  }, [scheme, bgColor])

  useEffect(() => {
    if (editing) {
      setDraft(scheme.name)
      setError(null)
      // 等待 input 渲染后聚焦并全选
      requestAnimationFrame(() => {
        editInputRef.current?.focus()
        editInputRef.current?.select()
      })
    }
  }, [editing, scheme.name])

  const submitRename = () => {
    const schemes = useSchemesStore.getState().schemes
    const err = validateSchemeName(draft, schemes, scheme.id)
    if (err) { setError(err); return }
    renameScheme(scheme.id, draft)
    setEditing(false)
  }

  const handleRemove = () => {
    removeScheme(scheme.id)
    if (activeSchemeId === scheme.id) setActiveSchemeId(null)
  }

  const ringClass = status === 'active'
    ? 'border-indigo-400 shadow-[0_0_0_1px_rgba(129,140,248,0.7)]'
    : status === 'adjusted'
      ? 'border-amber-500/70'
      : 'border-gray-700 hover:border-gray-500'

  if (editing) {
    return (
      <div className={`col-span-2 rounded-lg border ${ringClass} bg-gray-800/60 p-2 flex gap-2`}>
        <img src={previewUrl} alt={scheme.name}
          className="w-14 h-[70px] rounded object-cover bg-gray-950 shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <input
            ref={editInputRef}
            value={draft}
            onChange={e => { setDraft(e.target.value); setError(null) }}
            onKeyDown={e => {
              if (e.key === 'Enter') submitRename()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="w-full px-2 py-1 text-xs rounded bg-gray-900 border border-gray-600 focus:border-indigo-400 outline-none"
            placeholder="输入方案名称"
          />
          {error && <p className="text-[11px] text-rose-400 leading-tight">{error}</p>}
          <div className="flex gap-1 mt-auto">
            <button onClick={submitRename}
              className="px-2 py-0.5 text-[11px] rounded bg-indigo-600 hover:bg-indigo-500">保存</button>
            <button onClick={() => setEditing(false)}
              className="px-2 py-0.5 text-[11px] rounded bg-gray-700 hover:bg-gray-600">取消</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => applyScheme(scheme)}
      title={`点击套用「${scheme.name}」`}
      className={`group rounded-lg border ${ringClass} bg-gray-800/40 p-1.5 cursor-pointer transition-colors flex flex-col gap-1`}
    >
      <div className="relative">
        <img src={previewUrl} alt={scheme.name}
          className="w-full aspect-[4/5] rounded object-cover bg-gray-950" />
        {status === 'active' && (
          <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-600/90 font-medium">使用中</span>
        )}
        {status === 'adjusted' && (
          <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/90 text-gray-950 font-medium">已调整</span>
        )}
      </div>
      <p className="text-xs font-medium truncate px-0.5" title={scheme.name}>{scheme.name}</p>
      <p className="text-[10px] text-gray-500 px-0.5 truncate">
        {PATTERN_LABELS[scheme.pattern]} · {themeNameOf(scheme.themeId)} · #{scheme.seed}
      </p>
      <div className="flex gap-1 px-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true) }}
          title="重命名"
          className="flex-1 px-1 py-0.5 text-[11px] rounded bg-gray-700 hover:bg-gray-600">✏️ 改名</button>
        <button
          onClick={(e) => { e.stopPropagation(); handleRemove() }}
          title="移除方案"
          className="flex-1 px-1 py-0.5 text-[11px] rounded bg-gray-700 hover:bg-rose-600">🗑️ 移除</button>
      </div>
    </div>
  )
}

/* ---------------- 方案收纳区 ---------------- */

export default function SchemePanel() {
  const schemes = useSchemesStore(s => s.schemes)
  const addScheme = useSchemesStore(s => s.addScheme)

  const pattern = useDesignStore(s => s.pattern)
  const themeId = useDesignStore(s => s.themeId)
  const seed = useDesignStore(s => s.seed)
  const iterations = useDesignStore(s => s.iterations)
  const scale = useDesignStore(s => s.scale)
  const rotation = useDesignStore(s => s.rotation)
  const strokeWidth = useDesignStore(s => s.strokeWidth)
  const opacity = useDesignStore(s => s.opacity)
  const bgColor = useDesignStore(s => s.bgColor)

  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [nameSeq, setNameSeq] = useState(1)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const current: SchemeParams = { pattern, themeId, seed, iterations, scale, rotation, strokeWidth, opacity }

  useEffect(() => {
    if (formOpen) {
      let seq = nameSeq
      // 跳过已被占用的默认名
      while (schemes.some(s => s.name === `方案 ${seq}`)) seq += 1
      setNameSeq(seq)
      setName(`方案 ${seq}`)
      setError(null)
      requestAnimationFrame(() => nameInputRef.current?.focus())
    }
  }, [formOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    const result = addScheme(name, current)
    if (!result.ok) {
      // 校验失败：保留用户已输入的名字并给出可读提醒
      setError(result.error ?? '保存失败，请检查名称')
      nameInputRef.current?.focus()
      return
    }
    setFormOpen(false)
    setName('')
    setError(null)
    setNameSeq(seq => seq + 1)
  }

  return (
    <div className="border-t border-gray-700 pt-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-gray-400">我的方案（{schemes.length}）</label>
        <button
          onClick={() => setFormOpen(v => !v)}
          className="text-xs px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 font-medium">
          {formOpen ? '收起' : '＋ 保存当前方案'}
        </button>
      </div>

      {formOpen && (
        <div className="mb-3 p-2 rounded-lg bg-gray-800/60 border border-gray-700 flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <input
              ref={nameInputRef}
              value={name}
              onChange={e => { setName(e.target.value); setError(null) }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') setFormOpen(false)
              }}
              placeholder="给方案起个名字"
              className="flex-1 min-w-0 px-2 py-1 text-xs rounded bg-gray-900 border border-gray-600 focus:border-indigo-400 outline-none"
            />
            <button onClick={handleSave}
              className="px-2 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-500 shrink-0">保存</button>
          </div>
          {error
            ? <p className="text-[11px] text-rose-400 leading-tight">{error}</p>
            : <p className="text-[10px] text-gray-500 leading-tight">将保存图案、主题、种子、迭代数、缩放、旋转、描边与透明度</p>}
        </div>
      )}

      {schemes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 p-3 text-center text-[11px] text-gray-500 leading-relaxed">
          还没有保存的方案。<br />调好参数后点击「保存当前方案」，即可在此收纳。
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {schemes.map(s => (
            <SchemeCard key={s.id} scheme={s} current={current} bgColor={bgColor} />
          ))}
        </div>
      )}
    </div>
  )
}
