'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import StarBackground from '@/components/StarBackground'
import {
  getCampaignState,
  saveCampaignState,
  clearCampaignState,
  createFreshCampaignState,
  getCampaignCharacter,
  scaleCharacterAttributes,
  CAMPAIGN_ORDER,
  CAMPAIGN_AI_BUDGETS,
  type CampaignState,
} from '@/lib/campaign'
import { generateAIActions } from '@/lib/aiCharacters'
import { simulateGame, determineWinner } from '@/lib/gameLogic'
import type { Attributes, ActionBlock, Player, RoundResult } from '@/types/game'
import AICharacterReveal from '@/components/AICharacterReveal'
import BattleIntro from '@/components/BattleIntro'
import AttributesPhase from '@/components/phases/AttributesPhase'
import ActionsPhase from '@/components/phases/ActionsPhase'
import ResolutionPhase from '@/components/phases/ResolutionPhase'
import CampaignMap from '@/components/campaign/CampaignMap'
import BonusPointsModal from '@/components/campaign/BonusPointsModal'
import CampaignVictoryScreen from '@/components/campaign/CampaignVictoryScreen'
import CampaignDefeatedScreen from '@/components/campaign/CampaignDefeatedScreen'

type CampaignPhase =
  | 'loading'
  | 'setup'
  | 'map'
  | 'reveal'
  | 'attributes'   // only on first fight (no saved attrs yet)
  | 'actions'      // only on first fight or "Change Plan"
  | 'intro'
  | 'resolution'
  | 'bonus'        // after each win: distribute 2 new pts
  | 'victory'
  | 'defeated'

const PHASE_LABELS: { key: CampaignPhase; label: string }[] = [
  { key: 'reveal',     label: 'Reveal'     },
  { key: 'attributes', label: 'Attributes' },
  { key: 'actions',    label: 'Planning'   },
  { key: 'intro',      label: 'VS'         },
  { key: 'resolution', label: 'Duel'       },
]

