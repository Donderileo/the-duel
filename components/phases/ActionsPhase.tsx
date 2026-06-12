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

// Full protection: −20 acc + ×0.5 dmg
const DODGE_PROTECTS: Record<Dodge, Target[]> = {
  still:       [],
  dodge_right: ['left_shoulder', 'left_arm'],
  dodge_left:  ['right_shoulder', 'right_arm'],
  duck:        ['head', 'left_shoulder', 'right_shoulder'],
}

// Partial protection: −10 acc, no dmg reduction
const DODGE_PARTIAL: Record<Dodge, Target[]> = {
  still:       [],
  dodge_right: ['head'],
  dodge_left:  ['head'],
  duck:        [],
}

// Duck cannot aim at head
const DODGE_BLOCKED_TARGETS: Record<Dodge, Target[]> = {
  still:       [],
  dodge_right: [],
  dodge_left:  [],
  duck:        ['head'],
}

const BLOCK_LABELS = ['A', 'B', 'C', 'D']
const BLOCK_ROUNDS = ['Rounds 1 & 5', 'Rounds 2 & 6', 'Rounds 3 & 7', 'Rounds 4 & 8']
const DODGES: Dodge[] = ['still', 'dodge_right', 'dodge_left', 'duck']

const DODGE_META: Record<Dodge, { icon: string; desc: string; color: string }> = {
  still:       { icon: '🎯', desc: '+3 Precision', color: '#64748b' },
  dodge_right: { icon: '↗️', desc: 'Full: L.Shoulder + L.Arm · ½ Head', color: '#a78bfa' },
  dodge_left:  { icon: '↖️', desc: 'Full: R.Shoulder + R.Arm · ½ Head', color: '#a78bfa' },
  duck:        { icon: '⬇️', desc: 'Full: Head + Shoulders · Cannot aim head', color: '#2dc653' },
}

const TARGET_COLOR: Record<Target, string> = {
  head:           '#e63946',
  left_shoulder:  '#f97316',
  right_shoulder: '#f97316',
  left_arm:       '#f5c842',
  right_arm:      '#f5c842',
}

// Target layout: rows of zones
const TARGET_ROWS: Target[][] = [
  ['head'],
  ['left_shoulder', 'right_shoulder'],
  ['left_arm', 'right_arm'],
]

function defaultBlock(): ActionBlock {
  return { target: 'head', dodge: 'still' }
}

// ─── Block summary mini-card ──────────────────────────────────────────────────

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
      <span className="text-base">{DODGE_META[action.dodge].icon}</span>
      <span style={{ color: TARGET_COLOR[action.target], fontSize: '0.6rem', fontWeight: 800 }}>
        {TARGET_LABELS[action.target]}
      </span>
    </motion.button>
  )
}

// ─── Target Grid ──────────────────────────────────────────────────────────────

