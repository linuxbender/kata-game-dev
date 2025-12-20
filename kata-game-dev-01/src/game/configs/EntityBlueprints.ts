/**
 * Defines the structure of an entity blueprint.
 * A blueprint is a template used to create entities with predefined components.
 *
 * @example
 * ```ts
 * const playerBlueprint: EntityBlueprint = {
 *   id: 'player',
 *   name: 'Player Character',
 *   type: 'player',
 *   components: {
 *     transform: { x: 100, y: 100 },
 *     health: { current: 100, max: 100 }
 *   }
 * }
 * ```
 */
export interface EntityBlueprint {
  /** Unique identifier for this blueprint */
  id: string

  /** Human-readable name */
  name: string

  /** Entity classification */
  type: 'player' | 'enemy' | 'npc' | 'item' | 'projectile'

  /** Optional tags for categorization (e.g., 'boss', 'ranged', 'flying') */
  tags?: string[]

  /** Optional description */
  description?: string

  /** Component data keyed by component name */
  components: Record<string, any>
}

/**
 * PLAYER BLUEPRINTS
 */

/**
 * Default player blueprint.
 * Includes all base components needed for a playable character.
 *
 * Components:
 * - transform: Starting position
 * - velocity: Movement state
 * - collider: Collision boundaries
 * - renderable: Visual representation (blue circle)
 * - health: Player health
 * - inventory: Item storage
 * - equipment: Item slots
 * - stats: Level and progression
 *
 * @example
 * ```ts
 * const player = world.createEntity()
 * instantiateBlueprint(world, PLAYER_BLUEPRINT, player)
 * ```
 */
export const PLAYER_BLUEPRINT: EntityBlueprint = {
  id: 'player_default',
  name: 'Player',
  type: 'player',
  tags: ['player'],
  description: 'The main player character',
  components: {
    transform: {
      x: 200,
      y: 200,
      rotation: 0,
    },
    velocity: {
      vx: 0,
      vy: 0,
    },
    collider: {
      width: 20,
      height: 20,
      isTrigger: false,
      collisionGroup: 1,
      collisionMask: 0xffff,
    },
    renderable: {
      type: 'circle',
      color: '#0088ff',
      radius: 10,
      layer: 10,
    },
    health: {
      current: 100,
      max: 100,
      regeneration: 0.5,
    },
    inventory: {
      maxSlots: 20,
      items: [],
    },
    equipment: {
      slots: {
        mainHand: undefined,
        offHand: undefined,
      },
    },
    stats: {
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
    },
    metadata: {
      isPlayer: true,
    },
  },
}

/**
 * ENEMY BLUEPRINTS
 */

/**
 * Goblin Scout blueprint.
 * Small, fast enemy with low health.
 *
 * Components:
 * - transform: Spawn position
 * - velocity: Movement state
 * - collider: Small collision boundaries
 * - renderable: Green circle
 * - health: Low health (20 HP)
 * - damage: Low damage (5-7)
 * - ai: Aggressive behavior, medium range
 * - metadata: Marked as enemy
 *
 * @example
 * ```ts
 * const goblin = world.createEntity()
 * instantiateBlueprint(world, GOBLIN_BLUEPRINT, goblin)
 * ```
 */
export const GOBLIN_BLUEPRINT: EntityBlueprint = {
  id: 'goblin_scout',
  name: 'Goblin Scout',
  type: 'enemy',
  tags: ['melee', 'small'],
  description: 'A small goblin warrior',
  components: {
    transform: {
      x: 0,
      y: 0,
    },
    velocity: {
      vx: 0,
      vy: 0,
    },
    collider: {
      width: 15,
      height: 15,
    },
    renderable: {
      type: 'circle',
      color: '#00ff00',
      radius: 8,
      layer: 5,
    },
    health: {
      current: 20,
      max: 20,
    },
    damage: {
      baseValue: 5,
      variance: 2,
    },
    ai: {
      type: 'aggressive',
      detectionRange: 200,
      attackRange: 30,
      speed: 100,
    },
    metadata: {
      isEnemy: true,
    },
  },
}

