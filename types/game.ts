export type GamePhase = 'waiting' | 'attributes' | 'actions' | 'resolution' | 'finished'

export type Target = 'head' | 'left_shoulder' | 'right_shoulder' | 'left_arm' | 'right_arm'
export type Dodge = 'still' | 'dodge_right' | 'dodge_left' | 'duck'

export interface Attributes {
  precision: number
  damage: number
  reflexes: number
  resistance: number
}

export interface ActionBlock {
  target: Target
  dodge: Dodge
}

export interface ShotResult {
  target: Target
  hit: boolean
  damage: number
  wasProtected: boolean
}

export interface RoundResult {
  round: number
  shot1: ShotResult // player1 shooting at player2
  shot2: ShotResult // player2 shooting at player1
  hp1After: number
  hp2After: number
}

export interface Player {
  id: string
  nickname: string
  isHost: boolean
  attributes?: Attributes
  actions?: ActionBlock[]
  ready: boolean
}

export interface RoomState {
  id: string
  phase: GamePhase
  player1?: Player
  player2?: Player
  results?: RoundResult[]
}
