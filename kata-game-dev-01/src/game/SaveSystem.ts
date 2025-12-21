/**
 * Save System
 * 
 * Manages game state serialization and persistence to localStorage.
 * Supports multiple save slots with timestamps and version tracking.
 */

import type { ReactiveWorld } from '@engine/ReactiveWorld'
import type { Entity } from '@engine/ECS'
import { COMPONENTS } from '@engine/constants'
import { stringifyWithUndefined, parseWithUndefined } from '@engine/utils/serialization'

/**
 * Maximum number of save slots supported
 */
export const MAX_SAVE_SLOTS = 10

/**
 * Save system version for compatibility checking
 */
export const SAVE_VERSION = '1.0.0'

/**
 * LocalStorage key prefix for save slots
 */
const SAVE_KEY_PREFIX = 'kata_game_save_slot_'

/**
 * Serialized entity data
 */
export interface SerializedEntity {
  /** Entity ID */
  id: Entity
  /** Component name to component data map */
  components: Record<string, unknown>
}

/**
 * Player-specific data to save
 */
export interface PlayerData {
  /** Player entity ID */
  entityId: Entity
  /** Player position */
  position?: { x: number; y: number }
  /** Player health */
  health?: { current: number; max: number }
  /** Player inventory */
  inventory?: unknown[]
  /** Player equipment */
  equipment?: unknown
  /** Player stats */
  stats?: unknown
}

/**
 * Complete world state snapshot
 */
export interface WorldState {
  /** All entities in the world */
  entities: SerializedEntity[]
  /** World elapsed time */
  elapsedTime: number
}

/**
 * Complete game save data
 */
export interface GameSave {
  /** Save format version */
  version: string
  /** Timestamp when save was created */
  timestamp: number
  /** Current level ID */
  levelId: string
  /** Player-specific data */
  playerData: PlayerData
  /** Complete world state */
  worldState: WorldState
  /** Optional save slot name/description */
  slotName?: string
}

/**
 * Save slot metadata (minimal info for displaying save list)
 */
export interface SaveSlotInfo {
  /** Slot number */
  slot: number
  /** Timestamp */
  timestamp: number
  /** Level name/ID */
  levelId: string
  /** Optional slot name */
  slotName?: string
  /** Save version */
  version: string
}

/**
 * Serialize entity with all its components
 * 
 * @param world - Game world
 * @param entityId - Entity to serialize
 * @returns Serialized entity data
 */
const serializeEntity = (world: ReactiveWorld, entityId: Entity): SerializedEntity => {
  const components: Record<string, unknown> = {}
  
  // Serialize all known components
  const componentKeys = Object.values(COMPONENTS)
  for (const key of componentKeys) {
    const component = world.getComponent(entityId, key as any)
    if (component !== undefined) {
      components[key] = component
    }
  }
  
  return {
    id: entityId,
    components
  }
}

/**
 * Deserialize entity and restore its components
 * 
 * @param world - Game world
 * @param serialized - Serialized entity data
 * @returns Restored entity ID
 */
const deserializeEntity = (world: ReactiveWorld, serialized: SerializedEntity): Entity => {
  // Note: We assume entity IDs are preserved during save/load
  // In a more complex system, you might need to create new entities
  // and maintain an ID mapping
  const entityId = serialized.id
  
  // Restore all components
  for (const [componentKey, componentData] of Object.entries(serialized.components)) {
    world.addComponent(entityId, componentKey as any, componentData)
  }
  
  return entityId
}

/**
 * Save game state to a specific slot
 * 
 * @param world - Game world
 * @param playerId - Player entity ID
 * @param levelId - Current level ID
 * @param slotNumber - Save slot number (0-9)
 * @param slotName - Optional slot name/description
 * @returns true if save succeeded, false otherwise
 * 
 * @example
 * ```ts
 * const success = saveGame(world, playerId, 'level_1_forest', 0, 'My Save')
 * if (success) {
 *   console.log('Game saved!')
 * }
 * ```
 */
export const saveGame = (
  world: ReactiveWorld,
  playerId: Entity,
  levelId: string,
  slotNumber: number,
  slotName?: string
): boolean => {
  try {
    if (slotNumber < 0 || slotNumber >= MAX_SAVE_SLOTS) {
      console.error(`[SaveSystem] Invalid slot number: ${slotNumber}`)
      return false
    }
    
    // Collect player data
    const playerTransform = world.getComponent(playerId, COMPONENTS.TRANSFORM)
    const playerHealth = world.getComponent(playerId, COMPONENTS.HEALTH)
    const playerInventory = world.getComponent(playerId, COMPONENTS.INVENTORY)
    const playerEquipment = world.getComponent(playerId, COMPONENTS.EQUIPMENT)
    const playerStats = world.getComponent(playerId, COMPONENTS.CHARACTER_STATS)
    
    const playerData: PlayerData = {
      entityId: playerId,
      position: playerTransform ? { x: playerTransform.x, y: playerTransform.y } : undefined,
      health: playerHealth ? { current: playerHealth.current, max: playerHealth.max } : undefined,
      inventory: playerInventory as unknown[],
      equipment: playerEquipment,
      stats: playerStats
    }
    
    // Collect all entities and their components
    // We'll query all entities by checking for any component
    const allEntitiesSet = new Set<Entity>()
    const componentKeys = Object.values(COMPONENTS)
    for (const key of componentKeys) {
      const entities = world.query(key as any)
      for (const { entity } of entities) {
        allEntitiesSet.add(entity)
      }
    }
    
    const entities: SerializedEntity[] = []
    for (const entityId of allEntitiesSet) {
      entities.push(serializeEntity(world, entityId))
    }
    
    const worldState: WorldState = {
      entities,
      elapsedTime: world.getTime()
    }
    
    const gameSave: GameSave = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      levelId,
      playerData,
      worldState,
      slotName
    }
    
    // Serialize and save to localStorage
    const key = SAVE_KEY_PREFIX + slotNumber
    const serialized = stringifyWithUndefined(gameSave)
    localStorage.setItem(key, serialized)
    
    console.log(`[SaveSystem] Game saved to slot ${slotNumber}`)
    return true
  } catch (error) {
    console.error('[SaveSystem] Save failed:', error)
    return false
  }
}

