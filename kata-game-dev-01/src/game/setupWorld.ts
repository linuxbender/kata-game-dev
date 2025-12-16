import { World, Entity } from '@engine/ECS'
import { COMPONENTS } from '@engine/constants'
import { createEnemyComponent, ENEMY_SPAWNS } from '@game/EnemyPresets'
import { Transform, Velocity, Renderable } from '@components'
import type { GlobalComponents, TypedWorld } from '@engine/componentTypes'

export type QuadConfig = { boundary: { x: number; y: number; w: number; h: number }; capacity?: number; maxDepth?: number; mergeThreshold?: number; rebalanceInterval?: number }

// Initialize a world with a player entity, NPCs, and an enemy AI.
// Returns the world, player entity and a recommended quadtree configuration.
export const createWorld = (): { world: TypedWorld; player: Entity; quadConfig: QuadConfig } => {
  const world = new World<GlobalComponents>()

  // Create player entity
  const player = world.createEntity()
  world.addComponent(player, COMPONENTS.TRANSFORM, { x: 0, y: 0 })
  world.addComponent(player, COMPONENTS.VELOCITY, { vx: 0, vy: 0 })
  world.addComponent(player, COMPONENTS.RENDERABLE, { color: '#4EE21E', size: 12 })

  // Populate world with enemies using presets
  for (const spawn of ENEMY_SPAWNS) {
    const enemy = world.createEntity()
    world.addComponent(enemy, COMPONENTS.TRANSFORM, { x: spawn.x, y: spawn.y })
    world.addComponent(enemy, COMPONENTS.VELOCITY, { vx: 0, vy: 0 })
    world.addComponent(enemy, COMPONENTS.RENDERABLE, { color: spawn.renderColor, size: spawn.renderSize })

    // Create enemy component using factory with preset
    const enemyComponent = createEnemyComponent(spawn.preset, player)
    enemyComponent.spawnX = spawn.x
    enemyComponent.spawnY = spawn.y
    world.addComponent(enemy, COMPONENTS.ENEMY, enemyComponent)
  }

  // Populate world with some NPCs
  for (let i = 0; i < 30; i++) {
    const e = world.createEntity()
    world.addComponent(e, COMPONENTS.TRANSFORM, { x: (Math.random() - 0.5) * 2000, y: (Math.random() - 0.5) * 2000 })
    world.addComponent(e, COMPONENTS.VELOCITY, { vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20 })
    world.addComponent(e, COMPONENTS.RENDERABLE, { color: '#E2A14E', size: 6 })
  }

  // Recommended QuadTree config (centered large bounds). Adjust these values as needed.
  const quadConfig: QuadConfig = {
    boundary: { x: -5000, y: -5000, w: 10000, h: 10000 },
    capacity: 8,
    maxDepth: 8,
    // QuadTree tuning options
    mergeThreshold: 0.25,
    rebalanceInterval: 256
  }

  return { world, player, quadConfig }
}
