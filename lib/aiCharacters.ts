import type { Attributes, ActionBlock, Target, Dodge } from '@/types/game'

export interface AICharacter {
  id: string
  name: string
  title: string
  emoji: string
  description: string
  color: string
  attributes: Attributes
  // Weighted preferences for action generation
  targetWeights: Record<Target, number>
  dodgeWeights: Record<Dodge, number>
}

export const AI_CHARACTERS: AICharacter[] = [
  {
    id: 'dead_eye',
    name: 'Dead Eye',
    title: 'O Atirador Lendário',
    emoji: '🎯',
    color: '#f5c842',
    description: 'Precisão letal. Cada tiro é calculado. Raramente erra.',
    attributes: { precision: 6, damage: 2, reflexes: 1, resistance: 1 },
    targetWeights: { head: 70, left_shoulder: 10, right_shoulder: 10, left_arm: 5, right_arm: 5 },
    dodgeWeights: { still: 50, dodge_right: 20, dodge_left: 20, duck: 10 },
  },
  {
    id: 'el_toro',
    name: 'El Toro',
    title: 'A Força Bruta',
    emoji: '🐂',
    color: '#e63946',
    description: 'Não esquiva. Não recua. Causa dano devastador com cada acerto.',
    attributes: { precision: 1, damage: 7, reflexes: 1, resistance: 1 },
    targetWeights: { head: 50, left_shoulder: 20, right_shoulder: 20, left_arm: 5, right_arm: 5 },
    dodgeWeights: { still: 80, dodge_right: 8, dodge_left: 8, duck: 4 },
  },
  {
    id: 'la_sombra',
    name: 'La Sombra',
    title: 'A Ilusão',
    emoji: '👤',
    color: '#a78bfa',
    description: 'Impossível de acertar. Esquiva de tudo. Mas o dano dela é suave.',
    attributes: { precision: 1, damage: 1, reflexes: 6, resistance: 2 },
    targetWeights: { head: 20, left_shoulder: 20, right_shoulder: 20, left_arm: 20, right_arm: 20 },
    dodgeWeights: { still: 5, dodge_right: 30, dodge_left: 30, duck: 35 },
  },
  {
    id: 'iron_jack',
    name: 'Iron Jack',
    title: 'A Muralha',
    emoji: '🛡️',
    color: '#64748b',
    description: 'Absorve tudo. Fica parado para ampliar resistência. Dura pra caramba.',
    attributes: { precision: 2, damage: 2, reflexes: 1, resistance: 5 },
    targetWeights: { head: 10, left_shoulder: 30, right_shoulder: 30, left_arm: 15, right_arm: 15 },
    dodgeWeights: { still: 75, dodge_right: 10, dodge_left: 10, duck: 5 },
  },
  {
    id: 'mad_dog',
    name: 'Mad Dog',
    title: 'O Imprevisível',
    emoji: '🐺',
    color: '#f97316',
    description: 'Caótico. Você nunca sabe o que esperar. Puro instinto animal.',
    attributes: { precision: 2, damage: 4, reflexes: 2, resistance: 2 },
    targetWeights: { head: 20, left_shoulder: 20, right_shoulder: 20, left_arm: 20, right_arm: 20 },
    dodgeWeights: { still: 25, dodge_right: 25, dodge_left: 25, duck: 25 },
  },
  {
    id: 'la_patrona',
    name: 'La Patrona',
    title: 'A Estrategista',
    emoji: '🌹',
    color: '#ec4899',
    description: 'Reflexos de felino e mira afiada. Joga no longo prazo.',
    attributes: { precision: 3, damage: 1, reflexes: 4, resistance: 2 },
    targetWeights: { head: 30, left_shoulder: 25, right_shoulder: 25, left_arm: 10, right_arm: 10 },
    dodgeWeights: { still: 10, dodge_right: 35, dodge_left: 35, duck: 20 },
  },
  {
    id: 'el_fantasma',
    name: 'El Fantasma',
    title: 'O Canhão de Vidro',
    emoji: '💀',
    color: '#06b6d4',
    description: 'Ataque máximo, defesa zero. Mata rápido ou morre rápido.',
    attributes: { precision: 4, damage: 5, reflexes: 1, resistance: 0 },
    targetWeights: { head: 60, left_shoulder: 15, right_shoulder: 15, left_arm: 5, right_arm: 5 },
    dodgeWeights: { still: 60, dodge_right: 15, dodge_left: 15, duck: 10 },
  },
  {
    id: 'the_ghost',
    name: 'The Ghost',
    title: 'O Equilibrado',
    emoji: '⚖️',
    color: '#2dc653',
    description: 'Sem ponto fraco, sem ponto forte. Adaptável a qualquer situação.',
    attributes: { precision: 3, damage: 2, reflexes: 3, resistance: 2 },
    targetWeights: { head: 25, left_shoulder: 20, right_shoulder: 20, left_arm: 20, right_arm: 15 },
    dodgeWeights: { still: 20, dodge_right: 30, dodge_left: 30, duck: 20 },
  },
]

function weightedRandom<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][]
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let rand = Math.random() * total
  for (const [key, weight] of entries) {
    rand -= weight
    if (rand <= 0) return key
  }
  return entries[0][0]
}

export function generateAIActions(character: AICharacter): ActionBlock[] {
  return Array.from({ length: 4 }, () => ({
    target: weightedRandom(character.targetWeights),
    dodge: weightedRandom(character.dodgeWeights),
  }))
}

export function pickRandomCharacter(): AICharacter {
  return AI_CHARACTERS[Math.floor(Math.random() * AI_CHARACTERS.length)]
}
