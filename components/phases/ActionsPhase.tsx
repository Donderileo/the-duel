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

// Damage base values
const TARGET_DMG: Record<Target, number> = {
  head: 100,
  left_shoulder: 50,
  right_shoulder: 50,
  left_chest: 30,
  right_chest: 30,
}

// Zones protected by each dodge
const DODGE_PROTECTS: Record<Dodge, Target[]> = {
  still: [],
  dodge_right: ['head', 'left_shoulder'],
  dodge_left: ['head', 'right_shoulder'],
  duck: ['head', 'left_shoulder', 'right_shoulder'],
}

const BLOCK_LABELS = ['A', 'B', 'C', 'D']
const BLOCK_ROUNDS = ['Rounds 1 e 5', 'Rounds 2 e 6', 'Rounds 3 e 7', 'Rounds 4 e 8']
const DODGES: Dodge[] = ['still', 'dodge_right', 'dodge_left', 'duck']

const DODGE_META: Record<Dodge, { icon: string; desc: string; color: string }> = {
  still:       { icon: '🧱', desc: '+3 Resistência', color: '#64748b' },
  dodge_right: { icon: '↗️', desc: 'Cobre cabeça + ombro esq', color: '#a78bfa' },
  dodge_left:  { icon: '↖️', desc: 'Cobre cabeça + ombro dir', color: '#a78bfa' },
  duck:        { icon: '⬇️', desc: 'Cobre cabeça + ambos ombros', color: '#2dc653' },
}

const TARGET_COLOR: Record<Target, string> = {
  head:           '#e63946',
  left_shoulder:  '#f97316',
  right_shoulder: '#f97316',
  left_chest:     '#f5c842',
  right_chest:    '#f5c842',
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
    <div className="relative mx-auto" style={{ width: 220, height: 260 }}>
      {/* Silhouette */}
      <div className="absolute inset-0 flex flex-col items-center justify-start pt-2 pointer-events-none select-none">
        {/* Head circle */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-3xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          🤠
        </div>
        {/* Neck */}
        <div className="w-3 h-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
        {/* Torso */}
        <div className="w-20 h-28 rounded-b-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
      </div>

      {/* Clickable zones */}
      {zone('head',           'Cabeça',    { top: 2,   left: '50%', transform: 'translateX(-50%)', width: 72, height: 50 })}
      {zone('left_shoulder',  'Ombro E',   { top: 60,  left: 8,                                     width: 60, height: 44 })}
      {zone('right_shoulder', 'Ombro D',   { top: 60,  right: 8,                                    width: 60, height: 44 })}
      {zone('left_chest',     'Peito E',   { top: 112, left: '50%', transform: 'translateX(-8px) translateX(-50%)', width: 72, height: 44 })}
      {zone('right_chest',    'Peito D',   { top: 112, right: '50%', transform: 'translateX(8px) translateX(50%)',  width: 72, height: 44 })}

      {/* Damage legend */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-3 text-xs text-white/30">
        <span style={{ color: '#e63946' }}>● Alto</span>
        <span style={{ color: '#f97316' }}>● Médio</span>
        <span style={{ color: '#f5c842' }}>● Baixo</span>
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

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-black uppercase tracking-widest" style={{ color: '#f5c842' }}>
          Planejar Ações
        </h2>
        <p className="text-white/40 text-xs mt-1">Configure os 4 blocos · cada um vale 2 rounds</p>
      </div>

      {/* Block selector summary */}
      <div className="flex gap-2 w-full">
        {actions.map((a, i) => (
          <BlockMiniCard
            key={i}
            label={`Bloco ${BLOCK_LABELS[i]}`}
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
              <p className="text-xs font-black uppercase tracking-wider text-white/50">🎯 Onde atirar</p>
              <BodyMap
                selected={cur.target}
                onSelect={setTarget}
                dodge={cur.dodge}
                disabled={myReady}
              />
            </div>

            {/* Right: dodge */}
            <div className="flex-1 flex flex-col gap-2 pt-6">
              <p className="text-xs font-black uppercase tracking-wider text-white/50">🛡️ Como desviar</p>
              <DodgePicker
                selected={cur.dodge}
                onSelect={setDodge}
                disabled={myReady}
              />
              {/* Selection summary pill */}
              <div className="rounded-xl p-3 mt-1"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs text-white/40 mb-1">Resumo do bloco</p>
                <p className="text-xs text-white">
                  <span style={{ color: TARGET_COLOR[cur.target] }}>⬤</span>
                  {' '}{TARGET_LABELS[cur.target]}
                  <span className="text-white/30"> · </span>
                  {TARGET_DMG[cur.target]} dano base
                </p>
                <p className="text-xs text-white mt-0.5">
                  <span>{DODGE_META[cur.dodge].icon}</span>
                  {' '}{DODGE_LABELS[cur.dodge]}
                  <span className="text-white/30"> · </span>
                  {DODGE_PROTECTS[cur.dodge].length > 0
                    ? `cobre ${DODGE_PROTECTS[cur.dodge].map(t => TARGET_LABELS[t]).join(', ')}`
                    : DODGE_META[cur.dodge].desc}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Status + confirm */}
      <div className="flex gap-4 text-xs w-full justify-center">
        <span style={{ color: myReady ? '#2dc653' : '#f5c842' }}>
          {myReady ? '✓ Você: Pronto' : 'Configurando...'}
        </span>
        <span style={{ color: opponentReady ? '#2dc653' : 'rgba(255,255,255,0.3)' }}>
          {opponentReady ? '✓ Oponente: Pronto' : '○ Oponente: planejando...'}
        </span>
      </div>

      {!myReady && (
        <button onClick={() => onConfirm(actions)} className="btn-red w-full py-4 text-lg">
          🔫 PRONTO — Iniciar Duelo
        </button>
      )}

      {myReady && !opponentReady && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-white/50 text-sm"
        >
          Aguardando oponente...
        </motion.p>
      )}
    </div>
  )
}
