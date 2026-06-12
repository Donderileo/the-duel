import type { Attributes, ActionBlock } from '@/types/game'
import type { AICharacter } from '@/lib/aiCharacters'
import { AI_CHARACTERS } from '@/lib/aiCharacters'

export type CampaignDifficulty = 'easy' | 'hard'

export interface CampaignState {
  version: 1
  playerNickname: string
  difficulty: CampaignDifficulty
  currentLevelIndex: number
  playerBonusPoints: number
  playerAttrs: Attributes
  playerActions: ActionBlock[] | null
  levelsCompleted: boolean[]
  campaignComplete: boolean
}

// Difficulty order: easiest → hardest
export const CAMPAIGN_ORDER = [
  'mad_dog',
  'iron_jack',
  'la_sombra',
  'the_ghost',
  'la_patrona',
  'dead_eye',
  'el_toro',
  'el_fantasma',
]

export const CAMPAIGN_AI_BUDGETS: Record<string, number> = {
  mad_dog:     10,
  iron_jack:   12,
  la_sombra:   14,
  the_ghost:   16,
  la_patrona:  18,
  dead_eye:    21,
  el_toro:     24,
  el_fantasma: 28,
}

const MAX_PER_ATTR = 12

export function scaleCharacterAttributes(character: AICharacter, budget: number): Attributes {
  const base = character.attributes
  const baseTotal = base.precision + base.damage + base.reflexes + base.resistance
  const keys: (keyof Attributes)[] = ['precision', 'damage', 'reflexes', 'resistance']

  // Proportional scaling
  const scaled: Attributes = {
    precision:  Math.min(MAX_PER_ATTR, Math.round((base.precision  / baseTotal) * budget)),
    damage:     Math.min(MAX_PER_ATTR, Math.round((base.damage     / baseTotal) * budget)),
    reflexes:   Math.min(MAX_PER_ATTR, Math.round((base.reflexes   / baseTotal) * budget)),
    resistance: Math.min(MAX_PER_ATTR, Math.round((base.resistance / baseTotal) * budget)),
  }

  // Distribute any leftover points (rounding errors) to dominant stat
  let allocated = scaled.precision + scaled.damage + scaled.reflexes + scaled.resistance
  const dominant = keys.reduce((a, b) => base[a] >= base[b] ? a : b)
  while (allocated < budget && scaled[dominant] < MAX_PER_ATTR) {
    scaled[dominant]++
    allocated++
  }
  // If dominant is capped, fill any remainder into next-best
  for (const k of keys) {
    while (allocated < budget && scaled[k] < MAX_PER_ATTR) {
      scaled[k]++
      allocated++
    }
  }

  return scaled
}

export function getCampaignCharacter(levelIndex: number): AICharacter {
  const id = CAMPAIGN_ORDER[levelIndex]
  return AI_CHARACTERS.find(c => c.id === id)!
}

// — HMAC tamper protection —

const SIGN_KEY = 'pd_c4mp41gn_s3cr3t_k3y'

async function hmac(data: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SIGN_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

const STORAGE_KEY = 'duel_campaign'

export async function saveCampaignState(state: CampaignState): Promise<void> {
  const data = JSON.stringify(state)
  const sig = await hmac(data)
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: state, sig }))
}

export async function getCampaignState(): Promise<CampaignState | null> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const { data, sig } = JSON.parse(raw)
    const expected = await hmac(JSON.stringify(data))
    if (sig !== expected) return null
    return data as CampaignState
  } catch {
    return null
  }
}

export function clearCampaignState(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function createFreshCampaignState(
  playerNickname: string,
  difficulty: CampaignDifficulty,
): CampaignState {
  return {
    version: 1,
    playerNickname,
    difficulty,
    currentLevelIndex: 0,
    playerBonusPoints: 0,
    playerAttrs: { precision: 0, damage: 0, reflexes: 0, resistance: 0 },
    playerActions: null,
    levelsCompleted: Array(8).fill(false),
    campaignComplete: false,
  }
}
