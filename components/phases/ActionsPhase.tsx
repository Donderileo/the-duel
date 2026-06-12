'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ActionBlock, Target, Dodge } from '@/types/game'
import { TARGET_LABELS, DODGE_LABELS } from '@/lib/gameLogic'

interface ActionsPhaseProps {
  onConfirm: (actions: ActionBlock[]) => void
  opponentReady: boolean
  myReady: boolean
}

const TARGET_DMG: Record<Target, number> = {
  head: 100,
  left_shoulder: 50,
  right_shoulder: 50,
  left_arm: 20,
  right_arm: 20,
}

const DODGE_PROTECTS: Record<Dodge, Target[]> = {
  still: [],
  dodge_right: ['head', 'left_shoulder', 'left_arm'],
  dodge_left: ['head', 'right_shoulder', 'right_arm'],
  duck: ['head', 'left_shoulder', 'right_shoulder'],
}

const BLOCK_LABELS = ['A', 'B', 'C', 'D']
const BLOCK_ROUNDS = ['Rounds 1 & 5', 'Rounds 2 & 6', 'Rounds 3 & 7', 'Rounds 4 & 8']
const DODGES: Dodge[] = ['still', 'dodge_right', 'dodge_left', 'duck']

const DODGE_META: Record<Dodge, { icon: string; desc: string; color: string }> = {
  still:       { icon: '🧱', desc: '+3 Resistance', color: '#64748b' },
  dodge_right: { icon: '↗️', desc: 'Covers head + left shoulder + left arm', color: '#a78bfa' },
  dodge_left:  { icon: '↖️', desc: 'Covers head + right shoulder + right arm', color: '#a78bfa' },
  duck:        { icon: '⬇️', desc: 'Covers head + both shoulders', color: '#2dc653' },
}

const TARGET_COLOR: Record<Target, string> = {
  head:           '#e63946',
  left_shoulder:  '#f97316',
  right_shoulder: '#f97316',
  left_arm:       '#f5c842',
  right_arm:      '#f5c842',
}

function defaultBlock(): ActionBlock {
  return { target: 'head', dodge: 'still' }
}

// ─── Body Map ────────────────────────────────────────────────────────────────

interface BodyMapProps {
  selected: Target
  onSelect: (t: Target) => void
  dodge: Dodge
  disabled: boolean
}

