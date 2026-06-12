'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RoundResult } from '@/types/game'
import type { AICharacter } from '@/lib/aiCharacters'
import { TARGET_LABELS, determineWinner } from '@/lib/gameLogic'
import HPBar from '@/components/HPBar'

const ATTR_LABELS = {
  precision: '🎯 Precision',
  damage: '💥 Damage',
  reflexes: '⚡ Reflexes',
  resistance: '🛡️ Resistance',
} as const

interface ResolutionPhaseProps {
  results: RoundResult[]
  p1Name: string
  p2Name: string
  onPlayAgain: () => void
  playAgainLabel?: string
  aiCharacter?: AICharacter // passed for post-match reveal
}

export default function ResolutionPhase({
  results,
  p1Name,
  p2Name,
  onPlayAgain,
  playAgainLabel,
  aiCharacter,
}: ResolutionPhaseProps) {
  const [visibleRound, setVisibleRound] = useState(0)
  const [hp1, setHp1] = useState(200)
  const [hp2, setHp2] = useState(200)
  const [showAiAttrs, setShowAiAttrs] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)
  const done = visibleRound >= results.length

  useEffect(() => {
    if (done) return
    const timer = setTimeout(() => {
      const r = results[visibleRound]
      setHp1(r.hp1After)
      setHp2(r.hp2After)
      setVisibleRound(v => v + 1)
    }, 3000)
    return () => clearTimeout(timer)
  }, [visibleRound, results, done])

  // Scroll to latest round as it appears
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [visibleRound])

  const { message, winner } = determineWinner(results, p1Name, p2Name)

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="text-center">
        <h2 className="text-3xl font-black uppercase tracking-widest" style={{ color: '#e63946' }}>
          The Duel
        </h2>
      </div>

      {/* Desktop: HP bars + log side-by-side; Mobile: stacked */}
      <div className="w-full flex flex-col lg:flex-row lg:items-start gap-6">

      {/* HP Bars */}
      <div className="w-full max-w-sm mx-auto lg:mx-0 lg:w-56 lg:max-w-none flex flex-col gap-3 lg:flex-shrink-0">
        <HPBar current={hp1} name={p1Name} />
        <HPBar current={hp2} name={p2Name} />
      </div>

      {/* Round log — fixed height, auto-scrolls to latest round */}
      <div className="w-full max-w-sm mx-auto lg:mx-0 lg:max-w-none flex-1 flex flex-col gap-3 max-h-80 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence>
          {results.slice(0, visibleRound).map((r) => (
            <motion.div
              key={r.round}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-xs uppercase tracking-widest font-black mb-2" style={{ color: '#f5c842' }}>
                Round {r.round}
              </p>
              <ShotLine shooterName={p1Name} shot={r.shot1} />
              <ShotLine shooterName={p2Name} shot={r.shot2} />
              <div
                className="mt-2 pt-2 flex justify-between text-xs"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-white/40">
                  {p1Name}: <span className="font-bold text-white">{r.hp1After} HP</span>
                </span>
                <span className="text-white/40">
                  {p2Name}: <span className="font-bold text-white">{r.hp2After} HP</span>
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Invisible sentinel — scrolled into view on each new round */}
        <div ref={logEndRef} />

        {!done && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-center text-white/40 text-sm py-4"
          >
            {visibleRound === 0 ? 'Starting duel...' : `Round ${visibleRound + 1} incoming...`}
          </motion.div>
        )}
      </div>

      </div>{/* end lg:flex-row wrapper */}

      {/* Winner + post-match reveal */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
            className="w-full max-w-sm lg:max-w-none flex flex-col items-center gap-4"
          >
            <div className="text-6xl">{winner ? '🏆' : '🤝'}</div>
            <h3
              className="text-4xl font-black uppercase tracking-widest text-center"
              style={{ color: '#f5c842', textShadow: '0 0 30px rgba(245,200,66,0.6)' }}
            >
              {message}
            </h3>
            <p className="text-white/40 text-sm">
              {p1Name}: {results[results.length - 1].hp1After} HP · {p2Name}:{' '}
              {results[results.length - 1].hp2After} HP
            </p>

            {/* AI attributes reveal — only in solo mode */}
            {aiCharacter && (
              <div className="w-full">
                <button
                  onClick={() => setShowAiAttrs(v => !v)}
                  className="btn-ghost w-full py-3 text-sm mb-2"
                >
                  {showAiAttrs ? '▲ Hide' : '👁 View attributes of'} {aiCharacter.name}
                </button>

                <AnimatePresence>
                  {showAiAttrs && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="rounded-2xl p-5"
                        style={{
                          background: `linear-gradient(145deg, rgba(15,15,35,0.98), rgba(5,5,20,0.99))`,
                          border: `2px solid ${aiCharacter.color}50`,
                          boxShadow: `0 0 24px ${aiCharacter.color}20`,
                        }}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-3xl">{aiCharacter.emoji}</span>
                          <div>
                            <p className="font-black" style={{ color: aiCharacter.color }}>
                              {aiCharacter.name}
                            </p>
                            <p className="text-xs text-white/40">{aiCharacter.title}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(Object.keys(ATTR_LABELS) as (keyof typeof ATTR_LABELS)[]).map(k => (
                            <div
                              key={k}
                              className="rounded-xl p-3"
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.06)',
                              }}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-white/50">{ATTR_LABELS[k]}</span>
                                <span className="text-sm font-black" style={{ color: aiCharacter.color }}>
                                  {aiCharacter.attributes[k]}
                                </span>
                              </div>
                              <div
                                className="w-full h-1 rounded-full"
                                style={{ background: 'rgba(255,255,255,0.08)' }}
                              >
                                <motion.div
                                  className="h-full rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(aiCharacter.attributes[k] / 8) * 100}%` }}
                                  transition={{ duration: 0.6, delay: 0.1 }}
                                  style={{ background: aiCharacter.color }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button onClick={onPlayAgain} className="btn-gold w-full py-4 text-lg">
              {playAgainLabel ?? '🔄 Play Again'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ShotLine({
  shooterName,
  shot,
}: {
  shooterName: string
  shot: import('@/types/game').ShotResult
}) {
  return (
    <p className="text-sm text-white/70 leading-relaxed">
      <span className="font-bold text-white">{shooterName}</span>
      {' shot at '}
      <span style={{ color: '#f5c842' }}>{TARGET_LABELS[shot.target]}</span>
      {' — '}
      {shot.hit ? (
        <>
          <span style={{ color: '#e63946' }} className="font-bold">Hit</span>
          {shot.wasProtected && <span className="text-white/40"> (glancing)</span>}
          {shot.wasPartial && <span className="text-white/40"> (grazed −15%)</span>}
          <span className="font-bold text-white"> -{shot.damage} HP</span>
          {shot.causedArmDebuff && (
            <span style={{ color: '#a78bfa' }}> 🎯−1 aim</span>
          )}
        </>
      ) : (
        <span className="text-white/40">Missed</span>
      )}
    </p>
  )
}
