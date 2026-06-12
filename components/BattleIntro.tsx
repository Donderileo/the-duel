'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AICharacter } from '@/lib/aiCharacters'
import type { Attributes } from '@/types/game'

export interface GenericOpponent {
  name: string
  attributes: Attributes
  emoji?: string
  color?: string
  title?: string
}

interface BattleIntroProps {
  playerName: string
  playerAttrs: Attributes
  aiCharacter?: AICharacter
  opponent?: GenericOpponent
  onComplete: () => void
}

const DURATION = 10000

const ATTR_ROWS: { key: keyof Attributes; icon: string; label: string }[] = [
  { key: 'precision',  icon: '🎯', label: 'Precision'  },
  { key: 'damage',     icon: '💥', label: 'Damage'     },
  { key: 'reflexes',   icon: '⚡', label: 'Reflexes'   },
  { key: 'resistance', icon: '🛡️', label: 'Resistance' },
]

function AttrTable({
  attrs,
  color,
  align,
  show,
}: {
  attrs: Attributes
  color: string
  align: 'left' | 'right'
  show: boolean
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full flex flex-col gap-1.5 mt-3"
        >
          {ATTR_ROWS.map(({ key, icon, label }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: align === 'left' ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.3 + i * 0.07 }}
              className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : ''}`}
            >
              {/* Bar */}
              <div
                className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(attrs[key] / 8) * 100}%` }}
                  transition={{ duration: 0.55, delay: 0.45 + i * 0.07 }}
                  style={{ background: color }}
                />
              </div>
              {/* Value */}
              <span className="text-xs font-black w-3 text-center" style={{ color }}>
                {attrs[key]}
              </span>
              {/* Label */}
              <span
                className="text-xs text-white/50 w-20 truncate"
                style={{ textAlign: align }}
              >
                {icon} {label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function BattleIntro({ playerName, playerAttrs, aiCharacter, opponent, onComplete }: BattleIntroProps) {
  const opp: GenericOpponent = aiCharacter
    ? { name: aiCharacter.name, attributes: aiCharacter.attributes, emoji: aiCharacter.emoji, color: aiCharacter.color, title: aiCharacter.title }
    : opponent ?? { name: 'Opponent', attributes: { precision: 0, damage: 0, reflexes: 0, resistance: 0 } }
  const oppColor = opp.color ?? '#e63946'
  const oppEmoji = opp.emoji ?? '🤠'
  const [elapsed, setElapsed] = useState(0)
  const [showFighters, setShowFighters] = useState(false)
  const [showVs, setShowVs] = useState(false)
  const [showAttrs, setShowAttrs] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowFighters(true), 300)
    const t2 = setTimeout(() => setShowVs(true), 900)
    const t3 = setTimeout(() => setShowAttrs(true), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  useEffect(() => {
    if (elapsed >= DURATION) { onComplete(); return }
    const t = setTimeout(() => setElapsed(e => e + 100), 100)
    return () => clearTimeout(t)
  }, [elapsed, onComplete])

  const progress = elapsed / DURATION

  const flavorLines = [
    'The gunslingers face each other...',
    'The wind stops. Time does too.',
    'Fingers on holsters. Eyes on the trigger.',
    'Only one walks away.',
    'Let the shooting begin.',
  ]
  const lineIndex = Math.min(Math.floor(progress * flavorLines.length), flavorLines.length - 1)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #080810 0%, #150820 50%, #080810 100%)' }}
    >
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Side glows */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1/2 pointer-events-none"
        animate={{ opacity: showFighters ? 1 : 0 }}
        transition={{ duration: 1 }}
        style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(245,200,66,0.10) 0%, transparent 70%)' }}
      />
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none"
        animate={{ opacity: showFighters ? 1 : 0 }}
        transition={{ duration: 1 }}
        style={{ background: `radial-gradient(ellipse at 80% 50%, ${oppColor}18 0%, transparent 70%)` }}
      />

      {/* Main content */}
      <div className="relative w-full max-w-2xl px-6 flex flex-col items-center gap-4">

        {/* Fighters + attrs row */}
        <div className="flex items-start justify-center w-full gap-2">

          {/* Player side */}
          <AnimatePresence>
            {showFighters && (
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex-1 flex flex-col items-center"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-7xl mb-2"
                  style={{ filter: 'drop-shadow(0 0 18px rgba(245,200,66,0.45))' }}
                >
                  🤠
                </motion.div>
                <p className="text-lg font-black tracking-wide text-white leading-tight">{playerName}</p>
                <p className="text-xs uppercase tracking-widest" style={{ color: '#f5c842' }}>You</p>

                <AttrTable attrs={playerAttrs} color="#f5c842" align="left" show={showAttrs} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* VS column */}
          <div className="flex-shrink-0 w-20 flex flex-col items-center pt-2">
            <AnimatePresence>
              {showVs && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                  className="flex flex-col items-center"
                >
                  <span
                    className="text-5xl font-black leading-none"
                    style={{
                      color: '#e63946',
                      textShadow: '0 0 24px rgba(230,57,70,0.8), 0 0 50px rgba(230,57,70,0.4)',
                    }}
                  >
                    VS
                  </span>
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    className="text-xl mt-1"
                  >
                    🔫
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI side */}
          <AnimatePresence>
            {showFighters && (
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex-1 flex flex-col items-center"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="text-7xl mb-2"
                  style={{ filter: `drop-shadow(0 0 18px ${oppColor}66)` }}
                >
                  {oppEmoji}
                </motion.div>
                <p className="text-lg font-black tracking-wide text-white leading-tight">{opp.name}</p>
                {opp.title && (
                  <p className="text-xs uppercase tracking-widest" style={{ color: oppColor }}>
                    {opp.title}
                  </p>
                )}

                <AttrTable attrs={opp.attributes} color={oppColor} align="right" show={showAttrs} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Flavor text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={lineIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="text-white/40 text-xs uppercase tracking-widest text-center h-4"
          >
            {showVs ? flavorLines[lineIndex] : ''}
          </motion.p>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="w-full max-w-xs flex flex-col items-center gap-2 mt-1">
          <div
            className="w-full h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #f5c842, #e63946)' }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.1, ease: 'linear' }}
            />
          </div>
          <p className="text-white/20 text-xs uppercase tracking-widest">Calculating result...</p>
        </div>
      </div>
    </div>
  )
}
