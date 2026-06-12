'use client'

import { useMemo } from 'react'

interface Star {
  w: number
  h: number
  top: number
  left: number
  opacity: number
}

export default function StarBackground({ count = 50 }: { count?: number }) {
  const stars = useMemo<Star[]>(() => {
    // Use a seeded-style approach: fixed values derived from index so SSR matches client
    return Array.from({ length: count }, (_, i) => {
      const seed = (i * 2654435761) >>> 0
      const r1 = (seed & 0xff) / 255
      const r2 = ((seed >> 8) & 0xff) / 255
      const r3 = ((seed >> 16) & 0xff) / 255
      const r4 = ((seed >> 24) & 0xff) / 255
      const r5 = ((seed * 1234567) & 0xff) / 255
      return {
        w: r1 * 2 + 1,
        h: r2 * 2 + 1,
        top: r3 * 100,
        left: r4 * 100,
        opacity: r5 * 0.6 + 0.05,
      }
    })
  }, [count])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: s.w + 'px',
            height: s.h + 'px',
            top: s.top + '%',
            left: s.left + '%',
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  )
}
