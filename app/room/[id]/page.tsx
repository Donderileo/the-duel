'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import StarBackground from '@/components/StarBackground'
import { simulateGame } from '@/lib/gameLogic'
import type { RoomState, Attributes, ActionBlock, Player } from '@/types/game'
import WaitingPhase from '@/components/phases/WaitingPhase'
import AttributesPhase from '@/components/phases/AttributesPhase'
import ActionsPhase from '@/components/phases/ActionsPhase'
import ResolutionPhase from '@/components/phases/ResolutionPhase'
import JoinRoom from '@/components/JoinRoom'

export default function RoomPage() {
  const params = useParams()
  const roomId = params.id as string

  const [room, setRoom] = useState<RoomState | null>(null)
  const [mySlot, setMySlot] = useState<'player1' | 'player2' | null>(null)
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [needJoin, setNeedJoin] = useState(false)

  const me = room && mySlot ? room[mySlot] : undefined
  const opponent = room && mySlot ? room[mySlot === 'player1' ? 'player2' : 'player1'] : undefined

  // Load room and determine player identity
  const loadRoom = useCallback(async () => {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single()
    if (error || !data) { setNotFound(true); setLoading(false); return }

    const stored = localStorage.getItem(`duel_player_${roomId}`)
    if (stored) {
      const { playerId, slot } = JSON.parse(stored)
      setMyPlayerId(playerId)
      setMySlot(slot)
      setRoom(data as RoomState)
    } else {
      // Not in localStorage — must be new player2
      if (!data.player2) {
        setNeedJoin(true)
      } else {
        setNotFound(true)
      }
    }
    setLoading(false)
  }, [roomId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRoom()
  }, [loadRoom])

  // Subscribe to realtime room changes
  useEffect(() => {
    if (!roomId) return
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        setRoom(payload.new as RoomState)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  // Trigger game simulation when both players have confirmed actions (host only)
  useEffect(() => {
    if (!room || mySlot !== 'player1') return
    if (room.phase !== 'actions') return
    if (!room.player1?.ready || !room.player2?.ready) return
    if (!room.player1.actions || !room.player2.actions) return
    if (room.results) return // already simulated

    const results = simulateGame(room.player1 as Player, room.player2 as Player)
    supabase.from('rooms').update({ results, phase: 'resolution' }).eq('id', roomId).then(() => {})
  }, [room, mySlot, roomId])

  async function handleAttributesConfirm(attrs: Attributes) {
    if (!mySlot || !myPlayerId) return
    const playerUpdate = {
      ...room![mySlot],
      attributes: attrs,
      ready: true,
    }
    const update: Record<string, unknown> = { [mySlot]: playerUpdate }

    // If both ready after this, advance phase
    const otherSlot = mySlot === 'player1' ? 'player2' : 'player1'
    const otherPlayer = room![otherSlot]
    if (otherPlayer?.ready) {
      update.phase = 'actions'
      // Reset ready flags for next phase
      const resetMe = { ...playerUpdate, ready: false }
      const resetOther = { ...otherPlayer, ready: false }
      update[mySlot] = resetMe
      update[otherSlot] = resetOther
    }

    await supabase.from('rooms').update(update).eq('id', roomId)
  }

  async function handleActionsConfirm(actions: ActionBlock[]) {
    if (!mySlot || !myPlayerId) return
    const playerUpdate = { ...room![mySlot], actions, ready: true }
    await supabase.from('rooms').update({ [mySlot]: playerUpdate }).eq('id', roomId)
  }

  async function handlePlayAgain() {
    const resetPlayer = (p: Player | undefined) => p ? {
      ...p, attributes: undefined, actions: undefined, ready: false
    } : undefined

    await supabase.from('rooms').update({
      phase: 'attributes',
      player1: resetPlayer(room?.player1),
      player2: resetPlayer(room?.player2),
      results: null,
    }).eq('id', roomId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a1a' }}>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}>
          <p className="text-white/40 text-lg uppercase tracking-widest">Carregando...</p>
        </motion.div>
      </div>
    )
  }

  if (needJoin) {
    return <JoinRoom roomId={roomId} onJoined={() => { setNeedJoin(false); loadRoom() }} />
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a1a' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">💀</div>
          <p className="text-white text-2xl font-black">Room not found</p>
          <Link href="/" className="btn-gold inline-block px-8 py-3 mt-6 text-sm">← Home</Link>
        </div>
      </div>
    )
  }

  if (!room || !me) return null

  const isHost = mySlot === 'player1'
  const p1Name = room.player1?.nickname ?? 'Player 1'
  const p2Name = room.player2?.nickname ?? 'Player 2'

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)' }}>
      <StarBackground count={40} />

      <div className="card-3d w-full max-w-lg mx-4 p-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-white/30 text-xs hover:text-white/60 transition-colors">← Home</Link>
          <div className="flex items-center gap-2">
            <PhaseIndicator phase={room.phase} />
          </div>
          <span className="text-white/30 text-xs">ID: {roomId}</span>
        </div>

        {/* Phase content */}
        {room.phase === 'waiting' && (
          <WaitingPhase
            roomId={roomId}
            isHost={isHost}
            opponentJoined={!!room.player2}
            myNickname={me.nickname}
            opponentNickname={opponent?.nickname}
          />
        )}

        {room.phase === 'attributes' && (
          <AttributesPhase
            onConfirm={handleAttributesConfirm}
            myReady={!!me.ready}
            opponentReady={!!opponent?.ready}
          />
        )}

        {room.phase === 'actions' && (
          <ActionsPhase
            onConfirm={handleActionsConfirm}
            myReady={!!me.ready}
            opponentReady={!!opponent?.ready}
          />
        )}

        {(room.phase === 'resolution' || room.phase === 'finished') && room.results && (
          <ResolutionPhase
            results={room.results}
            p1Name={p1Name}
            p2Name={p2Name}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </div>
    </div>
  )
}

function PhaseIndicator({ phase }: { phase: string }) {
  const phases = [
    { key: 'waiting', label: 'Room' },
    { key: 'attributes', label: 'Attributes' },
    { key: 'actions', label: 'Planning' },
    { key: 'resolution', label: 'Duel' },
  ]
  const idx = phases.findIndex(p => p.key === phase)

  return (
    <div className="flex gap-1 items-center">
      {phases.map((p, i) => (
        <div key={p.key} className="flex items-center gap-1">
          <div className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{
              background: i === idx ? 'rgba(245,200,66,0.2)' : 'transparent',
              color: i === idx ? '#f5c842' : i < idx ? '#2dc653' : 'rgba(255,255,255,0.2)',
              border: `1px solid ${i === idx ? 'rgba(245,200,66,0.5)' : i < idx ? 'rgba(45,198,83,0.3)' : 'rgba(255,255,255,0.1)'}`,
            }}>
            {i < idx ? '✓' : p.label}
          </div>
          {i < phases.length - 1 && <div className="w-3 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />}
        </div>
      ))}
    </div>
  )
}
