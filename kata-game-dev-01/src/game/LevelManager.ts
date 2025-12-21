/**
 * Level Manager
 * 
 * Manages level loading, unloading, and transitions.
 * Handles entity spawning, cleanup, and camera bounds setup.
 */

import { ReactiveWorld } from '@engine/ReactiveWorld'
import { Entity } from '@engine/ECS'
import { COMPONENTS } from '@engine/constants'
import {
  getLevelById,
  type LevelDefinition,
  type SpawnZone,
  type EnemySpawn,
  type NPCSpawn,
  type ItemSpawn
} from '@game/configs/LevelConfig'
import {
  getBlueprintById,
  createEntityFromBlueprint,
  type EntityBlueprint
} from '@game/configs/EntityBlueprints'

/**
 * Random spawn position within a zone
 */
const getRandomPositionInZone = (zone: SpawnZone): { x: number; y: number } => {
  return {
    x: zone.minX + Math.random() * (zone.maxX - zone.minX),
    y: zone.minY + Math.random() * (zone.maxY - zone.minY)
  }
}

/**
 * Level Manager class
 * 
 * Manages game levels including loading, unloading, and transitions.
 */
export class LevelManager {
  private world: ReactiveWorld
  private currentLevel: LevelDefinition | null = null
  private levelEntities: Set<Entity> = new Set()
  private playerEntity: Entity | null = null

  constructor(world: ReactiveWorld) {
    this.world = world
  }

  /**
   * Set the player entity
   * Player is preserved across level transitions
   * 
   * @param player - Player entity ID
   */
  setPlayer(player: Entity): void {
    this.playerEntity = player
  }

  /**
   * Get current level
   * 
   * @returns Current level definition or null
   */
  getCurrentLevel(): LevelDefinition | null {
    return this.currentLevel
  }

  /**
   * Load a level by ID
   * 
   * @param levelId - Level ID to load
   * @returns true if successful, false otherwise
   * 
   * @example
   * ```ts
   * const success = levelManager.loadLevel('level_1_forest')
   * if (success) {
   *   console.log('Level loaded!')
   * }
   * ```
   */
  loadLevel(levelId: string): boolean {
    const level = getLevelById(levelId)
    if (!level) {
      console.error(`[LevelManager] Level not found: ${levelId}`)
      return false
    }

    // Unload current level first
    if (this.currentLevel) {
      this.unloadLevel()
    }

    console.log(`[LevelManager] Loading level: ${level.name}`)
    this.currentLevel = level
    this.levelEntities.clear()

    // Spawn enemies
    this.spawnEnemies(level.enemies)

    // Spawn NPCs
    this.spawnNPCs(level.npcs)

    // Spawn items
    this.spawnItems(level.items)

    console.log(`[LevelManager] Level loaded: ${level.name} with ${this.levelEntities.size} entities`)
    return true
  }

  /**
   * Unload current level
   * Removes all level entities except the player
   * 
   * @example
   * ```ts
   * levelManager.unloadLevel()
   * ```
   */
  unloadLevel(): void {
    if (!this.currentLevel) {
      return
    }

    console.log(`[LevelManager] Unloading level: ${this.currentLevel.name}`)

    // Remove all level entities except player
    for (const entityId of this.levelEntities) {
      if (entityId !== this.playerEntity) {
        this.world.removeEntity(entityId)
      }
    }

    this.levelEntities.clear()
    this.currentLevel = null
  }

  /**
   * Transition to a new level
   * Unloads current level and loads new one
   * 
   * @param levelId - Level ID to transition to
   * @param onComplete - Optional callback when transition is complete
   * @returns Promise that resolves when transition is complete
   * 
   * @example
   * ```ts
   * await levelManager.transitionToLevel('level_2_cave', () => {
   *   console.log('Transition complete!')
   * })
   * ```
   */
  async transitionToLevel(levelId: string, onComplete?: () => void): Promise<boolean> {
    console.log(`[LevelManager] Transitioning to level: ${levelId}`)

    // Load the new level
    const success = this.loadLevel(levelId)

    if (success && onComplete) {
      onComplete()
    }

    return success
  }

