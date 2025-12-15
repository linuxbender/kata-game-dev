// Entity creation helpers - Demonstrate pattern for future components

import type { World, Entity } from '../engine/ECS'
import { COMPONENTS } from '../engine/constants'
import { PLAYER_CONFIG, NPC_CONFIG, createTransform, createVelocity, createRenderable } from './ComponentPresets'

// ==================== PLAYER FACTORY ====================

export const createPlayerEntity = (world: World): Entity => {
  const player = world.createEntity()

  world.addComponent(player, COMPONENTS.TRANSFORM, createTransform(
    PLAYER_CONFIG.spawnX,
    PLAYER_CONFIG.spawnY
  ))

  world.addComponent(player, COMPONENTS.VELOCITY, createVelocity())

  world.addComponent(player, COMPONENTS.RENDERABLE, createRenderable(
    PLAYER_CONFIG.renderColor,
    PLAYER_CONFIG.renderSize
  ))

  return player
}

// ==================== NPC FACTORY ====================

export const createNPCEntities = (world: World, count: number): Entity[] => {
  const npcs: Entity[] = []

  for (let i = 0; i < count; i++) {
    const npc = world.createEntity()

    // Random position in large area
    world.addComponent(npc, COMPONENTS.TRANSFORM, createTransform(
      (Math.random() - 0.5) * 2000,
      (Math.random() - 0.5) * 2000
    ))

    // Random velocity
    world.addComponent(npc, COMPONENTS.VELOCITY, createVelocity(
      (Math.random() - 0.5) * NPC_CONFIG.maxSpeed,
      (Math.random() - 0.5) * NPC_CONFIG.maxSpeed
    ))

    // Standard appearance
    world.addComponent(npc, COMPONENTS.RENDERABLE, createRenderable(
      NPC_CONFIG.renderColor,
      NPC_CONFIG.renderSize
    ))

    npcs.push(npc)
  }

  return npcs
}

// ==================== EXAMPLE: Future Component Type ====================

// When you need to add a new component type:
/*
1. Define the type in ComponentPresets.ts:
   export type HealthComponent = {
     readonly maxHealth: number
     readonly currentHealth: number
     readonly armor: number
   }

2. Create presets:
   export const HEALTH_PRESETS = {
     PLAYER: { maxHealth: 100, armor: 10 },
     GOBLIN: { maxHealth: 30, armor: 0 },
     OGRE: { maxHealth: 150, armor: 20 }
   }

3. Create factory:
   export const createHealthComponent = (preset: keyof typeof HEALTH_PRESETS) => ({
     maxHealth: HEALTH_PRESETS[preset].maxHealth,
     currentHealth: HEALTH_PRESETS[preset].maxHealth,
     armor: HEALTH_PRESETS[preset].armor
   })

4. Use in setupWorld.ts:
   const health = createHealthComponent('PLAYER')
   world.addComponent(player, 'Health', health)

That's it! No code duplication, fully maintainable.
*/

