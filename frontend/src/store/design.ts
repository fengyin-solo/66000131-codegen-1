import { create } from 'zustand'
import type { DesignParams, PatternType, Scheme } from '../types'
import { THEMES } from '../themes/palettes'

interface DesignStore extends DesignParams {
  /** 最近一次套用的方案 id；当前参数与该方案不一致时卡片显示「已调整」 */
  activeSchemeId: string | null
  svgContent: string
  setParam: <K extends keyof DesignParams>(key: K, value: DesignParams[K]) => void
  setPattern: (p: PatternType) => void
  setTheme: (id: string) => void
  randomSeed: () => void
  applyScheme: (scheme: Scheme) => void
  setActiveSchemeId: (id: string | null) => void
  setSvgContent: (s: string) => void
  exportSvg: () => void
  exportPng: () => void
}

export const useDesignStore = create<DesignStore>((set, get) => ({
  pattern: 'spiral',
  seed: 42,
  iterations: 200,
  scale: 1.0,
  rotation: 0,
  strokeWidth: 1.5,
  opacity: 0.8,
  bgColor: '#030712',
  themeId: THEMES[0].id,
  palette: THEMES[0].colors,
  width: 800,
  height: 1000,
  activeSchemeId: null,
  svgContent: '',
  setParam: (key, value) => set({ [key]: value } as any),
  setPattern: (p) => set({ pattern: p }),
  setTheme: (id) => {
    const theme = THEMES.find(t => t.id === id)
    if (theme) set({ themeId: id, palette: theme.colors })
  },
  randomSeed: () => set({ seed: Math.floor(Math.random() * 99999) }),
  applyScheme: (scheme) => {
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
    })
  },
  setActiveSchemeId: (id) => set({ activeSchemeId: id }),
  setSvgContent: (s) => set({ svgContent: s }),
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
}))
