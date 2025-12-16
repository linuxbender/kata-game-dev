import type { Point, Velocity } from '@components'

// ==================== PLAYER CONFIGURATION ====================

export type PlayerConfig = {
  readonly speed: number
  readonly renderColor: string
  readonly renderSize: number
  readonly spawnX: number
  readonly spawnY: number
}

export const PLAYER_CONFIG: PlayerConfig = {
  speed: 150,
  renderColor: '#4EE21E',
  renderSize: 12,
  spawnX: 0,
  spawnY: 0
} as const

// ==================== NPC CONFIGURATION ====================

export type NPCConfig = {
  readonly count: number
  readonly renderColor: string
  readonly renderSize: number
  readonly maxSpeed: number
}

export const NPC_CONFIG: NPCConfig = {
  count: 30,
  renderColor: '#E2A14E',
  renderSize: 6,
  maxSpeed: 20
} as const

// ==================== TRANSFORM COMPONENT FACTORY ====================

export type TransformData = Point

export const createTransform = (x: number, y: number): TransformData => ({ x, y })

export const createRandomTransform = (maxX: number, maxY: number): TransformData => ({
  x: (Math.random() - 0.5) * maxX,
  y: (Math.random() - 0.5) * maxY
})

// ==================== VELOCITY COMPONENT FACTORY ====================

export type VelocityData = Velocity

export const createVelocity = (vx: number = 0, vy: number = 0): VelocityData => ({ vx, vy })

export const createRandomVelocity = (maxSpeed: number): VelocityData => ({
  vx: (Math.random() - 0.5) * maxSpeed,
  vy: (Math.random() - 0.5) * maxSpeed
})

// ==================== RENDERABLE COMPONENT FACTORY ====================

export type RenderableData = { color: string; size: number }

export const createRenderable = (color: string, size: number): RenderableData => ({
  color,
  size
})

// ==================== GENERIC PRESET SYSTEM ====================

// Define how to extend this for other component types
export interface EntityPreset<T extends Record<string, unknown>> {
  readonly name: string
  readonly defaults: T
  readonly description?: string
}

// Example: Create typed presets for custom components
export const createPreset = <T extends Record<string, unknown>>(
  name: string,
  defaults: T,
  description?: string
): EntityPreset<T> => ({
  name,
  defaults,
  description
})

// Merge preset defaults with overrides
export const mergePreset = <T extends Record<string, unknown>>(
  preset: EntityPreset<T>,
  overrides: Partial<T>
): T => ({
  ...preset.defaults,
  ...overrides
})
