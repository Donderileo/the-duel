'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CAMPAIGN_ORDER, CAMPAIGN_AI_BUDGETS, type CampaignState } from '@/lib/campaign'
import { AI_CHARACTERS } from '@/lib/aiCharacters'

interface CampaignMapProps {
  campaignState: CampaignState
  onFight: () => void
  onReset: () => void
  onChangePlan: () => void
}

export default function CampaignMap({ campaignState, onFight, onReset, onChangePlan }: CampaignMapProps) {
  const { currentLevelIndex, levelsCompleted, playerBonusPoints, playerNickname, campaignComplete } = campaignState
  const totalBudget = 10 + playerBonusPoints
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="text-center">
        <h2 className="text-3xl font-black uppercase tracking-widest" style={{ color: '#f5c842' }}>
          Campaign
        </h2>
        <p className="text-white/40 text-sm mt-1">{playerNickname}</p>
      </div>

      {/* Player stats bar */}
      <div className="w-full max-w-sm lg:max-w-none rounded-xl px-5 py-3 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-center">
          <p className="text-2xl font-black" style={{ color: '#f5c842' }}>{totalBudget}</p>
          <p className="text-white/40 text-xs uppercase tracking-widest">Attr Points</p>
        </div>
        <div className="h-8 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="text-center">
          <p className="text-2xl font-black" style={{ color: '#2dc653' }}>
            {levelsCompleted.filter(Boolean).length}/8
          </p>
          <p className="text-white/40 text-xs uppercase tracking-widest">Defeated</p>
        </div>
        <div className="h-8 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="text-center">
          <p className="text-sm font-black uppercase" style={{ color: '#e63946' }}>
            Hard
          </p>
          <p className="text-white/40 text-xs uppercase tracking-widest">Difficulty</p>
        </div>
      </div>

      {/* Level cards — 1 col on mobile, 2 cols on desktop */}
      <div className="w-full max-w-sm lg:max-w-none grid grid-cols-1 lg:grid-cols-2 gap-2">
        {CAMPAIGN_ORDER.map((id, i) => {
          const char = AI_CHARACTERS.find(c => c.id === id)!
          const completed = levelsCompleted[i]
          const isCurrent = i === currentLevelIndex && !campaignComplete
          const locked = i > currentLevelIndex

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl px-4 py-3 flex items-center gap-4"
              style={{
                background: isCurrent ? `${char.color}12` : completed ? 'rgba(45,198,83,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isCurrent ? `${char.color}50` : completed ? 'rgba(45,198,83,0.25)' : 'rgba(255,255,255,0.06)'}`,
                opacity: locked ? 0.4 : 1,
              }}
            >
              <span className="text-2xl" style={{ filter: locked ? 'grayscale(1)' : undefined }}>
                {char.emoji}
              </span>
              <div className="flex-1">
                <p className="font-black text-sm" style={{ color: completed ? '#2dc653' : isCurrent ? char.color : 'rgba(255,255,255,0.6)' }}>
                  {char.name}
                </p>
                <p className="text-xs text-white/30">{char.title} · {CAMPAIGN_AI_BUDGETS[id]} pts</p>
              </div>
              <div className="text-right">
                {completed && <span className="text-green-400 font-black text-sm">✓</span>}
                {isCurrent && <span className="text-xs font-black uppercase tracking-widest" style={{ color: char.color }}>Next</span>}
                {locked && <span className="text-white/20 text-sm">🔒</span>}
              </div>
            </motion.div>
          )
        })}
      </div>

      {!campaignComplete && (
        <div className="w-full max-w-sm lg:max-w-none flex flex-col gap-2">
          <button onClick={onFight} className="btn-gold w-full py-4 text-lg">
            ⚔️ Fight {AI_CHARACTERS.find(c => c.id === CAMPAIGN_ORDER[currentLevelIndex])?.name}
          </button>
          {campaignState.playerActions && (
            <button
              onClick={onChangePlan}
              className="btn-ghost w-full py-3 text-sm"
            >
              📋 Change Planning
            </button>
          )}
        </div>
      )}

      <div className="w-full max-w-sm lg:max-w-none">
        <AnimatePresence mode="wait">
          {confirmReset ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)' }}
            >
              <p className="text-sm text-white/60 text-center">
                💀 Abandon campaign? All progress will be lost.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="btn-ghost flex-1 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={onReset}
                  className="flex-1 py-2 text-sm font-black rounded-xl uppercase tracking-widest"
                  style={{ background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.4)', color: '#e63946' }}
                >
                  Abandon
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmReset(true)}
              className="w-full py-2 text-xs text-white/25 hover:text-white/45 transition-colors text-center"
            >
              ↺ Abandon Campaign
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
