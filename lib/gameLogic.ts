import type { ActionBlock, Player, RoundResult, Target, Dodge } from '@/types/game'

const TARGET_DAMAGE: Record<Target, number> = {
  head: 100,
  left_shoulder: 50,
  right_shoulder: 50,
  left_arm: 20,
  right_arm: 20,
}

export const TARGET_LABELS: Record<Target, string> = {
  head: 'Head',
  left_shoulder: 'L. Shoulder',
  right_shoulder: 'R. Shoulder',
  left_arm: 'L. Arm',
  right_arm: 'R. Arm',
}

export const DODGE_LABELS: Record<Dodge, string> = {
  still: 'Still (Aim)',
  dodge_right: 'Dodge Right',
  dodge_left: 'Dodge Left',
  duck: 'Duck',
}

const DODGE_PROTECTIONS: Record<Dodge, Target[]> = {
  still: [],
  dodge_right: ['head', 'left_shoulder', 'left_arm'],
  dodge_left: ['head', 'right_shoulder', 'right_arm'],
  duck: ['head', 'left_shoulder', 'right_shoulder'],
}

function calcHitChance(shooterPrecision: number, targetReflexes: number): number {
  const chance = 50 + shooterPrecision * 5 - targetReflexes * 5
  return Math.min(95, Math.max(10, chance))
}

function calcDamage(
  baseDamage: number,
  shooterDamage: number,
  targetResistance: number,
  isProtected: boolean
): number {
  let base = baseDamage
  if (isProtected) base *= 0.5
  return base * (1 + Math.pow(shooterDamage, 1.5) * 0.06) * (1 - targetResistance * 0.08)
}

function actionForRound(actions: ActionBlock[], round: number): ActionBlock {
  return actions[(round - 1) % 4]
}

export function simulateGame(player1: Player, player2: Player): RoundResult[] {
  const p1Attrs = player1.attributes!
  const p2Attrs = player2.attributes!
  const p1Actions = player1.actions!
  const p2Actions = player2.actions!

  let hp1 = 200
  let hp2 = 200
  const results: RoundResult[] = []

  for (let round = 1; round <= 8; round++) {
    const a1 = actionForRound(p1Actions, round)
    const a2 = actionForRound(p2Actions, round)

    // p1 shoots p2
    const p2Protected = DODGE_PROTECTIONS[a2.dodge].includes(a1.target)
    const p1EffPrecision = p1Attrs.precision + (a1.dodge === 'still' ? 3 : 0)
    const p1BaseChance = calcHitChance(p1EffPrecision, p2Attrs.reflexes)
    const p1HitChance = p2Protected ? Math.max(10, p1BaseChance - 20) : p1BaseChance
    const p1Hit = Math.random() * 100 < p1HitChance
    let p1Damage = 0
    if (p1Hit) {
      p1Damage = calcDamage(TARGET_DAMAGE[a1.target], p1Attrs.damage, p2Attrs.resistance, p2Protected)
      hp2 = Math.max(0, hp2 - p1Damage)
    }

    // p2 shoots p1
    const p1Protected = DODGE_PROTECTIONS[a1.dodge].includes(a2.target)
    const p2EffPrecision = p2Attrs.precision + (a2.dodge === 'still' ? 3 : 0)
    const p2BaseChance = calcHitChance(p2EffPrecision, p1Attrs.reflexes)
    const p2HitChance = p1Protected ? Math.max(10, p2BaseChance - 20) : p2BaseChance
    const p2Hit = Math.random() * 100 < p2HitChance
    let p2Damage = 0
    if (p2Hit) {
      p2Damage = calcDamage(TARGET_DAMAGE[a2.target], p2Attrs.damage, p1Attrs.resistance, p1Protected)
      hp1 = Math.max(0, hp1 - p2Damage)
    }

    results.push({
      round,
      shot1: { target: a1.target, hit: p1Hit, damage: Math.round(p1Damage), wasProtected: p2Protected },
      shot2: { target: a2.target, hit: p2Hit, damage: Math.round(p2Damage), wasProtected: p1Protected },
      hp1After: Math.round(hp1),
      hp2After: Math.round(hp2),
    })

    if (hp1 <= 0 || hp2 <= 0) break
  }

  return results
}

export function determineWinner(
  results: RoundResult[],
  p1Name: string,
  p2Name: string
): { winner: string | null; message: string } {
  const last = results[results.length - 1]
  if (last.hp1After === last.hp2After) return { winner: null, message: 'DRAW!' }
  if (last.hp1After > last.hp2After) return { winner: p1Name, message: `${p1Name} WON!` }
  return { winner: p2Name, message: `${p2Name} WON!` }
}
