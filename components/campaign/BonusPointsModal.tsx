'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Attributes } from '@/types/game'

const ATTR_KEYS: (keyof Attributes)[] = ['precision', 'damage', 'reflexes', 'resistance']
const ATTR_ICONS: Record<keyof Attributes, string> = {
  precision: '🎯',
  damage: '💥',
  reflexes: '⚡',
  resistance: '🛡️',
}
const ATTR_LABELS: Record<keyof Attributes, string> = {
  precision: 'Precision',
  damage: 'Damage',
  reflexes: 'Reflexes',
  resistance: 'Resistance',
}

interface BonusPointsModalProps {
  currentAttrs: Attributes
  bonusPoints: number
  onConfirm: (newAttrs: Attributes) => void
}

export default function BonusPointsModal({ currentAttrs, bonusPoints, onConfirm }: BonusPointsModalProps) {
  const [attrs, setAttrs] = useState<Attributes>({ ...currentAttrs })
  const spent = ATTR_KEYS.reduce((s, k) => s + (attrs[k] - currentAttrs[k]), 0)
  const remaining = bonusPoints - spent

  const MAX_PER_ATTR = 12

  function change(key: keyof Attributes, delta: number) {
    setAttrs(prev => {
      const next = prev[key] + delta
      if (delta > 0 && (remaining <= 0 || next > MAX_PER_ATTR)) return prev
      if (delta < 0 && next < currentAttrs[key]) return prev
      return { ...prev, [key]: next }
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center gap-6 w-full"
    >
      <div className="text-center">
        <div className="text-4xl mb-2">🏆</div>
        <h2 className="text-2xl font-black uppercase tracking-widest" style={{ color: '#2dc653' }}>
          Victory!
        </h2>
        <p className="text-white/50 text-sm mt-1">Distribute your bonus points</p>
      </div>

      <motion.div
        animate={{ scale: remaining === 0 ? [1, 1.05, 1] : 1 }}
        className="text-center"
      >
        <span className="text-5xl font-black" style={{ color: remaining === 0 ? '#2dc653' : '#f5c842' }}>
          {remaining}
        </span>
        <p className="text-white/50 text-xs uppercase tracking-widest">bonus points left</p>
      </motion.div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        {ATTR_KEYS.map(key => {
          const added = attrs[key] - currentAttrs[key]
          return (
            <div
              key={key}
              className="rounded-xl p-4"
              style={{
                background: added > 0 ? 'rgba(45,198,83,0.07)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${added > 0 ? 'rgba(45,198,83,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{ATTR_ICONS[key]}</span>
                  <span className="font-black text-white">{ATTR_LABELS[key]}</span>
                  {added > 0 && (
                    <span className="text-xs font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(45,198,83,0.2)', color: '#2dc653' }}>
                      +{added}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => change(key, -1)}
                    disabled={attrs[key] <= currentAttrs[key]}
                    className="w-8 h-8 rounded-lg font-black text-lg flex items-center justify-center btn-ghost"
                  >
                    −
                  </button>
                  <span className="text-2xl font-black w-6 text-center" style={{ color: '#f5c842' }}>
                    {attrs[key]}
                  </span>
                  <button
                    onClick={() => change(key, 1)}
                    disabled={remaining <= 0 || attrs[key] >= MAX_PER_ATTR}
                    className="w-8 h-8 rounded-lg font-black text-lg flex items-center justify-center btn-ghost"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full mt-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: added > 0 ? '#2dc653' : '#f5c842' }}
                  animate={{ width: `${(attrs[key] / MAX_PER_ATTR) * 100}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => onConfirm(attrs)}
        disabled={remaining > 0}
        className="btn-gold w-full max-w-sm py-4 text-lg"
      >
        {remaining > 0 ? `Assign ${remaining} more point${remaining > 1 ? 's' : ''}` : '⚔️ Continue Campaign'}
      </button>
    </motion.div>
  )
}
