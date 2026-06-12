'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import StarBackground from '@/components/StarBackground'

export default function Home() {
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function createRoom() {
    if (!nickname.trim()) {
      setError('Enter your nickname first!')
      return
    }
    setLoading(true)
    setError('')
    const roomId = uuidv4().slice(0, 8)
    const playerId = uuidv4()

    const player1 = {
      id: playerId,
      nickname: nickname.trim(),
      isHost: true,
      ready: false,
    }

    const { error: dbError } = await supabase.from('rooms').insert({
      id: roomId,
      phase: 'waiting',
      player1,
      player2: null,
      results: null,
    })

    if (dbError) {
      setError('Could not create room. Check your Supabase configuration.')
      setLoading(false)
      return
    }

    localStorage.setItem(`duel_player_${roomId}`, JSON.stringify({ playerId, slot: 'player1' }))
    router.push(`/room/${roomId}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)' }}>
      <StarBackground count={60} />

      {/* Moon */}
      <div className="absolute top-16 right-20 w-24 h-24 rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 35% 35%, #ffe8a0, #f5c842)' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="card-3d w-full max-w-md sm:max-w-lg mx-4 p-8 sm:p-10 relative z-10"
      >
        {/* Title */}
        <div className="text-center mb-10">
          <motion.div
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl mb-4"
          >
            🔫
          </motion.div>
          <h1 className="text-5xl font-black tracking-widest uppercase" style={{ color: '#f5c842', textShadow: '0 0 30px rgba(245,200,66,0.5), 0 4px 8px rgba(0,0,0,0.8)' }}>
            PISTOL
          </h1>
          <h1 className="text-5xl font-black tracking-widest uppercase" style={{ color: '#e63946', textShadow: '0 0 30px rgba(230,57,70,0.5), 0 4px 8px rgba(0,0,0,0.8)' }}>
            DUEL
          </h1>
          <p className="text-white/40 text-sm mt-3 tracking-widest uppercase">Multiplayer · Turn-based</p>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">Your Nickname</label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createRoom()}
            placeholder="e.g. Gunslinger123"
            maxLength={20}
            className="text-lg font-bold"
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm text-center mb-4"
          >
            {error}
          </motion.p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={createRoom}
            disabled={loading}
            className="btn-gold w-full py-4 text-lg"
          >
            {loading ? 'Creating...' : '⚔️ Create Room'}
          </button>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-white/25 text-xs uppercase tracking-widest">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <Link
            href={nickname.trim() ? `/solo?nick=${encodeURIComponent(nickname.trim())}` : '#'}
            onClick={e => { if (!nickname.trim()) { e.preventDefault(); setError('Enter your nickname first!') } }}
            className="btn-ghost w-full py-4 text-lg text-center block"
          >
            🤖 Play vs Computer
          </Link>

          <Link href="/campaign" className="btn-ghost w-full py-4 text-lg text-center block">
            🏆 Campaign
          </Link>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Create a room and share the link with your opponent
        </p>
      </motion.div>
    </div>
  )
}
