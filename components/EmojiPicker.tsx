'use client'

import { motion } from 'framer-motion'

const EMOJIS = ['🤠', '💀', '🐺', '🦅', '🌵', '🐴', '⚡', '🃏', '👒', '🌙', '🔥', '🌑']

interface EmojiPickerProps {
  selected: string
  onSelect: (emoji: string) => void
}

export default function EmojiPicker({ selected, onSelect }: EmojiPickerProps) {
  return (
    <div>
      <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">
        Your Avatar
      </label>
      <div className="flex flex-wrap gap-2">
        {EMOJIS.map(e => (
          <motion.button
            key={e}
            type="button"
            onClick={() => onSelect(e)}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all"
            style={{
              background: selected === e ? 'rgba(245,200,66,0.2)' : 'rgba(255,255,255,0.05)',
              border: `2px solid ${selected === e ? 'rgba(245,200,66,0.7)' : 'rgba(255,255,255,0.08)'}`,
              boxShadow: selected === e ? '0 0 10px rgba(245,200,66,0.3)' : 'none',
            }}
          >
            {e}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