/**
 * Orc Warrior blueprint.
 * Large, strong enemy with high health.
 *
 * Components:
 * - transform: Spawn position
 * - velocity: Movement state
 * - collider: Large collision boundaries
 * - renderable: Yellow-green circle, larger radius
 * - health: High health (60 HP)
 * - damage: High damage (12-16)
 * - ai: Aggressive behavior, long range
 * - metadata: Marked as enemy
 *
 * @example
 * ```ts
 * const orc = world.createEntity()
 * instantiateBlueprint(world, ORC_BLUEPRINT, orc)
 * ```
 */
export const ORC_BLUEPRINT: EntityBlueprint = {
  id: 'orc_warrior',
  name: 'Orc Warrior',
  type: 'enemy',
  tags: ['melee', 'heavy', 'boss'],
  description: 'A powerful orc with heavy armor',
  components: {
    transform: {
      x: 0,
      y: 0,
    },
    velocity: {
      vx: 0,
      vy: 0,
    },
    collider: {
      width: 25,
      height: 25,
    },
    renderable: {
      type: 'circle',
      color: '#88ff00',
      radius: 12,
      layer: 5,
    },
    health: {
      current: 60,
      max: 60,
    },
    damage: {
      baseValue: 12,
      variance: 4,
    },
    ai: {
      type: 'aggressive',
      detectionRange: 300,
      attackRange: 30,
      speed: 80,
    },
    metadata: {
      isEnemy: true,
    },
  },
}

/**
 * NPC BLUEPRINTS
 */

/**
 * Merchant John blueprint.
 * Friendly NPC that trades items.
 *
 * Components:
 * - transform: Spawn position
 * - renderable: Orange circle (distinguishable from enemies)
 * - health: Standard health (for safety)
 * - inventory: Pre-stocked with items
 * - metadata: Marked as NPC
 *
 * @example
 * ```ts
 * const merchant = world.createEntity()
 * instantiateBlueprint(world, MERCHANT_BLUEPRINT, merchant)
 * ```
 */
export const MERCHANT_BLUEPRINT: EntityBlueprint = {
  id: 'merchant_john',
  name: 'Merchant John',
  type: 'npc',
  tags: ['merchant'],
  description: 'A friendly merchant who trades items',
  components: {
    transform: {
      x: 0,
      y: 0,
    },
    renderable: {
      type: 'circle',
      color: '#ffaa00',
      radius: 10,
      layer: 5,
    },
    health: {
      current: 50,
      max: 50,
    },
    inventory: {
      maxSlots: 30,
      items: [
        { id: 'sword_iron', type: 'weapon', quantity: 1 },
        { id: 'potion_health', type: 'consumable', quantity: 5 },
      ],
    },
    metadata: {
      isNPC: true,
    },
  },
}

/**
 * ITEM BLUEPRINTS
 */

/**
 * Health Potion item blueprint.
 * Small consumable item that can be picked up.
 *
 * Components:
 * - transform: Spawn position
 * - collider: Trigger area (pick up when touched)
 * - renderable: Red circle (indicates healing)
 *
 * @example
 * ```ts
 * const potion = world.createEntity()
 * instantiateBlueprint(world, HEALTH_POTION_BLUEPRINT, potion)
 * ```
 */
export const HEALTH_POTION_BLUEPRINT: EntityBlueprint = {
  id: 'item_potion_health',
  name: 'Health Potion',
  type: 'item',
  description: 'Restores 25 HP when consumed',
  components: {
    transform: {
      x: 0,
      y: 0,
    },
    collider: {
      width: 8,
      height: 8,
      isTrigger: true,
    },
    renderable: {
      type: 'circle',
      color: '#ff0000',
      radius: 4,
      layer: 3,
    },
  },
}

/**
 * BLUEPRINT REGISTRY
 *
 * Central registry of all entity blueprints.
 * Use this to access blueprints by ID.
 *
 * @example
 * ```ts
 * const blueprint = ENTITY_BLUEPRINTS[PLAYER_BLUEPRINT.id]
 * // or
 * const blueprint = getBlueprintById('player_default')
 * ```
 */
