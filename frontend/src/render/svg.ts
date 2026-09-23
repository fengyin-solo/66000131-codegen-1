import type { PatternType } from '../types'
import {
  createRng,
  generateSpiral,
  generateFractal,
  generateWave,
  generateCircles,
  generateNoise,
} from '../generators/patterns'

export interface SvgSpec {
  width: number
  height: number
  pattern: PatternType
  seed: number
  iterations: number
  scale: number
  rotation: number
  strokeWidth: number
  opacity: number
  palette: string[]
  bgColor: string
}

/** 依据一组参数生成海报主体路径（与图案类型一一对应） */
export function renderPatternContent(spec: SvgSpec): string {
  const rng = createRng(spec.seed)
  const { width, height, pattern, iterations, scale, palette, strokeWidth, opacity } = spec
  switch (pattern) {
    case 'spiral':
      return generateSpiral(width, height, iterations, scale, palette, rng, strokeWidth, opacity)
    case 'fractal':
      return generateFractal(width, height, iterations, scale, palette, rng, strokeWidth, opacity)
    case 'wave':
      return generateWave(width, height, iterations, scale, palette, rng, strokeWidth, opacity)
    case 'circles':
      return generateCircles(width, height, iterations, scale, palette, rng, strokeWidth, opacity)
    case 'noise':
      return generateNoise(width, height, iterations, scale, palette, rng, strokeWidth, opacity)
    default:
      return ''
  }
}

/** 拼成完整 SVG 文档（主画布：带物理尺寸） */
export function buildSvg(spec: SvgSpec): string {
  const { width, height, rotation, bgColor } = spec
  const content = renderPatternContent(spec)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  <g transform="rotate(${rotation},${width / 2},${height / 2})">${content}</g>
</svg>`
}

const PREVIEW_W = 120
const PREVIEW_H = 150
const PREVIEW_ITER_CAP = 120

/**
 * 为方案卡片生成小预览（内联 SVG 字符串）。
 * 缩小画布与迭代数，使缩略图既轻量又能代表整组参数的观感。
 */
export function buildSchemePreview(spec: SvgSpec): string {
  const previewSpec: SvgSpec = {
    ...spec,
    width: PREVIEW_W,
    height: PREVIEW_H,
    iterations: Math.min(spec.iterations, PREVIEW_ITER_CAP),
    strokeWidth: Math.max(0.4, spec.strokeWidth * 0.6),
  }
  return buildSvg(previewSpec)
}
