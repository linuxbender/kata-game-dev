// Enemy presets and factory - Centralized, maintainable entity configuration
// Follows DRY, SOLID, and Factory Pattern principles

import type { Entity } from '@engine/ECS'
import type { EnemyComponent } from '@components'

// Define reusable enemy archetypes/presets
// Excludes spawn position (x,y) which is defined per instance in ENEMY_SPAWNS
export type EnemyPreset = Readonly<Omit<EnemyComponent, 'targetEntity' | 'lastAttackTime' | 'patrolAngle' | 'isReturning' | 'spawnX' | 'spawnY'>>

// Enemy presets - easy to extend with new enemy types
export const ENEMY_PRESETS = {
  // Standard aggressive enemy
  GOBLIN: {
    attackRange: 50,
    attackDamage: 10,
    attackCooldown: 0.5,
    speed: 80,
    detectionRange: 200,
    patrolRadius: 50,
    patrolSpeed: 20
  } as const satisfies EnemyPreset,

  // Fast but weak ranged attacker
  ARCHER: {
    attackRange: 150,      // Longer range
    attackDamage: 7,       // Lower damage
    attackCooldown: 1.0,   // Slower attack rate
    speed: 100,            // Faster movement
    detectionRange: 250,   // Better vision
    patrolRadius: 75,      // Larger patrol area
    patrolSpeed: 30
  } as const satisfies EnemyPreset,

  // Slow heavy tank
  OGRE: {
    attackRange: 60,
    attackDamage: 25,      // High damage
    attackCooldown: 1.5,   // Slow attack
    speed: 50,             // Slow movement
    detectionRange: 150,   // Poor vision
    patrolRadius: 30,      // Small patrol area
    patrolSpeed: 10
  } as const satisfies EnemyPreset,

  // Stealthy scout
  ROGUE: {
    attackRange: 40,
    attackDamage: 15,
    attackCooldown: 0.3,   // Fast attacks
    speed: 120,            // Very fast
    detectionRange: 100,   // Short detection
    patrolRadius: 100,     // Large patrol
    patrolSpeed: 40
  } as const satisfies EnemyPreset
} as const

// Enemy spawn configuration - position + preset
export type EnemySpawn = {
  readonly x: number
  readonly y: number
  readonly preset: keyof typeof ENEMY_PRESETS
  readonly renderColor: string
  readonly renderSize: number
}

// Factory function to create enemy data with full defaults
export const createEnemyComponent = (
  preset: keyof typeof ENEMY_PRESETS,
  targetEntity: Entity | undefined
): EnemyComponent => {
  const presetData = ENEMY_PRESETS[preset]

  return {
    targetEntity,
    attackRange: presetData.attackRange,
    attackDamage: presetData.attackDamage,
    attackCooldown: presetData.attackCooldown,
    lastAttackTime: 0,  // Always initialize to 0
    speed: presetData.speed,
    detectionRange: presetData.detectionRange,
    spawnX: 0,          // Will be set by caller
    spawnY: 0,          // Will be set by caller
    isReturning: false, // Always initialize to false
    patrolRadius: presetData.patrolRadius,
    patrolAngle: 0,     // Always initialize to 0
    patrolSpeed: presetData.patrolSpeed
  }
}

// Get render config for enemy preset
export const getEnemyRenderConfig = (preset: keyof typeof ENEMY_PRESETS) => {
  const configs: Record<keyof typeof ENEMY_PRESETS, { color: string; size: number }> = {
    GOBLIN: { color: '#FF0000', size: 10 },   // Red
    ARCHER: { color: '#FF6600', size: 9 },    // Orange
    OGRE: { color: '#990000', size: 14 },     // Dark red, bigger
    ROGUE: { color: '#660066', size: 8 }      // Purple, smaller
  }
  return configs[preset]
}

// List of enemies to spawn in the world
export const ENEMY_SPAWNS: readonly EnemySpawn[] = [
  {
    x: 200,
    y: 0,
    preset: 'GOBLIN',
    renderColor: '#FF0000',
    renderSize: 10
  },
  {
    x: -300,
    y: 150,
    preset: 'ARCHER',
    renderColor: '#FF6600',
    renderSize: 9
  },
  {
    x: 100,
    y: -250,
    preset: 'OGRE',
    renderColor: '#990000',
    renderSize: 14
  },
  {
    x: -400,
    y: -200,
    preset: 'ROGUE',
    renderColor: '#660066',
    renderSize: 8
  }
] as const