export const ENTITY_BLUEPRINTS: Record<string, EntityBlueprint> = {
  // Players
  [PLAYER_BLUEPRINT.id]: PLAYER_BLUEPRINT,

  // Enemies
  [GOBLIN_BLUEPRINT.id]: GOBLIN_BLUEPRINT,
  [ORC_BLUEPRINT.id]: ORC_BLUEPRINT,

  // NPCs
  [MERCHANT_BLUEPRINT.id]: MERCHANT_BLUEPRINT,

  // Items
  [HEALTH_POTION_BLUEPRINT.id]: HEALTH_POTION_BLUEPRINT,
}

/**
 * Creates an entity blueprint with optional overrides.
 * Useful for creating variations of a blueprint without modifying the original.
 *
 * @param blueprint - Base blueprint to clone
 * @param overrides - Partial blueprint to override fields
 * @returns New blueprint with overrides applied
 *
 * @example
 * ```ts
 * // Create a player with custom starting position
 * const customPlayer = createEntityFromBlueprint(PLAYER_BLUEPRINT, {
 *   components: {
 *     transform: { x: 500, y: 500 }
 *   }
 * })
 *
 * // Create an enemy with more health
 * const toughGoblin = createEntityFromBlueprint(GOBLIN_BLUEPRINT, {
 *   components: {
 *     health: { current: 40, max: 40 }
 *   }
 * })
 * ```
 */
export function createEntityFromBlueprint(
  blueprint: EntityBlueprint,
  overrides?: Partial<EntityBlueprint>
): EntityBlueprint {
  return {
    ...blueprint,
    ...overrides,
    components: {
      ...blueprint.components,
      ...overrides?.components,
    },
  }
}

/**
 * Retrieves a blueprint by ID from the registry.
 * Returns undefined if blueprint doesn't exist.
 *
 * @param id - Blueprint ID to look up
 * @returns Blueprint if found, undefined otherwise
 *
 * @example
 * ```ts
 * const blueprint = getBlueprintById('player_default')
 * if (blueprint) {
 *   instantiateBlueprint(world, blueprint, entityId)
 * }
 * ```
 */
export function getBlueprintById(id: string): EntityBlueprint | undefined {
  return ENTITY_BLUEPRINTS[id]
}

/**
 * Validates that a blueprint has all required fields.
 * Useful for catching configuration errors.
 *
 * @param blueprint - Blueprint to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```ts
 * if (!isValidBlueprint(PLAYER_BLUEPRINT)) {
 *   throw new Error('Invalid player blueprint')
 * }
 * ```
 */
export function isValidBlueprint(blueprint: EntityBlueprint): boolean {
  // Check required fields exist and are not empty
  if (blueprint.id === undefined || blueprint.id === '') return false
  if (blueprint.name === undefined || blueprint.name === '') return false
  if (blueprint.type === undefined) return false
  if (blueprint.components === undefined) return false
  if (typeof blueprint.components !== 'object') return false

  // Check that components object is not empty
  return Object.keys(blueprint.components).length !== 0;


}

/**
 * Gets all blueprints of a specific type.
 * Useful for filtering blueprints by category.
 *
 * @param type - Entity type to filter by
 * @returns Array of blueprints matching the type
 *
 * @example
 * ```ts
 * const enemies = getBlueprintsByType('enemy')
 * const npcs = getBlueprintsByType('npc')
 * ```
 */
export function getBlueprintsByType(
  type: EntityBlueprint['type']
): EntityBlueprint[] {
  return Object.values(ENTITY_BLUEPRINTS).filter(bp => bp.type === type)
}

/**
 * Gets all blueprints with a specific tag.
 * Useful for filtering blueprints by category.
 *
 * @param tag - Tag to filter by
 * @returns Array of blueprints with the given tag
 *
 * @example
 * ```ts
 * const bosses = getBlueprintsByTag('boss')
 * const ranged = getBlueprintsByTag('ranged')
 * ```
 */
export function getBlueprintsByTag(tag: string): EntityBlueprint[] {
  return Object.values(ENTITY_BLUEPRINTS).filter(bp =>
    bp.tags?.includes(tag)
  )
}