  /**
   * Spawn enemies from level definition
   * 
   * @param enemies - Enemy spawn configurations
   */
  private spawnEnemies(enemies: EnemySpawn[]): void {
    for (const enemyConfig of enemies) {
      const blueprint = getBlueprintById(enemyConfig.blueprintId)
      if (!blueprint) {
        console.warn(`[LevelManager] Blueprint not found: ${enemyConfig.blueprintId}`)
        continue
      }

      for (let i = 0; i < enemyConfig.count; i++) {
        // Pick random spawn zone
        const zone = enemyConfig.spawnZones[Math.floor(Math.random() * enemyConfig.spawnZones.length)]
        const position = getRandomPositionInZone(zone)

        // Create entity with position override
        const entity = this.world.createEntity()
        const customBlueprint = createEntityFromBlueprint(blueprint, {
          components: {
            transform: { x: position.x, y: position.y }
          }
        })

        this.instantiateBlueprint(customBlueprint, entity)
        this.levelEntities.add(entity)
      }
    }
  }

  /**
   * Spawn NPCs from level definition
   * 
   * @param npcs - NPC spawn configurations
   */
  private spawnNPCs(npcs: NPCSpawn[]): void {
    for (const npcConfig of npcs) {
      const blueprint = getBlueprintById(npcConfig.blueprintId)
      if (!blueprint) {
        console.warn(`[LevelManager] Blueprint not found: ${npcConfig.blueprintId}`)
        continue
      }

      // Create entity with exact position
      const entity = this.world.createEntity()
      const customBlueprint = createEntityFromBlueprint(blueprint, {
        components: {
          transform: { x: npcConfig.x, y: npcConfig.y }
        }
      })

      this.instantiateBlueprint(customBlueprint, entity)
      this.levelEntities.add(entity)
    }
  }

  /**
   * Spawn items from level definition
   * 
   * @param items - Item spawn configurations
   */
  private spawnItems(items: ItemSpawn[]): void {
    for (const itemConfig of items) {
      const blueprint = getBlueprintById(itemConfig.blueprintId)
      if (!blueprint) {
        console.warn(`[LevelManager] Blueprint not found: ${itemConfig.blueprintId}`)
        continue
      }

      for (let i = 0; i < itemConfig.count; i++) {
        // Pick random spawn zone
        const zone = itemConfig.spawnZones[Math.floor(Math.random() * itemConfig.spawnZones.length)]
        const position = getRandomPositionInZone(zone)

        // Create entity with position override
        const entity = this.world.createEntity()
        const customBlueprint = createEntityFromBlueprint(blueprint, {
          components: {
            transform: { x: position.x, y: position.y }
          }
        })

        this.instantiateBlueprint(customBlueprint, entity)
        this.levelEntities.add(entity)
      }
    }
  }

  /**
   * Instantiate blueprint on entity
   * Helper method to add all components from blueprint
   * 
   * @param blueprint - Entity blueprint
   * @param entityId - Entity to add components to
   */
  private instantiateBlueprint(blueprint: EntityBlueprint, entityId: Entity): void {
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
      this.world.addComponent(entityId, key as any, componentData)
    })
  }

  /**
   * Get camera bounds for current level
   * 
   * @returns Camera bounds or null if no level loaded
   */
  getCameraBounds(): { x: number; y: number; width: number; height: number } | null {
    if (!this.currentLevel || !this.currentLevel.cameraBounds) {
      return null
    }
    return this.currentLevel.cameraBounds
  }

  /**
   * Get theme for current level
   * 
   * @returns Theme or null if no level loaded
   */
  getTheme(): { backgroundColor?: string } | null {
    if (!this.currentLevel || !this.currentLevel.theme) {
      return null
    }
    return this.currentLevel.theme
  }

  /**
   * Get all level entities (excluding player)
   * 
   * @returns Set of entity IDs
   */
  getLevelEntities(): Set<Entity> {
    return new Set(this.levelEntities)
  }

  /**
   * Reset player position for current level
   * Moves player to a safe starting position
   * 
   * @param x - X position (optional, defaults to 200)
   * @param y - Y position (optional, defaults to 200)
   */
  resetPlayerPosition(x: number = 200, y: number = 200): void {
    if (!this.playerEntity) {
      console.warn('[LevelManager] No player entity set')
      return
    }

    const transform = this.world.getComponent(this.playerEntity, COMPONENTS.TRANSFORM)
    if (transform) {
      this.world.addComponent(this.playerEntity, COMPONENTS.TRANSFORM, { ...transform, x, y })
      try {
        this.world.markComponentUpdated(this.playerEntity, COMPONENTS.TRANSFORM)
      } catch (e) {
        // Ignore if markComponentUpdated doesn't exist
      }
    }
  }
}
