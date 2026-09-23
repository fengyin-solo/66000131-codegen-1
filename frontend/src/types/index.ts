export type PatternType = 'spiral' | 'fractal' | 'wave' | 'circles' | 'voronoi' | 'noise'

export interface DesignParams {
  pattern: PatternType
  themeId: string
  seed: number
  iterations: number
  scale: number
  rotation: number
  strokeWidth: number
  opacity: number
  bgColor: string
  palette: string[]
  width: number
  height: number
}

/** 可被方案收纳的一组参数（整组套用 / 比较是否被手动改动） */
export interface SchemeSnapshot {
  pattern: PatternType
  themeId: string
  seed: number
  iterations: number
  scale: number
  rotation: number
  strokeWidth: number
  opacity: number
}

export interface SavedScheme extends SchemeSnapshot {
  id: string
  name: string
  /** 缩略预览：一段内联 SVG 字符串，随方案一起本地保存 */
  preview: string
  createdAt: number
}

export interface ColorTheme {
  id: string
  name: string
  colors: string[]
}
