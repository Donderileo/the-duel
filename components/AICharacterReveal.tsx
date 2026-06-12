'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AICharacter } from '@/lib/aiCharacters'
import { AI_CHARACTERS } from '@/lib/aiCharacters'

interface AICharacterRevealProps {
  character: AICharacter
  onContinue: () => void
  instant?: boolean // skip slot-machine animation (campaign mode)
  onFightNow?: () => void // campaign: go straight to battle (skip planning)
}

export default function AICharacterReveal({ character, onContinue, instant, onFightNow }: AICharacterRevealProps) {
  const [slotStep, setSlotStep] = useState(instant ? 16 : 0)
  const revealed = slotStep >= 16

  useEffect(() => {
    if (instant || slotStep >= 16) return
    const t = setTimeout(
      () => setSlotStep(s => s + 1),
      slotStep < 10 ? 80 : slotStep < 14 ? 160 : 260,
    )
    return () => clearTimeout(t)
  }, [slotStep, instant])

  const displayChar = revealed ? character : AI_CHARACTERS[slotStep % AI_CHARACTERS.length]

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        {instant ? (
          <>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Your next opponent</p>
            <h2 className="text-3xl font-black uppercase tracking-widest" style={{ color: '#e63946' }}>
              Face the Challenge
            </h2>
          </>
        ) : (
          <>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Your opponent is...</p>
            <h2 className="text-3xl font-black uppercase tracking-widest" style={{ color: '#e63946' }}>
              Drawn Opponent
            </h2>
          </>
        )}
      </div>

      <motion.div
        className="w-full max-w-sm rounded-2xl p-8 text-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(15,15,35,0.98), rgba(5,5,20,0.99))',
          border: `2px solid ${revealed ? character.color : '#f5c842'}`,
          boxShadow: revealed
            ? `0 0 40px ${character.color}40, 0 8px 32px rgba(0,0,0,0.6)`
            : '0 8px 32px rgba(0,0,0,0.6)',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${revealed ? character.color : '#f5c842'}18 0%, transparent 70%)`,
            transition: 'background 0.3s',
          }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={displayChar.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.12 }}
            className="relative z-10"
          >
            <div className="text-7xl mb-3">{displayChar.emoji}</div>
            <h3
              className="text-3xl font-black tracking-wide"
              style={{ color: revealed ? character.color : '#f5c842' }}
            >
              {displayChar.name}
            </h3>
            <p className="text-white/50 text-sm mt-1 uppercase tracking-widest">{displayChar.title}</p>
          </motion.div>
        </AnimatePresence>

        {/* Only description after reveal — attributes stay hidden until post-match */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-6 relative z-10"
            >
              <p className="text-white/60 text-sm italic">&ldquo;{character.description}&rdquo;</p>
              <p className="text-white/25 text-xs mt-4 uppercase tracking-widest">
                Attributes revealed after the match
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full max-w-sm flex flex-col gap-2"
          >
            {onFightNow ? (
              <>
                <button onClick={onFightNow} className="btn-gold w-full py-4 text-lg">
                  ⚔️ Fight Now
                </button>
                <button onClick={onContinue} className="btn-ghost w-full py-3 text-sm">
                  📋 Edit Planning
                </button>
              </>
            ) : (
              <button onClick={onContinue} className="btn-gold w-full py-4 text-lg">
                ⚔️ Accept Challenge
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
