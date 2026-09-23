export type PatternType = 'spiral' | 'fractal' | 'wave' | 'circles' | 'voronoi' | 'noise'

export interface DesignParams {
  pattern: PatternType
  seed: number
  iterations: number
  scale: number
  rotation: number
  strokeWidth: number
  opacity: number
  bgColor: string
  palette: string[]
  themeId: string
  width: number
  height: number
}

/** 可收纳进方案的参数（整组保存/套用） */
export interface SchemeParams {
  pattern: PatternType
  themeId: string
  seed: number
  iterations: number
  scale: number
  rotation: number
  strokeWidth: number
  opacity: number
}

export interface Scheme extends SchemeParams {
  id: string
  name: string
  createdAt: number
}

export interface ColorTheme {
  id: string
  name: string
  colors: string[]
}