/**
 * Load game state from a specific slot
 * 
 * @param world - Game world (will be cleared and restored)
 * @param slotNumber - Save slot number (0-9)
 * @returns Loaded game save data, or null if load failed
 * 
 * @example
 * ```ts
 * const saveData = loadGame(world, 0)
 * if (saveData) {
 *   console.log('Game loaded from slot 0')
 *   console.log('Level:', saveData.levelId)
 * }
 * ```
 */
export const loadGame = (
  world: ReactiveWorld,
  slotNumber: number
): GameSave | null => {
  try {
    if (slotNumber < 0 || slotNumber >= MAX_SAVE_SLOTS) {
      console.error(`[SaveSystem] Invalid slot number: ${slotNumber}`)
      return null
    }
    
    const key = SAVE_KEY_PREFIX + slotNumber
    const serialized = localStorage.getItem(key)
    if (!serialized) {
      console.warn(`[SaveSystem] No save data in slot ${slotNumber}`)
      return null
    }
    
    const gameSave = parseWithUndefined<GameSave>(serialized)
    
    // Version check
    if (gameSave.version !== SAVE_VERSION) {
      console.warn(`[SaveSystem] Save version mismatch: ${gameSave.version} vs ${SAVE_VERSION}`)
      // Could implement migration here if needed
    }
    
    // Clear existing world state
    // Note: World doesn't have a clear method, so we'll need to work with what we have
    // In practice, the caller should handle creating a fresh world or clearing state
    
    // Restore world time
    const timeDiff = gameSave.worldState.elapsedTime - world.getTime()
    if (timeDiff !== 0) {
      world.updateTime(timeDiff)
    }
    
    // Restore all entities
    for (const serializedEntity of gameSave.worldState.entities) {
      deserializeEntity(world, serializedEntity)
    }
    
    console.log(`[SaveSystem] Game loaded from slot ${slotNumber}`)
    return gameSave
  } catch (error) {
    console.error('[SaveSystem] Load failed:', error)
    return null
  }
}

/**
 * Delete a save slot
 * 
 * @param slotNumber - Save slot number (0-9)
 * @returns true if delete succeeded, false otherwise
 * 
 * @example
 * ```ts
 * deleteSave(0) // Delete save in slot 0
 * ```
 */
export const deleteSave = (slotNumber: number): boolean => {
  try {
    if (slotNumber < 0 || slotNumber >= MAX_SAVE_SLOTS) {
      console.error(`[SaveSystem] Invalid slot number: ${slotNumber}`)
      return false
    }
    
    const key = SAVE_KEY_PREFIX + slotNumber
    localStorage.removeItem(key)
    console.log(`[SaveSystem] Deleted save slot ${slotNumber}`)
    return true
  } catch (error) {
    console.error('[SaveSystem] Delete failed:', error)
    return false
  }
}

/**
 * Get metadata for all save slots
 * 
 * @returns Array of save slot info (empty for unused slots)
 * 
 * @example
 * ```ts
 * const slots = getAllSaveSlots()
 * console.log('Available saves:', slots.filter(s => s !== null))
 * ```
 */
export const getAllSaveSlots = (): (SaveSlotInfo | null)[] => {
  const slots: (SaveSlotInfo | null)[] = []
  
  for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
    const key = SAVE_KEY_PREFIX + i
    const serialized = localStorage.getItem(key)
    
    if (serialized) {
      try {
        const gameSave = parseWithUndefined<GameSave>(serialized)
        slots.push({
          slot: i,
          timestamp: gameSave.timestamp,
          levelId: gameSave.levelId,
          slotName: gameSave.slotName,
          version: gameSave.version
        })
      } catch (error) {
        console.error(`[SaveSystem] Failed to parse slot ${i}:`, error)
        slots.push(null)
      }
    } else {
      slots.push(null)
    }
  }
  
  return slots
}

/**
 * Check if a save slot has data
 * 
 * @param slotNumber - Save slot number (0-9)
 * @returns true if slot has save data, false otherwise
 * 
 * @example
 * ```ts
 * if (hasSave(0)) {
 *   console.log('Slot 0 has a save')
 * }
 * ```
 */
export const hasSave = (slotNumber: number): boolean => {
  if (slotNumber < 0 || slotNumber >= MAX_SAVE_SLOTS) {
    return false
  }
  
  const key = SAVE_KEY_PREFIX + slotNumber
  return localStorage.getItem(key) !== null
}

export default {
  saveGame,
  loadGame,
  deleteSave,
  getAllSaveSlots,
  hasSave,
  MAX_SAVE_SLOTS,
  SAVE_VERSION
}
