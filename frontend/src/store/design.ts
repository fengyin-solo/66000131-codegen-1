import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DesignParams, PatternType, SavedScheme, SchemeSnapshot } from '../types'
import { THEMES } from '../themes/palettes'
import { buildSchemePreview, type SvgSpec } from '../render/svg'

export interface SchemeActionResult {
  ok: boolean
  error?: string
}

const SCHEMES_KEY = 'poster-designer:schemes'

interface DesignStore extends DesignParams {
  svgContent: string
  /** 已保存的方案（本地持久化） */
  schemes: SavedScheme[]
  /** 当前画面所套用的方案 id；null 表示未基于任何方案 */
  activeSchemeId: string | null
  /** activeSchemeId 对应方案被手动改动后的 id，用于在卡片上标“已调整” */
  dirtySchemeId: string | null
  setParam: <K extends keyof DesignParams>(key: K, value: DesignParams[K]) => void
  setPattern: (p: PatternType) => void
  setTheme: (id: string) => void
  randomSeed: () => void
  setSvgContent: (s: string) => void
  /** 用当前画面参数另存为一个新方案 */
  saveScheme: (name: string) => SchemeActionResult
  /** 整组套回方案参数（滑杆、图案按钮、主题高亮随之同步） */
  applyScheme: (id: string) => void
  /** 改名；空名或重名时返回错误信息，不改动原值 */
  renameScheme: (id: string, name: string) => SchemeActionResult
  removeScheme: (id: string) => void
  exportSvg: () => void
  exportPng: () => void
}

function snapshotOf(p: DesignParams): SchemeSnapshot {
  return {
    pattern: p.pattern,
    themeId: p.themeId,
    seed: p.seed,
    iterations: p.iterations,
    scale: p.scale,
    rotation: p.rotation,
    strokeWidth: p.strokeWidth,
    opacity: p.opacity,
  }
}

function sameSnapshot(a: SchemeSnapshot, b: SchemeSnapshot): boolean {
  return (Object.keys(a) as (keyof SchemeSnapshot)[]).every(k => a[k] === b[k])
}

function specOf(p: DesignParams): SvgSpec {
  return {
    width: p.width,
    height: p.height,
    pattern: p.pattern,
    seed: p.seed,
    iterations: p.iterations,
    scale: p.scale,
    rotation: p.rotation,
    strokeWidth: p.strokeWidth,
    opacity: p.opacity,
    palette: p.palette,
    bgColor: p.bgColor,
  }
}

/**
 * 手动改参数之后：若当前正套用某个方案，且改动使其偏离原方案，
 * 把该方案标记为“已调整”；若恰好改回原值，则取消标记。
 */
function reconcileActive(
  params: DesignParams,
  schemes: SavedScheme[],
  activeSchemeId: string | null,
): { activeSchemeId: string | null; dirtySchemeId: string | null } {
  if (!activeSchemeId) return { activeSchemeId: null, dirtySchemeId: null }
  const active = schemes.find(s => s.id === activeSchemeId)
  if (!active) return { activeSchemeId: null, dirtySchemeId: null }
  const dirty = !sameSnapshot(snapshotOf(params), active)
  return { activeSchemeId, dirtySchemeId: dirty ? activeSchemeId : null }
}

export const useDesignStore = create<DesignStore>()(persist((set, get) => {
  const mutate = (partial: Partial<DesignParams>) => {
    const state = get()
    const nextParams: DesignParams = {
      pattern: state.pattern,
      themeId: state.themeId,
      seed: state.seed,
      iterations: state.iterations,
      scale: state.scale,
      rotation: state.rotation,
      strokeWidth: state.strokeWidth,
      opacity: state.opacity,
      bgColor: state.bgColor,
      palette: state.palette,
      width: state.width,
      height: state.height,
      ...partial,
    }
    set({
      ...partial,
      ...reconcileActive(nextParams, state.schemes, state.activeSchemeId),
    })
  }

  const validateName = (name: string, excludeId?: string): string | null => {
    const trimmed = name.trim()
    if (!trimmed) return '请输入方案名称，名称不能为空。'
    const dup = get().schemes.some(s => s.name === trimmed && s.id !== excludeId)
    if (dup) return `已存在名为「${trimmed}」的方案，请换一个名字。`
    return null
  }

  return {
    pattern: 'spiral',
    themeId: THEMES[0].id,
    seed: 42,
    iterations: 200,
    scale: 1.0,
    rotation: 0,
    strokeWidth: 1.5,
    opacity: 0.8,
    bgColor: '#030712',
    palette: THEMES[0].colors,
    width: 800,
    height: 1000,
    svgContent: '',
    schemes: [],
    activeSchemeId: null,
    dirtySchemeId: null,

    setParam: (key, value) => mutate({ [key]: value } as Partial<DesignParams>),
    setPattern: (p) => mutate({ pattern: p }),
    setTheme: (id) => {
      const theme = THEMES.find(t => t.id === id)
      if (theme) mutate({ themeId: id, palette: theme.colors })
    },
    randomSeed: () => mutate({ seed: Math.floor(Math.random() * 99999) }),
    setSvgContent: (s) => set({ svgContent: s }),

    saveScheme: (name) => {
      const error = validateName(name)
      if (error) return { ok: false, error }
      const state = get()
      const scheme: SavedScheme = {
        ...snapshotOf(state),
        id: `scheme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        preview: buildSchemePreview(specOf(state)),
        createdAt: Date.now(),
      }
      // 新存的方案与当前画面完全一致：作为当前方案且未调整
      set({
        schemes: [...state.schemes, scheme],
        activeSchemeId: scheme.id,
        dirtySchemeId: null,
      })
      return { ok: true }
    },

    applyScheme: (id) => {
      const scheme = get().schemes.find(s => s.id === id)
      if (!scheme) return
      const theme = THEMES.find(t => t.id === scheme.themeId)
      set({
        pattern: scheme.pattern,
        themeId: scheme.themeId,
        palette: theme ? theme.colors : get().palette,
        seed: scheme.seed,
        iterations: scheme.iterations,
        scale: scheme.scale,
        rotation: scheme.rotation,
        strokeWidth: scheme.strokeWidth,
        opacity: scheme.opacity,
        activeSchemeId: scheme.id,
        dirtySchemeId: null,
      })
    },

    renameScheme: (id, name) => {
      const error = validateName(name, id)
      if (error) return { ok: false, error }
      set({ schemes: get().schemes.map(s => (s.id === id ? { ...s, name: name.trim() } : s)) })
      return { ok: true }
    },

    removeScheme: (id) => {
      set(state => ({
        schemes: state.schemes.filter(s => s.id !== id),
        activeSchemeId: state.activeSchemeId === id ? null : state.activeSchemeId,
        dirtySchemeId: state.dirtySchemeId === id ? null : state.dirtySchemeId,
      }))
    },

    exportSvg: () => {
      const { svgContent } = get()
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `art-${get().seed}.svg`; a.click()
      URL.revokeObjectURL(url)
    },
    exportPng: () => {
      const { svgContent, width, height } = get()
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(svgBlob)
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)
        canvas.toBlob(blob => {
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob!)
          a.download = `art-${get().seed}.png`; a.click()
        })
      }
      img.src = url
    },
  }
}, {
  name: SCHEMES_KEY,
  // 只持久化方案本身；当前选中/已调整状态每次打开页面重新开始
  partialize: (state) => ({ schemes: state.schemes }),
}))
