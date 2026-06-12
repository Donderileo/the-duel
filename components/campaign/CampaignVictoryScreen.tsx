'use client'

import { motion } from 'framer-motion'
import { CAMPAIGN_ORDER } from '@/lib/campaign'
import { AI_CHARACTERS } from '@/lib/aiCharacters'

interface CampaignVictoryScreenProps {
  playerNickname: string
  totalBudget: number
  onNewCampaign: () => void
}

export default function CampaignVictoryScreen({ playerNickname, totalBudget, onNewCampaign }: CampaignVictoryScreenProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
        className="text-center"
      >
        <div className="text-7xl mb-4">🏆</div>
        <h2
          className="text-4xl font-black uppercase tracking-widest"
          style={{ color: '#f5c842', textShadow: '0 0 40px rgba(245,200,66,0.7)' }}
        >
          Campaign Complete!
        </h2>
        <p className="text-white/50 text-sm mt-2">
          {playerNickname} defeated all 8 gunslingers
        </p>
        <p className="text-white/30 text-xs mt-1">Final build: {totalBudget} attribute points</p>
      </motion.div>

      <div className="w-full max-w-sm flex flex-col gap-2">
        {CAMPAIGN_ORDER.map((id, i) => {
          const char = AI_CHARACTERS.find(c => c.id === id)!
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'rgba(45,198,83,0.07)', border: '1px solid rgba(45,198,83,0.2)' }}
            >
              <span className="text-xl">{char.emoji}</span>
              <div className="flex-1">
                <p className="font-black text-sm text-white">{char.name}</p>
                <p className="text-xs text-white/30">{char.title}</p>
              </div>
              <span className="text-green-400 font-black">✓</span>
            </motion.div>
          )
        })}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        onClick={onNewCampaign}
        className="btn-gold w-full max-w-sm py-4 text-lg"
      >
        🔄 New Campaign
      </motion.button>
    </div>
  )
}
