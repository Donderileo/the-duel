'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import StarBackground from '@/components/StarBackground'
import { pickRandomCharacter, generateAIActions, type AICharacter } from '@/lib/aiCharacters'
import { simulateGame } from '@/lib/gameLogic'
import type { Attributes, ActionBlock, Player, RoundResult } from '@/types/game'
import AICharacterReveal from '@/components/AICharacterReveal'
import BattleIntro from '@/components/BattleIntro'
import AttributesPhase from '@/components/phases/AttributesPhase'
import ActionsPhase from '@/components/phases/ActionsPhase'
import ResolutionPhase from '@/components/phases/ResolutionPhase'

type SoloPhase = 'setup' | 'reveal' | 'attributes' | 'actions' | 'intro' | 'resolution'

const SOLO_PHASES: { key: SoloPhase; label: string }[] = [
  { key: 'setup', label: 'Início' },
  { key: 'reveal', label: 'Reveal' },
  { key: 'attributes', label: 'Atributos' },
  { key: 'actions', label: 'Ações' },
  { key: 'intro', label: 'VS' },
  { key: 'resolution', label: 'Duelo' },
]

function SoloPhaseIndicator({ phase }: { phase: SoloPhase }) {
  const idx = SOLO_PHASES.findIndex(p => p.key === phase)
  return (
    <div className="flex gap-1 items-center">
      {SOLO_PHASES.map((p, i) => (
        <div key={p.key} className="flex items-center gap-1">
          <div
            className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{
              background: i === idx ? 'rgba(245,200,66,0.2)' : 'transparent',
              color: i === idx ? '#f5c842' : i < idx ? '#2dc653' : 'rgba(255,255,255,0.2)',
              border: `1px solid ${i === idx ? 'rgba(245,200,66,0.5)' : i < idx ? 'rgba(45,198,83,0.3)' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {i < idx ? '✓' : p.label}
          </div>
          {i < SOLO_PHASES.length - 1 && (
            <div className="w-2 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

function SoloGame() {
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<SoloPhase>('setup')
  const [nickname, setNickname] = useState(searchParams.get('nick') ?? '')
  const [aiCharacter, setAiCharacter] = useState<AICharacter | null>(null)
  const [playerAttrs, setPlayerAttrs] = useState<Attributes | null>(null)
  const [results, setResults] = useState<RoundResult[] | null>(null)
  const hasInit = useRef(false)

  useEffect(() => {
    if (!hasInit.current) {
      hasInit.current = true
      setAiCharacter(pickRandomCharacter())
    }
  }, [])

  function startGame() {
    if (!nickname.trim()) return
    setPhase('reveal')
  }

  function handleRevealContinue() {
    setPhase('attributes')
  }

  function handleAttributesConfirm(attrs: Attributes) {
    setPlayerAttrs(attrs)
    setPhase('actions')
  }

  function handleActionsConfirm(actions: ActionBlock[]) {
    if (!aiCharacter || !playerAttrs) return

    const aiActions = generateAIActions(aiCharacter)

    const humanPlayer: Player = {
      id: 'human',
      nickname: nickname.trim(),
      isHost: true,
      attributes: playerAttrs,
      actions,
      ready: true,
    }
    const aiPlayer: Player = {
      id: 'ai',
      nickname: aiCharacter.name,
      isHost: false,
      attributes: aiCharacter.attributes,
      actions: aiActions,
      ready: true,
    }

    setResults(simulateGame(humanPlayer, aiPlayer))
    setPhase('intro')
  }

  function handlePlayAgain() {
    setAiCharacter(pickRandomCharacter())
    setPlayerAttrs(null)
    setResults(null)
    setPhase('setup')
  }

  if (!aiCharacter) return null

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)' }}
    >
      {/* Battle intro overlay — rendered outside card, full-screen */}
      <AnimatePresence>
        {phase === 'intro' && (
          <BattleIntro
            playerName={nickname.trim()}
            playerAttrs={playerAttrs!}
            aiCharacter={aiCharacter}
            onComplete={() => setPhase('resolution')}
          />
        )}
      </AnimatePresence>

      <StarBackground count={50} />

      <div className="card-3d w-full max-w-lg mx-4 p-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-white/30 text-xs hover:text-white/60 transition-colors">
            ← Início
          </Link>
          <SoloPhaseIndicator phase={phase} />
          <div className="w-12" />
        </div>

        <AnimatePresence mode="wait">
          {phase === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="text-center">
                <div className="text-5xl mb-4">🤖</div>
                <h2
                  className="text-3xl font-black uppercase tracking-widest"
                  style={{ color: '#f5c842' }}
                >
                  vs Computador
                </h2>
                <p className="text-white/40 text-sm mt-2">Um oponente aleatório aguarda você</p>
              </div>

              <div
                className="w-full max-w-sm rounded-2xl p-6 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.12)' }}
              >
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl mb-2"
                >
                  ❓
                </motion.div>
                <p className="text-white/40 text-sm">Oponente desconhecido</p>
                <p className="text-white/25 text-xs mt-1">Será revelado em breve...</p>
              </div>

              <div className="w-full max-w-sm">
                <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">
                  Seu Apelido
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && startGame()}
                  placeholder="Ex: Pistoleiro123"
                  maxLength={20}
                  className="text-lg font-bold mb-4"
                />
                <button
                  onClick={startGame}
                  disabled={!nickname.trim()}
                  className="btn-gold w-full py-4 text-lg"
                >
                  🎲 Sortear Oponente
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'reveal' && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <AICharacterReveal character={aiCharacter} onContinue={handleRevealContinue} />
            </motion.div>
          )}

          {phase === 'attributes' && (
            <motion.div
              key="attributes"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <AttributesPhase
                onConfirm={handleAttributesConfirm}
                myReady={false}
                opponentReady={true}
              />
            </motion.div>
          )}

          {phase === 'actions' && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <ActionsPhase
                onConfirm={handleActionsConfirm}
                myReady={false}
                opponentReady={true}
              />
            </motion.div>
          )}

          {phase === 'resolution' && results && (
            <motion.div
              key="resolution"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ResolutionPhase
                results={results}
                p1Name={nickname.trim()}
                p2Name={aiCharacter.name}
                onPlayAgain={handlePlayAgain}
                aiCharacter={aiCharacter}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI character badge — visible during gameplay phases */}
      {(phase === 'attributes' || phase === 'actions') && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-6 right-6 rounded-2xl p-3 flex items-center gap-3"
          style={{
            background: 'rgba(10,10,26,0.9)',
            border: `1px solid ${aiCharacter.color}40`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <span className="text-2xl">{aiCharacter.emoji}</span>
          <div>
            <p className="text-xs font-black" style={{ color: aiCharacter.color }}>
              {aiCharacter.name}
            </p>
            <p className="text-xs text-white/40">Oponente</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default function SoloPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a1a' }}>
        <p className="text-white/40 uppercase tracking-widest text-sm">Carregando...</p>
      </div>
    }>
      <SoloGame />
    </Suspense>
  )
}
