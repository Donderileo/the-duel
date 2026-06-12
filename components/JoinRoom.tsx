'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import EmojiPicker from '@/components/EmojiPicker'

interface JoinRoomProps {
  roomId: string
  onJoined: () => void
}

export default function JoinRoom({ roomId, onJoined }: JoinRoomProps) {
  const [nickname, setNickname] = useState('')
  const [playerEmoji, setPlayerEmoji] = useState('🤠')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function join() {
    if (!nickname.trim()) { setError('Enter your nickname!'); return }
    setLoading(true)
    setError('')
    const playerId = uuidv4()

    const player2 = {
      id: playerId,
      nickname: nickname.trim(),
      emoji: playerEmoji,
      isHost: false,
      ready: false,
    }

    const { error: dbError } = await supabase
      .from('rooms')
      .update({ player2, phase: 'attributes' })
      .eq('id', roomId)
      .is('player2', null)

    if (dbError) {
      setError('Could not join the room. Room is full or invalid.')
      setLoading(false)
      return
    }

    localStorage.setItem(`duel_player_${roomId}`, JSON.stringify({ playerId, slot: 'player2' }))
    onJoined()
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-3d w-full max-w-md mx-4 p-10"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚔️</div>
          <h1 className="text-3xl font-black uppercase tracking-widest" style={{ color: '#f5c842' }}>
            Join Room
          </h1>
          <p className="text-white/40 text-sm mt-2">ID: {roomId}</p>
        </div>

        <div className="mb-6 flex flex-col gap-4">
          <EmojiPicker selected={playerEmoji} onSelect={setPlayerEmoji} />
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">Your Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && join()}
              placeholder="e.g. Outlaw99"
              maxLength={20}
              className="text-lg font-bold"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

        <button onClick={join} disabled={loading} className="btn-gold w-full py-4 text-lg">
          {loading ? 'Joining...' : '🔫 Enter the Duel'}
        </button>
      </motion.div>
    </div>
  )
}
