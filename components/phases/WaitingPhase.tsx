'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface WaitingPhaseProps {
  roomId: string
  isHost: boolean
  opponentJoined: boolean
  myNickname: string
  opponentNickname?: string
}

export default function WaitingPhase({ roomId, isHost, opponentJoined, myNickname, opponentNickname }: WaitingPhaseProps) {
  const [copied, setCopied] = useState(false)
  const roomUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${roomId}` : ''

  function copyLink() {
    navigator.clipboard.writeText(roomUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div>
        <h2 className="text-3xl font-black text-center uppercase tracking-widest" style={{ color: '#f5c842' }}>
          Waiting Room
        </h2>
        <p className="text-white/40 text-center text-sm mt-1">ID: {roomId}</p>
      </div>

      <div className="flex gap-6 w-full max-w-sm">
        <div className="flex-1 rounded-xl p-4 text-center" style={{ background: 'rgba(45,198,83,0.15)', border: '2px solid rgba(45,198,83,0.4)' }}>
          <div className="text-2xl mb-1">🤠</div>
          <p className="text-xs text-white/50 uppercase tracking-wider">You</p>
          <p className="font-black text-white truncate">{myNickname}</p>
          <span className="text-xs" style={{ color: '#2dc653' }}>● Connected</span>
        </div>

        <div className="flex items-center text-white/30 font-black text-2xl">VS</div>

        <div className="flex-1 rounded-xl p-4 text-center" style={{ background: opponentJoined ? 'rgba(45,198,83,0.15)' : 'rgba(255,255,255,0.05)', border: `2px solid ${opponentJoined ? 'rgba(45,198,83,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
          {opponentJoined ? (
            <>
              <div className="text-2xl mb-1">🤠</div>
              <p className="text-xs text-white/50 uppercase tracking-wider">Opponent</p>
              <p className="font-black text-white truncate">{opponentNickname}</p>
              <span className="text-xs" style={{ color: '#2dc653' }}>● Connected</span>
            </>
          ) : (
            <>
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-2xl mb-1"
              >
                ❓
              </motion.div>
              <p className="text-xs text-white/50 uppercase tracking-wider">Waiting</p>
              <p className="font-black text-white/30">...</p>
              <span className="text-xs text-white/30">Waiting...</span>
            </>
          )}
        </div>
      </div>

      {isHost && !opponentJoined && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <p className="text-white/50 text-xs uppercase tracking-widest text-center mb-3">
            Share this link with your opponent
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={roomUrl}
              readOnly
              className="text-xs text-white/60"
              style={{ background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)' }}
            />
            <button onClick={copyLink} className="btn-gold px-4 py-2 text-sm whitespace-nowrap">
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </motion.div>
      )}

      {opponentJoined && (
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-lg font-black uppercase tracking-widest"
          style={{ color: '#f5c842' }}
        >
          Starting duel...
        </motion.p>
      )}
    </div>
  )
}