function BodyMap({ selected, onSelect, dodge, disabled }: BodyMapProps) {
  const protected_ = DODGE_PROTECTS[dodge]

  const zone = (target: Target, label: string, style: React.CSSProperties) => {
    const isSelected = selected === target
    const isProtected = protected_.includes(target)
    const color = TARGET_COLOR[target]

    return (
      <motion.button
        key={target}
        onClick={() => !disabled && onSelect(target)}
        disabled={disabled}
        whileHover={disabled ? {} : { scale: 1.06 }}
        whileTap={disabled ? {} : { scale: 0.96 }}
        className="absolute flex flex-col items-center justify-center rounded-lg text-xs font-black cursor-pointer select-none"
        style={{
          ...style,
          background: isSelected
            ? `${color}33`
            : isProtected
            ? 'rgba(45,198,83,0.10)'
            : 'rgba(255,255,255,0.05)',
          border: `2px solid ${isSelected ? color : isProtected ? '#2dc653' : 'rgba(255,255,255,0.12)'}`,
          color: isSelected ? color : isProtected ? '#2dc653' : 'rgba(255,255,255,0.5)',
          boxShadow: isSelected ? `0 0 16px ${color}55` : 'none',
          transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s, color 0.15s',
        }}
      >
        <span>{label}</span>
        <span className="text-xs opacity-70 font-normal">{TARGET_DMG[target]}</span>
        {isProtected && (
          <span className="absolute -top-1.5 -right-1.5 text-xs leading-none">🛡</span>
        )}
      </motion.button>
    )
  }

  return (
    <div className="relative mx-auto" style={{ width: 260, height: 200 }}>
      {/* Head — center top */}
      {zone('head', 'Head', { top: 0, left: '50%', transform: 'translateX(-50%)', width: 72, height: 50 })}
      {/* Shoulders — / \ shape flanking center */}
      {zone('left_shoulder',  'L. Shoulder', { top: 58, left: 20,  width: 68, height: 44 })}
      {zone('right_shoulder', 'R. Shoulder', { top: 58, right: 20, width: 68, height: 44 })}
      {/* Arms — wider outward, lower */}
      {zone('left_arm',  'L. Arm', { top: 110, left: 4,  width: 60, height: 40 })}
      {zone('right_arm', 'R. Arm', { top: 110, right: 4, width: 60, height: 40 })}

      {/* Damage legend */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-3 text-xs text-white/30">
        <span style={{ color: '#e63946' }}>● High</span>
        <span style={{ color: '#f97316' }}>● Mid</span>
        <span style={{ color: '#f5c842' }}>● Low</span>
      </div>
    </div>
  )
}

// ─── Dodge Picker ────────────────────────────────────────────────────────────

interface DodgePickerProps {
  selected: Dodge
  onSelect: (d: Dodge) => void
  disabled: boolean
}

function DodgePicker({ selected, onSelect, disabled }: DodgePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      {DODGES.map(d => {
        const isSelected = selected === d
        const meta = DODGE_META[d]
        return (
          <motion.button
            key={d}
            onClick={() => !disabled && onSelect(d)}
            disabled={disabled}
            whileHover={disabled ? {} : { y: -2 }}
            whileTap={disabled ? {} : { scale: 0.97 }}
            className="rounded-xl p-3 text-left flex flex-col gap-1"
            style={{
              background: isSelected ? `${meta.color}22` : 'rgba(255,255,255,0.04)',
              border: `2px solid ${isSelected ? meta.color : 'rgba(255,255,255,0.08)'}`,
              boxShadow: isSelected ? `0 0 14px ${meta.color}44` : 'none',
              transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{meta.icon}</span>
              <span className="text-xs font-black text-white">{DODGE_LABELS[d]}</span>
            </div>
            <p className="text-xs leading-tight" style={{ color: isSelected ? meta.color : 'rgba(255,255,255,0.35)' }}>
              {meta.desc}
            </p>
          </motion.button>
        )
      })}
    </div>
  )
}

// ─── Block summary mini-card ─────────────────────────────────────────────────

function BlockMiniCard({
  label,
  action,
  active,
  onClick,
}: {
  label: string
  action: ActionBlock
  active: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      className="flex-1 rounded-xl py-2 px-1 flex flex-col items-center gap-1 transition-all"
      style={{
        background: active ? 'rgba(245,200,66,0.15)' : 'rgba(255,255,255,0.04)',
        border: `2px solid ${active ? 'rgba(245,200,66,0.6)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: active ? '0 0 12px rgba(245,200,66,0.2)' : 'none',
      }}
    >
      <span className="text-xs font-black" style={{ color: active ? '#f5c842' : 'rgba(255,255,255,0.4)' }}>
        {label}
      </span>
      <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs"
        style={{ background: `${TARGET_COLOR[action.target]}33`, border: `1px solid ${TARGET_COLOR[action.target]}66` }}>
        <span style={{ color: TARGET_COLOR[action.target] }}>🎯</span>
      </div>
      <span className="text-xs leading-tight text-center" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: '0.6rem' }}>
        {TARGET_LABELS[action.target]}
      </span>
      <span className="text-xs" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>
        {DODGE_META[action.dodge].icon}
      </span>
    </motion.button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ActionsPhase({ onConfirm, opponentReady, myReady }: ActionsPhaseProps) {
  const [actions, setActions] = useState<ActionBlock[]>([defaultBlock(), defaultBlock(), defaultBlock(), defaultBlock()])
  const [active, setActive] = useState(0)

  function setTarget(t: Target) {
    setActions(prev => prev.map((a, i) => i === active ? { ...a, target: t } : a))
  }
  function setDodge(d: Dodge) {
    setActions(prev => prev.map((a, i) => i === active ? { ...a, dodge: d } : a))
  }

  const cur = actions[active]
  const isLast = active === 3

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-black uppercase tracking-widest" style={{ color: '#f5c842' }}>
          Plan Actions
        </h2>
        <p className="text-white/40 text-xs mt-1">Set up 4 blocks · each covers 2 rounds</p>
      </div>

      {/* Block selector summary */}
      <div className="flex gap-2 w-full">
        {actions.map((a, i) => (
          <BlockMiniCard
            key={i}
            label={`Block ${BLOCK_LABELS[i]}`}
            action={a}
            active={i === active}
            onClick={() => setActive(i)}
          />
        ))}
      </div>

      {/* Active block detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="w-full flex flex-col items-center gap-4"
        >
          <p className="text-white/30 text-xs uppercase tracking-widest">
            {BLOCK_ROUNDS[active]}
          </p>

          {/* Two-column layout: body map | dodge picker */}
          <div className="w-full flex gap-4 items-start">
            {/* Left: body map */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <p className="text-xs font-black uppercase tracking-wider text-white/50">🎯 Where to shoot</p>
              <BodyMap
                selected={cur.target}
                onSelect={setTarget}
                dodge={cur.dodge}
                disabled={myReady}
              />
            </div>

            {/* Right: dodge */}
            <div className="flex-1 flex flex-col gap-2 pt-6">
              <p className="text-xs font-black uppercase tracking-wider text-white/50">🛡️ How to dodge</p>
              <DodgePicker
                selected={cur.dodge}
                onSelect={setDodge}
                disabled={myReady}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Status */}
      <div className="flex gap-4 text-xs w-full justify-center">
        <span style={{ color: myReady ? '#2dc653' : '#f5c842' }}>
          {myReady ? '✓ You: Ready' : 'Configuring...'}
        </span>
        <span style={{ color: opponentReady ? '#2dc653' : 'rgba(255,255,255,0.3)' }}>
          {opponentReady ? '✓ Opponent: Ready' : '○ Opponent: planning...'}
        </span>
      </div>

      {!myReady && (
        <div className="flex gap-2 w-full">
          {active > 0 && (
            <motion.button
              onClick={() => setActive(active - 1)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn-ghost py-3 px-5 text-sm"
            >
              ← Back
            </motion.button>
          )}
          {!isLast ? (
            <motion.button
              onClick={() => setActive(active + 1)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn-gold flex-1 py-3 text-sm"
            >
              Next Block →
            </motion.button>
          ) : (
            <button onClick={() => onConfirm(actions)} className="btn-red flex-1 py-4 text-lg">
              🔫 READY — Start Duel
            </button>
          )}
        </div>
      )}

      {myReady && !opponentReady && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-white/50 text-sm"
        >
          Waiting for opponent...
        </motion.p>
      )}
    </div>
  )
}
