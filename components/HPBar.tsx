'use client'

import { motion } from 'framer-motion'

interface HPBarProps {
  current: number
  max?: number
  name: string
}

export default function HPBar({ current, max = 200, name }: HPBarProps) {
  const pct = Math.max(0, (current / max) * 100)
  const barColor = pct > 50 ? '#2dc653' : pct > 25 ? '#f5c842' : '#e63946'

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs uppercase tracking-widest text-white/60 font-bold">{name}</span>
        <span className="text-sm font-black" style={{ color: barColor }}>{current} HP</span>
      </div>
      <div className="hp-bar-track w-full h-5 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.1)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${barColor}aa, ${barColor})` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
