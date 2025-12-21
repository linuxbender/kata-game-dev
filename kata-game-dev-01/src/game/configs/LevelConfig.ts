/**
 * Level Configuration
 * 
 * Defines the structure for game levels including enemies, NPCs, and items.
 * Each level has spawn zones, entity definitions, and metadata.
 */

/**
 * Spawn zone definition for entities
 */
export interface SpawnZone {
  /** Minimum x coordinate */
  minX: number
  /** Maximum x coordinate */
  maxX: number
  /** Minimum y coordinate */
  minY: number
  /** Maximum y coordinate */
  maxY: number
}

/**
 * Enemy spawn definition
 */
export interface EnemySpawn {
  /** Blueprint ID from EntityBlueprints */
  blueprintId: 'goblin_scout' | 'orc_warrior'
  /** Number of enemies to spawn */
  count: number
  /** Spawn zones where enemies can appear */
  spawnZones: SpawnZone[]
}

/**
 * NPC spawn definition
 */
export interface NPCSpawn {
  /** Blueprint ID from EntityBlueprints */
  blueprintId: 'merchant_john'
  /** Exact spawn position */
  x: number
  y: number
}

/**
 * Item spawn definition
 */
export interface ItemSpawn {
  /** Blueprint ID from EntityBlueprints */
  blueprintId: 'item_potion_health'
  /** Number of items to spawn */
  count: number
  /** Spawn zones where items can appear */
  spawnZones: SpawnZone[]
}

/**
 * Level definition interface
 */
export interface LevelDefinition {
  /** Unique level ID */
  id: string
  /** Display name */
  name: string
  /** Description for UI */
  description: string
  /** Enemy spawn configurations */
  enemies: EnemySpawn[]
  /** NPC spawn configurations */
  npcs: NPCSpawn[]
  /** Item spawn configurations */
  items: ItemSpawn[]
  /** Camera bounds for this level */
  cameraBounds?: {
    x: number
    y: number
    width: number
    height: number
  }
  /** Background color or theme */
  theme?: {
    backgroundColor?: string
  }
}

/**
 * Level 1: Forest
 * 
 * Starting level with light enemy presence.
 * Goblins scattered in the forest, a merchant in the center.
 */
export const LEVEL_1_FOREST: LevelDefinition = {
  id: 'level_1_forest',
  name: 'Forest Clearing',
  description: 'A peaceful forest with scattered goblin scouts',
  enemies: [
    {
      blueprintId: 'goblin_scout',
      count: 5,
      spawnZones: [
        { minX: 200, maxX: 500, minY: 200, maxY: 400 },
        { minX: 700, maxX: 900, minY: 300, maxY: 500 }
      ]
    }
  ],
  npcs: [
    {
      blueprintId: 'merchant_john',
      x: 600,
      y: 500
    }
  ],
  items: [
    {
      blueprintId: 'item_potion_health',
      count: 3,
      spawnZones: [
        { minX: 300, maxX: 900, minY: 300, maxY: 700 }
      ]
    }
  ],
  cameraBounds: {
    x: 0,
    y: 0,
    width: 1200,
    height: 1000
  },
  theme: {
    backgroundColor: '#2d4a2b'
  }
}

/**
 * Level 2: Cave
 * 
 * Darker level with more challenging enemies.
 * Mix of goblins and orcs in tight spaces.
 */
export const LEVEL_2_CAVE: LevelDefinition = {
  id: 'level_2_cave',
  name: 'Dark Cave',
  description: 'A dangerous cave filled with goblins and orcs',
  enemies: [
    {
      blueprintId: 'goblin_scout',
      count: 4,
      spawnZones: [
        { minX: 150, maxX: 400, minY: 150, maxY: 350 }
      ]
    },
    {
      blueprintId: 'orc_warrior',
      count: 3,
      spawnZones: [
        { minX: 500, maxX: 850, minY: 200, maxY: 600 },
        { minX: 300, maxX: 600, minY: 600, maxY: 850 }
      ]
    }
  ],
  npcs: [],
  items: [
    {
      blueprintId: 'item_potion_health',
      count: 5,
      spawnZones: [
        { minX: 200, maxX: 800, minY: 200, maxY: 800 }
      ]
    }
  ],
  cameraBounds: {
    x: 0,
    y: 0,
    width: 1000,
    height: 1000
  },
  theme: {
    backgroundColor: '#1a1a2e'
  }
}

/**
 * Level 3: Orc Fortress
 * 
 * Final challenging level with heavy orc presence.
 * Boss-like encounters in a fortified area.
 */
export const LEVEL_3_FORTRESS: LevelDefinition = {
  id: 'level_3_fortress',
  name: 'Orc Fortress',
  description: 'A heavily fortified orc stronghold',
  enemies: [
    {
      blueprintId: 'goblin_scout',
      count: 3,
      spawnZones: [
        { minX: 200, maxX: 400, minY: 200, maxY: 400 }
      ]
    },
    {
      blueprintId: 'orc_warrior',
      count: 6,
      spawnZones: [
        { minX: 400, maxX: 800, minY: 300, maxY: 700 },
        { minX: 600, maxX: 1000, minY: 500, maxY: 900 }
      ]
    }
  ],
  npcs: [],
  items: [
    {
      blueprintId: 'item_potion_health',
      count: 4,
      spawnZones: [
        { minX: 300, maxX: 900, minY: 300, maxY: 900 }
      ]
    }
  ],
  cameraBounds: {
    x: 0,
    y: 0,
    width: 1200,
    height: 1200
  },
  theme: {
    backgroundColor: '#3d2817'
  }
}

/**
 * LEVELS Registry
 * 
 * Central registry of all game levels.
 * Access levels by ID.
 * 
 * @example
 * ```ts
 * const level = LEVELS['level_1_forest']
 * // or
 * const level = getLevelById('level_1_forest')
 * ```
 */
export const LEVELS: Record<string, LevelDefinition> = {
  [LEVEL_1_FOREST.id]: LEVEL_1_FOREST,
  [LEVEL_2_CAVE.id]: LEVEL_2_CAVE,
  [LEVEL_3_FORTRESS.id]: LEVEL_3_FORTRESS
}

/**
 * Get level by ID
 * 
 * @param id - Level ID to look up
 * @returns Level definition if found, undefined otherwise
 * 
 * @example
 * ```ts
 * const level = getLevelById('level_1_forest')
 * if (level) {
 *   console.log(level.name) // 'Forest Clearing'
 * }
 * ```
 */
export const getLevelById = (id: string): LevelDefinition | undefined => {
  return LEVELS[id]
}

/**
 * Get all level IDs
 * 
 * @returns Array of all level IDs
 * 
 * @example
 * ```ts
 * const ids = getAllLevelIds()
 * // ['level_1_forest', 'level_2_cave', 'level_3_fortress']
 * ```
 */
export const getAllLevelIds = (): string[] => {
  return Object.keys(LEVELS)
}

/**
 * Validate level definition
 * 
 * @param level - Level to validate
 * @returns true if valid, false otherwise
 * 
 * @example
 * ```ts
 * if (!isValidLevel(LEVEL_1_FOREST)) {
 *   throw new Error('Invalid level definition')
 * }
 * ```
 */
export const isValidLevel = (level: LevelDefinition): boolean => {
  if (!level.id || !level.name || !level.description) return false
  if (!Array.isArray(level.enemies)) return false
  if (!Array.isArray(level.npcs)) return false
  if (!Array.isArray(level.items)) return false
  return true
}
