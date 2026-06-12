'use client'

import { motion } from 'framer-motion'
import type { AICharacter } from '@/lib/aiCharacters'

interface CampaignDefeatedScreenProps {
  opponent: AICharacter
  levelReached: number
  playerNickname: string
  onNewCampaign: () => void
}

export default function CampaignDefeatedScreen({
  opponent,
  levelReached,
  playerNickname,
  onNewCampaign,
}: CampaignDefeatedScreenProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.3, duration: 0.7 }}
        className="text-center"
      >
        <div className="text-7xl mb-4">💀</div>
        <h2
          className="text-4xl font-black uppercase tracking-widest"
          style={{ color: '#e63946', textShadow: '0 0 30px rgba(230,57,70,0.6)' }}
        >
          Defeated
        </h2>
        <p className="text-white/50 text-sm mt-2">
          {playerNickname} fell to {opponent.name}
        </p>
        <p className="text-white/30 text-xs mt-1">Reached level {levelReached} of 8</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm rounded-2xl p-6 text-center"
        style={{
          background: `linear-gradient(145deg, rgba(15,15,35,0.98), rgba(5,5,20,0.99))`,
          border: `2px solid ${opponent.color}40`,
          boxShadow: `0 0 30px ${opponent.color}20`,
        }}
      >
        <div className="text-5xl mb-3">{opponent.emoji}</div>
        <p className="text-xl font-black" style={{ color: opponent.color }}>{opponent.name}</p>
        <p className="text-white/40 text-sm mt-1">{opponent.title}</p>
        <p className="text-white/30 text-xs italic mt-3">&ldquo;{opponent.description}&rdquo;</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <p className="text-white/30 text-xs uppercase tracking-widest mb-4">
          Hard mode — no second chances
        </p>
        <button
          onClick={onNewCampaign}
          className="btn-gold w-full max-w-sm py-4 text-lg"
        >
          ↺ Start New Campaign
        </button>
      </motion.div>
    </div>
  )
}
