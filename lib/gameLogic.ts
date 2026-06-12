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

// Full protection: −20 hit chance + ×0.5 damage
const DODGE_FULL_PROTECTIONS: Record<Dodge, Target[]> = {
  still:       [],
  dodge_right: ['left_shoulder', 'left_arm'],
  dodge_left:  ['right_shoulder', 'right_arm'],
  duck:        ['head', 'left_shoulder', 'right_shoulder'],
}

// Partial protection: −10 hit chance only (no damage reduction)
const DODGE_PARTIAL_PROTECTIONS: Record<Dodge, Target[]> = {
  still:       [],
  dodge_right: ['head'],
  dodge_left:  ['head'],
  duck:        [],
}

const ARM_TARGETS: Target[] = ['left_arm', 'right_arm']

function calcHitChance(shooterPrecision: number, targetReflexes: number): number {
  const chance = 50 + shooterPrecision * 5 - targetReflexes * 5
  return Math.min(95, Math.max(10, chance))
}

function calcDamage(
  baseDamage: number,
  shooterDamage: number,
  targetResistance: number,
  isFullyProtected: boolean,
  isPartiallyProtected: boolean
): number {
  const base = isFullyProtected ? baseDamage * 0.5 : isPartiallyProtected ? baseDamage * 0.85 : baseDamage
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
  // Precision debuffs from arm hits — accumulate permanently
  let p1PrecisionPenalty = 0
  let p2PrecisionPenalty = 0
  const results: RoundResult[] = []

  for (let round = 1; round <= 8; round++) {
    const a1 = actionForRound(p1Actions, round)
    const a2 = actionForRound(p2Actions, round)

    // — p1 shoots p2 —
    const p2FullProtected    = DODGE_FULL_PROTECTIONS[a2.dodge].includes(a1.target)
    const p2PartialProtected = DODGE_PARTIAL_PROTECTIONS[a2.dodge].includes(a1.target)

    // Still: +3 precision; Duck: −3 precision
    const p1DodgeBonus = a1.dodge === 'still' ? 3 : 0
    const p1EffPrecision = Math.max(0, p1Attrs.precision + p1DodgeBonus - p1PrecisionPenalty)

    const p1BaseChance = calcHitChance(p1EffPrecision, p2Attrs.reflexes)
    const p1HitChance = p2FullProtected    ? Math.max(10, p1BaseChance - 20)
                      : p2PartialProtected ? Math.max(10, p1BaseChance - 15)
                      : p1BaseChance
    const p1Hit = Math.random() * 100 < p1HitChance

    let p1Damage = 0
    let p1CausedDebuff = false
    if (p1Hit) {
      p1Damage = calcDamage(TARGET_DAMAGE[a1.target], p1Attrs.damage, p2Attrs.resistance, p2FullProtected, p2PartialProtected)
      hp2 = Math.max(0, hp2 - p1Damage)
      if (ARM_TARGETS.includes(a1.target)) {
        p2PrecisionPenalty += 1
        p1CausedDebuff = true
      }
    }

    // — p2 shoots p1 —
    const p1FullProtected    = DODGE_FULL_PROTECTIONS[a1.dodge].includes(a2.target)
    const p1PartialProtected = DODGE_PARTIAL_PROTECTIONS[a1.dodge].includes(a2.target)

    const p2DodgeBonus = a2.dodge === 'still' ? 3 : 0
    const p2EffPrecision = Math.max(0, p2Attrs.precision + p2DodgeBonus - p2PrecisionPenalty)

    const p2BaseChance = calcHitChance(p2EffPrecision, p1Attrs.reflexes)
    const p2HitChance = p1FullProtected    ? Math.max(10, p2BaseChance - 20)
                      : p1PartialProtected ? Math.max(10, p2BaseChance - 15)
                      : p2BaseChance
    const p2Hit = Math.random() * 100 < p2HitChance

    let p2Damage = 0
    let p2CausedDebuff = false
    if (p2Hit) {
      p2Damage = calcDamage(TARGET_DAMAGE[a2.target], p2Attrs.damage, p1Attrs.resistance, p1FullProtected, p1PartialProtected)
      hp1 = Math.max(0, hp1 - p2Damage)
      if (ARM_TARGETS.includes(a2.target)) {
        p1PrecisionPenalty += 1
        p2CausedDebuff = true
      }
    }

    results.push({
      round,
      shot1: {
        target: a1.target,
        hit: p1Hit,
        damage: Math.round(p1Damage),
        wasProtected: p2FullProtected,
        wasPartial: p2PartialProtected,
        causedArmDebuff: p1CausedDebuff,
      },
      shot2: {
        target: a2.target,
        hit: p2Hit,
        damage: Math.round(p2Damage),
        wasProtected: p1FullProtected,
        wasPartial: p1PartialProtected,
        causedArmDebuff: p2CausedDebuff,
      },
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
