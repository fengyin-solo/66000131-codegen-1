import type { PatternType } from '../types'
import {
  createRng,
  generateSpiral, generateFractal, generateWave, generateCircles, generateNoise,
} from './patterns'

export interface RenderConfig {
  width: number
  height: number
  pattern: PatternType
  iterations: number
  scale: number
  palette: string[]
  seed: number
  strokeWidth: number
  opacity: number
  bgColor: string
  rotation: number
}

function buildSvg(cfg: RenderConfig, content: string): string {
  const { width, height, bgColor, rotation } = cfg
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  <g transform="rotate(${rotation},${width / 2},${height / 2})">${content}</g>
</svg>`
}

function generateContent(cfg: RenderConfig): string {
  const rng = createRng(cfg.seed)
  const { pattern, width, height, iterations, scale, palette, strokeWidth, opacity } = cfg
  switch (pattern) {
    case 'spiral':  return generateSpiral(width, height, iterations, scale, palette, rng, strokeWidth, opacity)
    case 'fractal': return generateFractal(width, height, iterations, scale, palette, rng, strokeWidth, opacity)
    case 'wave':    return generateWave(width, height, iterations, scale, palette, rng, strokeWidth, opacity)
    case 'circles': return generateCircles(width, height, iterations, scale, palette, rng, strokeWidth, opacity)
    case 'noise':   return generateNoise(width, height, iterations, scale, palette, rng, strokeWidth, opacity)
    default: return ''
  }
}

/** 按当前参数渲染完整海报 SVG */
export function renderArt(cfg: RenderConfig): string {
  return buildSvg(cfg, generateContent(cfg))
}

/**
 * 渲染方案卡片小预览：小尺寸、缩减迭代数，保证生成结果轻量。
 * 描边按比例缩放，使缩略图与海报观感一致。
 */
export function renderPreview(cfg: RenderConfig): string {
  const PW = 160
  const PH = 200
  const ratio = PW / cfg.width
  const iterations = Math.min(160, cfg.iterations)
  const previewCfg: RenderConfig = {
    ...cfg,
    width: PW,
    height: PH,
    iterations,
    strokeWidth: Math.max(0.3, cfg.strokeWidth * ratio * 1.6),
  }
  return buildSvg(previewCfg, generateContent(previewCfg))
}

export function svgToDataUrl(svg: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}
