import { useState } from 'react'
import { useDesignStore } from '../store/design'
import type { PatternType, SavedScheme } from '../types'

const PATTERN_LABELS: Record<PatternType, string> = {
  spiral: '🌀 螺旋',
  fractal: '🌳 分形树',
  wave: '🌊 波浪',
  circles: '⭕ 圆环',
  voronoi: '🔷 泰森',
  noise: '🎲 噪声场',
}

/** 用 dangerouslySetInnerHTML 承载内联预览 SVG 的小图容器 */
function SchemeThumb({ svg }: { svg: string }) {
  return (
    <div
      className="scheme-thumb w-full h-full [&>svg]:block [&>svg]:w-full [&>svg]:h-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

interface CardProps {
  scheme: SavedScheme
  isActive: boolean
  isDirty: boolean
}

function SchemeCard({ scheme, isActive, isDirty }: CardProps) {
  const applyScheme = useDesignStore(s => s.applyScheme)
  const renameScheme = useDesignStore(s => s.renameScheme)
  const removeScheme = useDesignStore(s => s.removeScheme)

  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(scheme.name)
  const [editError, setEditError] = useState<string | null>(null)
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  const commitRename = () => {
    const res = renameScheme(scheme.id, draftName)
    if (res.ok) {
      setEditing(false)
      setEditError(null)
    } else {
      // 校验失败：保留输入框里的名字，就地提示
      setEditError(res.error ?? '名称无效')
    }
  }

  const cancelRename = () => {
    setEditing(false)
    setDraftName(scheme.name)
    setEditError(null)
  }

  const ringClass = isActive
    ? (isDirty ? 'ring-2 ring-amber-500' : 'ring-2 ring-indigo-500')
    : 'ring-1 ring-gray-700 hover:ring-gray-500'

  return (
    <div
      onClick={() => { if (!editing) applyScheme(scheme.id) }}
      className={`group rounded-lg overflow-hidden bg-gray-800 cursor-pointer transition ${ringClass} ${editing || confirmingRemove ? 'cursor-default' : ''}`}
      title="点击套用此方案"
    >
      {/* 预览图（4:5 竖版） */}
      <div className="relative w-full aspect-[4/5] bg-gray-950">
        <SchemeThumb svg={scheme.preview} />

        {/* 状态角标 */}
        {isActive && (
          <span className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${isDirty ? 'bg-amber-600' : 'bg-indigo-600'}`}>
            {isDirty ? '已调整' : '使用中'}
          </span>
        )}

        {/* 悬浮操作：改名 / 删除 */}
        {!editing && (
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={(e) => { e.stopPropagation(); setDraftName(scheme.name); setEditError(null); setConfirmingRemove(false); setEditing(true) }}
              className="w-6 h-6 flex items-center justify-center rounded bg-gray-900/80 hover:bg-indigo-600 text-xs"
              title="改名"
            >
              ✏️
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmingRemove(v => !v); setEditing(false) }}
              className="w-6 h-6 flex items-center justify-center rounded bg-gray-900/80 hover:bg-rose-600 text-xs"
              title="移除"
            >
              🗑
            </button>
          </div>
        )}

        {/* 删除二次确认 */}
        {confirmingRemove && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-950/90 p-2 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[11px] text-gray-200">移除「{scheme.name}」？</span>
            <div className="flex gap-2">
              <button
                onClick={() => removeScheme(scheme.id)}
                className="px-2 py-0.5 rounded text-[11px] bg-rose-600 hover:bg-rose-500"
              >
                移除
              </button>
              <button
                onClick={() => setConfirmingRemove(false)}
                className="px-2 py-0.5 rounded text-[11px] bg-gray-700 hover:bg-gray-600"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 名称与参数摘要 */}
      <div className="p-1.5">
        {editing ? (
          <div onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => { setDraftName(e.target.value); setEditError(null) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') cancelRename()
              }}
              className="w-full px-1 py-0.5 rounded bg-gray-900 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex gap-1 mt-1">
              <button onClick={commitRename} className="flex-1 py-0.5 rounded text-[10px] bg-indigo-600 hover:bg-indigo-500">确定</button>
              <button onClick={cancelRename} className="flex-1 py-0.5 rounded text-[10px] bg-gray-700 hover:bg-gray-600">取消</button>
            </div>
            {editError && <p className="mt-1 text-[10px] leading-tight text-amber-400">{editError}</p>}
          </div>
        ) : (
          <>
            <p className={`text-xs truncate ${isActive ? 'text-white font-medium' : 'text-gray-200'}`}>{scheme.name}</p>
            <p className="text-[10px] text-gray-500 truncate">{PATTERN_LABELS[scheme.pattern]} · 种子 {scheme.seed}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function SchemePanel() {
  const schemes = useDesignStore(s => s.schemes)
  const activeSchemeId = useDesignStore(s => s.activeSchemeId)
  const dirtySchemeId = useDesignStore(s => s.dirtySchemeId)
  const saveScheme = useDesignStore(s => s.saveScheme)

  const [name, setName] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = () => {
    const res = saveScheme(name)
    if (res.ok) {
      setName('')
      setSaveError(null)
    } else {
      // 空名/重名：提示且保留已输入的名字
      setSaveError(res.error ?? '无法保存方案')
    }
  }

  return (
    <section className="flex flex-col gap-2 border-t border-gray-700 pt-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">方案收纳区</label>
        <span className="text-[10px] text-gray-600">{schemes.length} 个方案 · 本地保存</span>
      </div>

      {/* 保存当前效果 */}
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setSaveError(null) }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
          placeholder="给当前效果起个名字…"
          className="flex-1 min-w-0 px-2 py-1 rounded bg-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={handleSave}
          className="shrink-0 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-medium"
        >
          💾 存方案
        </button>
      </div>
      {saveError && <p className="text-[11px] text-amber-400 leading-tight">{saveError}</p>}

      {/* 卡片墙 */}
      {schemes.length === 0 ? (
        <p className="text-[11px] text-gray-600 leading-relaxed py-2">
          还没有保存过方案。调好滑杆后起个名字点「存方案」，之后点卡片即可一键套回。
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {schemes.map(scheme => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              isActive={scheme.id === activeSchemeId}
              isDirty={scheme.id === dirtySchemeId}
            />
          ))}
        </div>
      )}
    </section>
  )
}
