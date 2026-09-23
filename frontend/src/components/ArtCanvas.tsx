import { useEffect, useRef } from 'react'
import { useDesignStore } from '../store/design'
import { buildSvg } from '../render/svg'

export default function ArtCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const store = useDesignStore()

  useEffect(() => {
    const svg = buildSvg({
      width: store.width,
      height: store.height,
      pattern: store.pattern,
      seed: store.seed,
      iterations: store.iterations,
      scale: store.scale,
      rotation: store.rotation,
      strokeWidth: store.strokeWidth,
      opacity: store.opacity,
      palette: store.palette,
      bgColor: store.bgColor,
    })
    store.setSvgContent(svg)
    if (containerRef.current) {
      containerRef.current.innerHTML = svg
    }
  }, [store.pattern, store.themeId, store.seed, store.iterations, store.scale, store.rotation,
      store.strokeWidth, store.opacity, store.bgColor, store.palette, store.width, store.height])

  return (
    <div
      ref={containerRef}
      className="shadow-2xl rounded border border-gray-700"
      style={{ maxWidth: '100%', maxHeight: '100%', overflow: 'hidden' }}
    />
  )
}