function CampaignPhaseIndicator({ phase, levelIndex }: { phase: CampaignPhase; levelIndex: number }) {
  const idx = PHASE_LABELS.findIndex(p => p.key === phase)
  if (idx < 0) return null
  return (
    <div className="flex gap-1 items-center">
      {PHASE_LABELS.map((p, i) => (
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
          {i < PHASE_LABELS.length - 1 && (
            <div className="w-2 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          )}
        </div>
      ))}
      <div className="ml-2 text-xs text-white/30 font-bold">Lv.{levelIndex + 1}</div>
    </div>
  )
}

export default function CampaignPage() {
  const [phase, setPhase] = useState<CampaignPhase>('loading')
  const [campaignState, setCampaignState] = useState<CampaignState | null>(null)
  const [nickname, setNickname] = useState('')
  const [playerAttrs, setPlayerAttrs] = useState<Attributes | null>(null)
  const [results, setResults] = useState<RoundResult[] | null>(null)
  const [planningFromMap, setPlanningFromMap] = useState(false)
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (hasLoaded.current) return
    hasLoaded.current = true
    getCampaignState().then(saved => {
      if (saved) {
        setCampaignState(saved)
        setPlayerAttrs(saved.playerAttrs)
        setPhase(saved.campaignComplete ? 'victory' : 'map')
      } else {
        setPhase('setup')
      }
    })
  }, [])

  function handleStartCampaign() {
    if (!nickname.trim()) return
    const state = createFreshCampaignState(nickname.trim())
    saveCampaignState(state).then(() => {
      setCampaignState(state)
      setPlayerAttrs(null)
      setPhase('map')
    })
  }

  function handleFight() { setPhase('reveal') }

  function handleRevealContinue() {
    // First fight: need to set attributes. Subsequent: skip to actions or straight to fight
    if (!campaignState) return
    const hasAttrs = campaignState.playerBonusPoints > 0 ||
      (campaignState.playerAttrs.precision + campaignState.playerAttrs.damage +
       campaignState.playerAttrs.reflexes + campaignState.playerAttrs.resistance) > 0
    setPhase(hasAttrs ? 'actions' : 'attributes')
  }

  function handleAttributesConfirm(attrs: Attributes) {
    setPlayerAttrs(attrs)
    setPhase('actions')
  }

  function runSimulation(attrs: Attributes, actions: ActionBlock[]) {
    if (!campaignState) return
    const levelIndex = campaignState.currentLevelIndex
    const char = getCampaignCharacter(levelIndex)
    const scaledAttrs = scaleCharacterAttributes(char, CAMPAIGN_AI_BUDGETS[char.id])
    const aiActions = generateAIActions({ ...char, attributes: scaledAttrs })

    const humanPlayer: Player = {
      id: 'human',
      nickname: campaignState.playerNickname,
      isHost: true,
      attributes: attrs,
      actions,
      ready: true,
    }
    const aiPlayer: Player = {
      id: 'ai',
      nickname: char.name,
      isHost: false,
      attributes: scaledAttrs,
      actions: aiActions,
      ready: true,
    }

    setResults(simulateGame(humanPlayer, aiPlayer))
    setPhase('intro')
  }

  async function handleActionsConfirm(actions: ActionBlock[]) {
    if (!campaignState) return
    const newState = { ...campaignState, playerActions: actions }
    await saveCampaignState(newState)
    setCampaignState(newState)

    if (planningFromMap) {
      setPlanningFromMap(false)
      setPhase('map')
    } else {
      if (!playerAttrs) return
      runSimulation(playerAttrs, actions)
    }
  }

  async function handleResolutionDone() {
    if (!campaignState || !results || !playerAttrs) return
    const levelIndex = campaignState.currentLevelIndex
    const char = getCampaignCharacter(levelIndex)
    const { winner } = determineWinner(results, campaignState.playerNickname, char.name)
    const playerWon = winner === campaignState.playerNickname

    if (playerWon) {
      const newBonusPoints = campaignState.playerBonusPoints + 2
      const newLevelsCompleted = [...campaignState.levelsCompleted]
      newLevelsCompleted[levelIndex] = true
      const newLevelIndex = levelIndex + 1
      const campaignComplete = newLevelIndex >= CAMPAIGN_ORDER.length

      const newState: CampaignState = {
        ...campaignState,
        currentLevelIndex: campaignComplete ? levelIndex : newLevelIndex,
        playerBonusPoints: newBonusPoints,
        playerAttrs,
        levelsCompleted: newLevelsCompleted,
        campaignComplete,
      }
      await saveCampaignState(newState)
      setCampaignState(newState)
      setPhase(campaignComplete ? 'victory' : 'bonus')
    } else {
      // Loss: campaign over
      setPhase('defeated')
    }
  }

  async function handleBonusConfirm(newAttrs: Attributes) {
    if (!campaignState) return
    const newState = { ...campaignState, playerAttrs: newAttrs }
    await saveCampaignState(newState)
    setCampaignState(newState)
    setPlayerAttrs(newAttrs)
    setPhase('map')
  }

  function handleChangePlan() {
    setPlanningFromMap(true)
    setPhase('actions')
  }

  async function handleReset() {
    clearCampaignState()
    setCampaignState(null)
    setPlayerAttrs(null)
    setResults(null)
    setNickname('')
    setPhase('setup')
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a1a' }}>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}>
          <p className="text-white/40 text-lg uppercase tracking-widest">Loading...</p>
        </motion.div>
      </div>
    )
  }

  const currentChar = campaignState ? getCampaignCharacter(campaignState.currentLevelIndex) : null
  const currentBudget = campaignState ? 10 + campaignState.playerBonusPoints : 10
  const showPhaseIndicator = ['reveal', 'attributes', 'actions', 'intro', 'resolution'].includes(phase)
  const showAiBadge = ['attributes', 'actions'].includes(phase) && currentChar

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)' }}
    >
      <AnimatePresence>
        {phase === 'intro' && campaignState && playerAttrs && currentChar && (
          <BattleIntro
            playerName={campaignState.playerNickname}
            playerAttrs={playerAttrs}
            aiCharacter={{ ...currentChar, attributes: scaleCharacterAttributes(currentChar, CAMPAIGN_AI_BUDGETS[currentChar.id]) }}
            onComplete={() => setPhase('resolution')}
          />
        )}
      </AnimatePresence>

      <StarBackground count={50} />

      <div className="card-3d w-full max-w-lg sm:max-w-xl mx-4 p-6 sm:p-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-white/30 text-xs hover:text-white/60 transition-colors">← Home</Link>
          {showPhaseIndicator && campaignState ? (
            <CampaignPhaseIndicator phase={phase} levelIndex={campaignState.currentLevelIndex} />
          ) : (
            <span className="text-white/30 text-xs uppercase tracking-widest font-bold">Campaign</span>
          )}
          <div className="w-12" />
        </div>

        <AnimatePresence mode="wait">
          {/* SETUP */}
          {phase === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-8">
              <div className="text-center">
                <div className="text-5xl mb-4">🏆</div>
                <h2 className="text-3xl font-black uppercase tracking-widest" style={{ color: '#f5c842' }}>Campaign</h2>
                <p className="text-white/40 text-sm mt-2">Defeat all 8 gunslingers to win</p>
              </div>
              <div
                className="w-full max-w-sm rounded-xl p-4 text-sm text-white/40"
                style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.2)' }}
              >
                💀 <strong className="text-white/60">Hard rules:</strong> lose once and the campaign ends.
                Win each fight to earn +2 attribute points for the next opponent.
              </div>
              <div className="w-full max-w-sm flex flex-col gap-4">
                <div>
                  <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">Your Nickname</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleStartCampaign()}
                    placeholder="e.g. Gunslinger123"
                    maxLength={20}
                    className="text-lg font-bold"
                  />
                </div>
                <button onClick={handleStartCampaign} disabled={!nickname.trim()} className="btn-gold w-full py-4 text-lg">
                  ⚔️ Begin Campaign
                </button>
              </div>
            </motion.div>
          )}

          {/* MAP */}
          {phase === 'map' && campaignState && (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CampaignMap campaignState={campaignState} onFight={handleFight} onReset={handleReset} onChangePlan={handleChangePlan} />
            </motion.div>
          )}

          {/* REVEAL */}
          {phase === 'reveal' && currentChar && (
            <motion.div key="reveal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <AICharacterReveal character={currentChar} onContinue={handleRevealContinue} />
            </motion.div>
          )}

          {/* ATTRIBUTES — only first fight */}
          {phase === 'attributes' && (
            <motion.div key="attributes" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <AttributesPhase
                onConfirm={handleAttributesConfirm}
                myReady={false}
                opponentReady={true}
                pointBudget={currentBudget}
              />
            </motion.div>
          )}

          {/* PLANNING */}
          {phase === 'actions' && (
            <motion.div key="actions" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <ActionsPhase onConfirm={handleActionsConfirm} myReady={false} opponentReady={true} />
            </motion.div>
          )}

          {/* RESOLUTION */}
          {phase === 'resolution' && results && campaignState && currentChar && (
            <motion.div key="resolution" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ResolutionPhase
                results={results}
                p1Name={campaignState.playerNickname}
                p2Name={currentChar.name}
                onPlayAgain={handleResolutionDone}
                aiCharacter={currentChar}
              />
            </motion.div>
          )}

          {/* BONUS — after win */}
          {phase === 'bonus' && campaignState && playerAttrs && (
            <motion.div key="bonus" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <BonusPointsModal currentAttrs={playerAttrs} bonusPoints={2} onConfirm={handleBonusConfirm} />
            </motion.div>
          )}

          {/* VICTORY */}
          {phase === 'victory' && campaignState && (
            <motion.div key="victory" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <CampaignVictoryScreen
                playerNickname={campaignState.playerNickname}
                totalBudget={10 + campaignState.playerBonusPoints}
                onNewCampaign={handleReset}
              />
            </motion.div>
          )}

          {/* DEFEATED */}
          {phase === 'defeated' && campaignState && currentChar && (
            <motion.div key="defeated" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <CampaignDefeatedScreen
                opponent={currentChar}
                levelReached={campaignState.currentLevelIndex + 1}
                playerNickname={campaignState.playerNickname}
                onNewCampaign={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showAiBadge && currentChar && campaignState && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-6 right-6 rounded-2xl p-3 flex items-center gap-3"
          style={{ background: 'rgba(10,10,26,0.9)', border: `1px solid ${currentChar.color}40`, backdropFilter: 'blur(10px)' }}
        >
          <span className="text-2xl">{currentChar.emoji}</span>
          <div>
            <p className="text-xs font-black" style={{ color: currentChar.color }}>{currentChar.name}</p>
            <p className="text-xs text-white/40">Level {campaignState.currentLevelIndex + 1}</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