function TargetGrid({
  selected,
  onSelect,
  dodge,
  disabled,
}: {
  selected: Target
  onSelect: (t: Target) => void
  dodge: Dodge
  disabled: boolean
}) {
  const fullProtected = DODGE_PROTECTS[dodge]
  const partialProtected = DODGE_PARTIAL[dodge]
  const blocked = DODGE_BLOCKED_TARGETS[dodge]

  return (
    <div className="w-full flex flex-col gap-2">
      {TARGET_ROWS.map((row, ri) => (
        <div key={ri} className={`grid gap-2 ${row.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {row.map(target => {
            const isSelected = selected === target
            const isFull = fullProtected.includes(target)
            const isPartial = partialProtected.includes(target)
            const isBlocked = blocked.includes(target)
            const color = TARGET_COLOR[target]

            return (
              <motion.button
                key={target}
                onClick={() => !disabled && !isBlocked && onSelect(target)}
                disabled={disabled || isBlocked}
                whileHover={disabled || isBlocked ? {} : { scale: 1.02 }}
                whileTap={disabled || isBlocked ? {} : { scale: 0.97 }}
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{
                  background: isBlocked
                    ? 'rgba(255,255,255,0.02)'
                    : isSelected
                    ? `${color}22`
                    : isFull
                    ? 'rgba(45,198,83,0.08)'
                    : isPartial
                    ? 'rgba(245,200,66,0.06)'
                    : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${
                    isBlocked  ? 'rgba(255,255,255,0.06)'
                    : isSelected ? color
                    : isFull   ? '#2dc653'
                    : isPartial ? '#f5c84266'
                    : 'rgba(255,255,255,0.10)'
                  }`,
                  opacity: isBlocked ? 0.35 : 1,
                  cursor: isBlocked ? 'not-allowed' : disabled ? 'default' : 'pointer',
                  boxShadow: isSelected ? `0 0 14px ${color}44` : 'none',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black" style={{ color: isBlocked ? 'rgba(255,255,255,0.2)' : isSelected ? color : isFull ? '#2dc653' : isPartial ? '#f5c842aa' : 'rgba(255,255,255,0.6)' }}>
                    {TARGET_LABELS[target]}
                  </span>
                  {isFull    && !isSelected && <span className="text-xs">🛡</span>}
                  {isPartial && !isSelected && <span className="text-xs opacity-60">½</span>}
                  {isBlocked && <span className="text-xs opacity-40">🚫</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black" style={{ color: isBlocked ? 'rgba(255,255,255,0.2)' : color }}>
                    {TARGET_DMG[target]}
                  </span>
                  {isSelected && (
                    <motion.div
                      layoutId="target-dot"
                      className="w-2 h-2 rounded-full"
                      style={{ background: color }}
                    />
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Dodge Grid ───────────────────────────────────────────────────────────────

function DodgeGrid({
  selected,
  onSelect,
  disabled,
}: {
  selected: Dodge
  onSelect: (d: Dodge) => void
  disabled: boolean
}) {
  return (
    <div className="w-full flex flex-col gap-2">
      {DODGES.map(d => {
        const isSelected = selected === d
        const meta = DODGE_META[d]
        return (
          <motion.button
            key={d}
            onClick={() => !disabled && onSelect(d)}
            disabled={disabled}
            whileHover={disabled ? {} : { x: 2 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
            className="w-full rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: isSelected ? `${meta.color}18` : 'rgba(255,255,255,0.04)',
              border: `2px solid ${isSelected ? meta.color : 'rgba(255,255,255,0.08)'}`,
              boxShadow: isSelected ? `0 0 12px ${meta.color}33` : 'none',
              cursor: disabled ? 'default' : 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <span className="text-xl leading-none flex-shrink-0">{meta.icon}</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-black text-white">{DODGE_LABELS[d]}</p>
              <p className="text-xs mt-0.5" style={{ color: isSelected ? meta.color : 'rgba(255,255,255,0.3)' }}>
                {meta.desc}
              </p>
            </div>
            {isSelected && (
              <motion.div
                layoutId="dodge-dot"
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: meta.color }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
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
    setActions(prev => prev.map((a, i) => {
      if (i !== active) return a
      // Duck cannot aim at head — switch to left_shoulder automatically
      const target = DODGE_BLOCKED_TARGETS[d].includes(a.target) ? 'left_shoulder' : a.target
      return { ...a, dodge: d, target }
    }))
  }

  const cur = actions[active]
  const isLast = active === 3

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-black uppercase tracking-widest" style={{ color: '#f5c842' }}>
          Planning
        </h2>
        <p className="text-white/40 text-xs mt-1">4 blocks · each covers 2 rounds</p>
      </div>

      {/* Block selector */}
      <div className="flex gap-2 w-full">
        {actions.map((a, i) => (
          <BlockMiniCard
            key={i}
            label={BLOCK_LABELS[i]}
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
          transition={{ duration: 0.18 }}
          className="w-full flex flex-col gap-4"
        >
          <p className="text-white/30 text-xs uppercase tracking-widest text-center">
            Block {BLOCK_LABELS[active]} · {BLOCK_ROUNDS[active]}
          </p>

          {/* Target + Dodge — stacked on mobile, side-by-side on desktop */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Target selection */}
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-white/50 mb-2">🎯 Where to shoot</p>
              <TargetGrid
                selected={cur.target}
                onSelect={setTarget}
                dodge={cur.dodge}
                disabled={myReady}
              />
            </div>

            {/* Dodge selection */}
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-white/50 mb-2">🛡️ How to dodge</p>
              <DodgeGrid
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
