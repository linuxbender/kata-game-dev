import { World, Entity } from '@engine/ECS'
import { COMPONENTS } from '@engine/constants'
import {
  PLAYER_BLUEPRINT,
  GOBLIN_BLUEPRINT,
  ORC_BLUEPRINT,
  MERCHANT_BLUEPRINT,
  createEntityFromBlueprint,
  type EntityBlueprint,
} from '@game/configs/EntityBlueprints'
import { createItemInstance } from './configs/ItemConfig'

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
  world: World,
  blueprint: EntityBlueprint,
  entityId: Entity
): void {
  // Helper: map blueprint key (e.g. 'transform') to canonical runtime key from COMPONENTS (e.g. 'Transform')
  const mapKey = (k: string) => {
    const lower = k.toLowerCase()
    const match = Object.values(COMPONENTS).find((v) => String(v).toLowerCase() === lower)
    return match ?? k
  }

  // Register all components from blueprint
  Object.entries(blueprint.components).forEach(([componentKey, componentData]) => {
    // Skip undefined components
    if (componentData === undefined) return

    // Map to canonical component key used by the ECS
    const key = mapKey(componentKey)
    world.addComponent(entityId, key as any, componentData)
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
 * @param worldInstance - Optional world instance to use (defaults to new World)
 * @returns Object containing initialized world, player entity, and QuadTree config
 *
 * @example
 * ```ts
 * // Create new world
 * const { world, player, quadConfig } = createWorld()
 *
 * // Use existing world instance
 * const reactiveWorld = new ReactiveWorld()
 * const { world, player, quadConfig } = createWorld(reactiveWorld)
 * ```
 */
export const createWorld = (worldInstance?: World): {
  world: World
  player: Entity
  quadConfig: QuadConfig
} => {
  const world = worldInstance || new World()

  // 1. Create and setup player
  const player = world.createEntity()
  instantiateBlueprint(world, PLAYER_BLUEPRINT, player)
  // Füge Iron Sword ins Inventory hinzu
  let inventory = world.getComponent(player, COMPONENTS.INVENTORY)
  if (!Array.isArray(inventory)) inventory = []
  const sword = createItemInstance('sword_iron', 1)
  inventory.push(sword)
  world.addComponent(player, COMPONENTS.INVENTORY, inventory)
  // Rüste das Schwert im mainHand aus
  world.addComponent(player, COMPONENTS.EQUIPMENT, { slots: { mainHand: sword.uid } })

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
