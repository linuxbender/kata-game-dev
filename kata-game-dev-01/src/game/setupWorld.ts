import { World, Entity } from '@engine/ECS'
import type { GlobalComponents, TypedWorld } from '@engine/componentTypes'
import {
  PLAYER_BLUEPRINT,
  GOBLIN_BLUEPRINT,
  ORC_BLUEPRINT,
  MERCHANT_BLUEPRINT,
  createEntityFromBlueprint,
  type EntityBlueprint,
} from '@game/configs/EntityBlueprints'

/**
 * QuadTree configuration type.
 * Defines spatial partitioning settings for the game world.
 */
export type QuadConfig = {
  /** World boundary rectangle */
  boundary: { x: number; y: number; w: number; h: number }
  /** Maximum entities per node before split */
  capacity?: number
  /** Maximum tree depth */
  maxDepth?: number
  /** Threshold for merging underutilized nodes (0-1) */
  mergeThreshold?: number
  /** Interval for rebalancing tree */
  rebalanceInterval?: number
}

/**
 * Instantiates an entity from a blueprint.
 * Registers all components from the blueprint to the entity.
 *
 * Components without a value (undefined) are skipped,
 * allowing for flexible blueprint composition.
 *
 * @param world - Game world instance
 * @param blueprint - Entity blueprint template
 * @param entityId - Entity ID to initialize
 *
 * @example
 * ```ts
 * const player = world.createEntity()
 * instantiateBlueprint(world, PLAYER_BLUEPRINT, player)
 *
 * // With overrides
 * const customPlayer = createEntityFromBlueprint(PLAYER_BLUEPRINT, {
 *   components: { transform: { x: 500, y: 500 } }
 * })
 * instantiateBlueprint(world, customPlayer, player)
 * ```
 */
function instantiateBlueprint(
  world: World<GlobalComponents>,
  blueprint: EntityBlueprint,
  entityId: Entity
): void {
  // Register all components from blueprint
  Object.entries(blueprint.components).forEach(([componentKey, componentData]) => {
    // Skip undefined components
    if (componentData === undefined) return

    // Map component key to COMPONENTS enum value
    // Using type assertion since component keys are strings at runtime
    const key = componentKey as any
    world.addComponent(entityId, key, componentData)
  })
}

/**
 * Configuration for enemy spawning.
 * Defines where and what enemies should spawn in the world.
 */
interface EnemySpawnConfig {
  blueprintId: 'goblin_scout' | 'orc_warrior'
  x: number
  y: number
}

/**
 * Default enemy spawn locations.
 * Goblins in the upper-left, Orcs scattered throughout.
 */
const ENEMY_SPAWNS: EnemySpawnConfig[] = [
  // Goblin cluster (upper left)
  { blueprintId: 'goblin_scout', x: 300, y: 300 },
  { blueprintId: 'goblin_scout', x: 350, y: 250 },
  { blueprintId: 'goblin_scout', x: 400, y: 350 },
  // Orc outposts (spread throughout)
  { blueprintId: 'orc_warrior', x: 800, y: 200 },
  { blueprintId: 'orc_warrior', x: 1000, y: 600 },
  { blueprintId: 'orc_warrior', x: 500, y: 900 },
]

/**
 * Configuration for NPC spawning.
 * Defines where NPCs should spawn in the world.
 */
interface NPCSpawnConfig {
  blueprintId: 'merchant_john'
  x: number
  y: number
}

/**
 * Default NPC spawn locations.
 * Merchant in central hub.
 */
const NPC_SPAWNS: NPCSpawnConfig[] = [
  { blueprintId: 'merchant_john', x: 600, y: 500 },
]

/**
 * Creates and initializes a game world with entities.
 *
 * Sets up:
 * - Player entity with all components from PLAYER_BLUEPRINT
 * - Enemy entities spawned at predefined locations
 * - NPC entities for interaction
 * - Recommended QuadTree configuration
 *
 * @returns Object containing initialized world, player entity, and QuadTree config
 *
 * @example
 * ```ts
 * const { world, player, quadConfig } = createWorld()
 *
 * // Player is now ready to control
 * // Enemies are spawned and positioned
 * // NPCs are placed for interaction
 * ```
 */
export const createWorld = (): {
  world: TypedWorld
  player: Entity
  quadConfig: QuadConfig
} => {
  const world = new World<GlobalComponents>()

  // 1. Create and setup player
  const player = world.createEntity()
  instantiateBlueprint(world, PLAYER_BLUEPRINT, player)

  // 2. Spawn enemies at predefined locations
  for (const spawn of ENEMY_SPAWNS) {
    const enemy = world.createEntity()

    // Select blueprint based on enemy type
    const blueprint =
      spawn.blueprintId === 'goblin_scout' ? GOBLIN_BLUEPRINT : ORC_BLUEPRINT

    // Create blueprint with position override
    const customEnemy = createEntityFromBlueprint(blueprint, {
      components: {
        transform: { x: spawn.x, y: spawn.y },
      },
    })

    instantiateBlueprint(world, customEnemy, enemy)
  }

  // 3. Spawn NPCs at predefined locations
  for (const spawn of NPC_SPAWNS) {
    const npc = world.createEntity()

    // Currently only merchant, but extensible for more NPC types
    // Create blueprint with position override
    const customNPC = createEntityFromBlueprint(MERCHANT_BLUEPRINT, {
      components: {
        transform: { x: spawn.x, y: spawn.y },
      },
    })

    instantiateBlueprint(world, customNPC, npc)
  }

  // 4. Recommended QuadTree config for world bounds
  // Centered at origin with 10000x10000 world size
  const quadConfig: QuadConfig = {
    boundary: { x: -5000, y: -5000, w: 10000, h: 10000 },
    capacity: 8,
    maxDepth: 8,
    mergeThreshold: 0.25,
    rebalanceInterval: 256,
  }

  return { world, player, quadConfig }
}
