'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Attributes } from '@/types/game'

interface AttributesPhaseProps {
  onConfirm: (attrs: Attributes) => void
  opponentReady: boolean
  myReady: boolean
  pointBudget?: number
  initialAttrs?: Attributes
}

const ATTR_KEYS: (keyof Attributes)[] = ['precision', 'damage', 'reflexes', 'resistance']
const ATTR_LABELS: Record<keyof Attributes, string> = {
  precision: 'Precision',
  damage: 'Damage',
  reflexes: 'Reflexes',
  resistance: 'Resistance',
}
const ATTR_DESC: Record<keyof Attributes, string> = {
  precision: '↑ hit chance',
  damage: '↑ damage multiplier',
  reflexes: '↓ opponent hit chance',
  resistance: '↓ damage received',
}
const ATTR_ICONS: Record<keyof Attributes, string> = {
  precision: '🎯',
  damage: '💥',
  reflexes: '⚡',
  resistance: '🛡️',
}

export default function AttributesPhase({ onConfirm, opponentReady, myReady, pointBudget, initialAttrs }: AttributesPhaseProps) {
  const MAX_POINTS = pointBudget ?? 10
  const MAX_PER_ATTR = Math.max(8, Math.floor(MAX_POINTS * 0.6))
  const [attrs, setAttrs] = useState<Attributes>(
    initialAttrs ?? { precision: 0, damage: 0, reflexes: 0, resistance: 0 }
  )

  const used = attrs.precision + attrs.damage + attrs.reflexes + attrs.resistance
  const remaining = MAX_POINTS - used

  function change(key: keyof Attributes, delta: number) {
    setAttrs(prev => {
      const next = prev[key] + delta
      if (next < 0 || next > MAX_PER_ATTR) return prev
      if (delta > 0 && remaining <= 0) return prev
      return { ...prev, [key]: next }
    })
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-3xl font-black uppercase tracking-widest" style={{ color: '#f5c842' }}>
          Distribute Attributes
        </h2>
        <p className="text-white/40 text-sm mt-1">Spread points across the 4 attributes</p>
      </div>

      {/* Points remaining */}
      <motion.div
        animate={{ scale: remaining === 0 ? [1, 1.05, 1] : 1 }}
        className="text-center"
      >
        <span className="text-5xl font-black" style={{ color: remaining === 0 ? '#2dc653' : '#f5c842' }}>
          {remaining}
        </span>
        <p className="text-white/50 text-xs uppercase tracking-widest">points remaining</p>
      </motion.div>

      {/* Attributes */}
      <div className="w-full max-w-sm lg:max-w-none grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ATTR_KEYS.map((key, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="mr-2">{ATTR_ICONS[key]}</span>
                <span className="font-black text-white">{ATTR_LABELS[key]}</span>
                <p className="text-white/40 text-xs mt-0.5">{ATTR_DESC[key]}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => change(key, -1)}
                  disabled={myReady || attrs[key] === 0}
                  className="w-8 h-8 rounded-lg font-black text-lg flex items-center justify-center btn-ghost"
                  style={{ fontSize: '1.2rem' }}
                >
                  −
                </button>
                <span className="text-2xl font-black w-6 text-center" style={{ color: '#f5c842' }}>
                  {attrs[key]}
                </span>
                <button
                  onClick={() => change(key, 1)}
                  disabled={myReady || attrs[key] >= MAX_PER_ATTR || remaining <= 0}
                  className="w-8 h-8 rounded-lg font-black text-lg flex items-center justify-center btn-ghost"
                  style={{ fontSize: '1.2rem' }}
                >
                  +
                </button>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full mt-1" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: '#f5c842' }}
                animate={{ width: `${(attrs[key] / MAX_PER_ATTR) * 100}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Status */}
      <div className="flex gap-4 text-xs">
        <span style={{ color: myReady ? '#2dc653' : '#f5c842' }}>
          {myReady ? '✓ You: Ready' : `You: ${used}/${MAX_POINTS} pts`}
        </span>
        <span style={{ color: opponentReady ? '#2dc653' : 'rgba(255,255,255,0.3)' }}>
          {opponentReady ? '✓ Opponent: Ready' : '○ Opponent: choosing...'}
        </span>
      </div>

      {!myReady && (
        <button
          onClick={() => onConfirm(attrs)}
          disabled={used !== MAX_POINTS}
          className="btn-gold w-full max-w-sm lg:max-w-none py-4 text-lg"
        >
          {used === MAX_POINTS ? '🎯 Confirm Attributes' : `Use all ${MAX_POINTS} points (${MAX_POINTS - used} remaining)`}
        </button>
      )}

      {myReady && !opponentReady && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-white/50 text-sm"
        >
          Waiting for opponent...
        </motion.p>
      )}
    </div>
  )
}
