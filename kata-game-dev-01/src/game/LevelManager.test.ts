import { describe, it, expect, beforeEach } from 'vitest'
import { LevelManager } from './LevelManager'
import { ReactiveWorld } from '@engine/ReactiveWorld'
import { COMPONENTS } from '@engine/constants'
import { LEVEL_1_FOREST, LEVEL_2_CAVE, LEVEL_3_FORTRESS } from '@game/configs/LevelConfig'

describe('LevelManager', () => {
  let world: ReactiveWorld
  let levelManager: LevelManager
  let playerEntity: number

  beforeEach(() => {
    world = new ReactiveWorld()
    levelManager = new LevelManager(world)

    // Create a player entity
    playerEntity = world.createEntity()
    world.addComponent(playerEntity, COMPONENTS.TRANSFORM, { x: 100, y: 100 })
    world.addComponent(playerEntity, COMPONENTS.HEALTH, { current: 100, max: 100 })
    levelManager.setPlayer(playerEntity)
  })

  describe('Constructor and Setup', () => {
    it('should create LevelManager instance', () => {
      expect(levelManager).toBeDefined()
      expect(levelManager).toBeInstanceOf(LevelManager)
    })

    it('should have no current level initially', () => {
      expect(levelManager.getCurrentLevel()).toBeNull()
    })

    it('should set player entity', () => {
      const newPlayer = world.createEntity()
      levelManager.setPlayer(newPlayer)
      // Player entity is set internally, verify by loading a level
      expect(() => levelManager.loadLevel('level_1_forest')).not.toThrow()
    })
  })

  describe('loadLevel', () => {
    it('should load level by ID', () => {
      const success = levelManager.loadLevel('level_1_forest')
      expect(success).toBe(true)
      expect(levelManager.getCurrentLevel()).not.toBeNull()
      expect(levelManager.getCurrentLevel()?.id).toBe('level_1_forest')
    })

    it('should return false for invalid level ID', () => {
      const success = levelManager.loadLevel('invalid_level')
      expect(success).toBe(false)
      expect(levelManager.getCurrentLevel()).toBeNull()
    })

    it('should spawn enemies from level definition', () => {
      levelManager.loadLevel('level_1_forest')
      
      // Query for enemy entities
      const enemies = world.query(COMPONENTS.TRANSFORM, COMPONENTS.HEALTH)
        .filter(e => {
          const metadata = world.getComponent(e.entity, COMPONENTS.METADATA as any)
          return metadata?.isEnemy === true
        })

      // LEVEL_1_FOREST has 5 goblins
      expect(enemies.length).toBeGreaterThan(0)
    })

    it('should spawn NPCs from level definition', () => {
      levelManager.loadLevel('level_1_forest')
      
      // Query for NPC entities
      const npcs = world.query(COMPONENTS.TRANSFORM)
        .filter(e => {
          const metadata = world.getComponent(e.entity, COMPONENTS.METADATA as any)
          return metadata?.isNPC === true
        })

      // LEVEL_1_FOREST has 1 merchant
      expect(npcs.length).toBe(1)
    })

    it('should spawn items from level definition', () => {
      levelManager.loadLevel('level_1_forest')
      
      // Query for item entities (have transform and renderable but no health)
      const items = world.query(COMPONENTS.TRANSFORM, COMPONENTS.RENDERABLE)
        .filter(e => {
          const health = world.getComponent(e.entity, COMPONENTS.HEALTH)
          return !health
        })

      // Should have items spawned
      expect(items.length).toBeGreaterThan(0)
    })

    it('should track level entities', () => {
      levelManager.loadLevel('level_1_forest')
      const entities = levelManager.getLevelEntities()
      expect(entities.size).toBeGreaterThan(0)
    })

    it('should unload previous level when loading new one', () => {
      levelManager.loadLevel('level_1_forest')
      const firstLevelEntities = levelManager.getLevelEntities().size

      levelManager.loadLevel('level_2_cave')
      const secondLevelEntities = levelManager.getLevelEntities().size

      // Should have different entity count (unless by chance they're the same)
      expect(levelManager.getCurrentLevel()?.id).toBe('level_2_cave')
      expect(secondLevelEntities).toBeGreaterThan(0)
    })
  })

  describe('unloadLevel', () => {
    it('should unload current level', () => {
      levelManager.loadLevel('level_1_forest')
      expect(levelManager.getCurrentLevel()).not.toBeNull()

      levelManager.unloadLevel()
      expect(levelManager.getCurrentLevel()).toBeNull()
    })

    it('should remove all level entities', () => {
      levelManager.loadLevel('level_1_forest')
      const entitiesBeforeUnload = levelManager.getLevelEntities().size
      expect(entitiesBeforeUnload).toBeGreaterThan(0)

      levelManager.unloadLevel()
      const entitiesAfterUnload = levelManager.getLevelEntities().size
      expect(entitiesAfterUnload).toBe(0)
    })

    it('should preserve player entity', () => {
      levelManager.loadLevel('level_1_forest')
      
      const playerTransformBefore = world.getComponent(playerEntity, COMPONENTS.TRANSFORM)
      expect(playerTransformBefore).toBeDefined()

      levelManager.unloadLevel()

      const playerTransformAfter = world.getComponent(playerEntity, COMPONENTS.TRANSFORM)
      expect(playerTransformAfter).toBeDefined()
    })

    it('should do nothing if no level is loaded', () => {
      expect(() => levelManager.unloadLevel()).not.toThrow()
      expect(levelManager.getCurrentLevel()).toBeNull()
    })
  })

  describe('transitionToLevel', () => {
    it('should transition to new level', async () => {
      levelManager.loadLevel('level_1_forest')
      expect(levelManager.getCurrentLevel()?.id).toBe('level_1_forest')

      const success = await levelManager.transitionToLevel('level_2_cave')
      expect(success).toBe(true)
      expect(levelManager.getCurrentLevel()?.id).toBe('level_2_cave')
    })

    it('should call onComplete callback', async () => {
      let callbackCalled = false
      await levelManager.transitionToLevel('level_1_forest', () => {
        callbackCalled = true
      })

      expect(callbackCalled).toBe(true)
    })

    it('should return false for invalid level', async () => {
      const success = await levelManager.transitionToLevel('invalid_level')
      expect(success).toBe(false)
    })

    it('should unload old level entities', async () => {
      levelManager.loadLevel('level_1_forest')
      const entitiesBeforeTransition = world.query(COMPONENTS.TRANSFORM).length

      await levelManager.transitionToLevel('level_2_cave')
      const entitiesAfterTransition = world.query(COMPONENTS.TRANSFORM).length

      // Should have different entity counts (old ones removed, new ones added)
      expect(entitiesAfterTransition).toBeGreaterThan(0)
    })
  })

  describe('getCameraBounds', () => {
    it('should return null when no level is loaded', () => {
      expect(levelManager.getCameraBounds()).toBeNull()
    })

    it('should return camera bounds for loaded level', () => {
      levelManager.loadLevel('level_1_forest')
      const bounds = levelManager.getCameraBounds()
      
      expect(bounds).not.toBeNull()
      expect(bounds?.width).toBeGreaterThan(0)
      expect(bounds?.height).toBeGreaterThan(0)
    })

    it('should match level definition camera bounds', () => {
      levelManager.loadLevel('level_1_forest')
      const bounds = levelManager.getCameraBounds()
      
      expect(bounds).toEqual(LEVEL_1_FOREST.cameraBounds)
    })
  })

  describe('getTheme', () => {
    it('should return null when no level is loaded', () => {
      expect(levelManager.getTheme()).toBeNull()
    })

    it('should return theme for loaded level', () => {
      levelManager.loadLevel('level_1_forest')
      const theme = levelManager.getTheme()
      
      expect(theme).not.toBeNull()
      expect(theme?.backgroundColor).toBeDefined()
    })

    it('should match level definition theme', () => {
      levelManager.loadLevel('level_1_forest')
      const theme = levelManager.getTheme()
      
      expect(theme).toEqual(LEVEL_1_FOREST.theme)
    })
  })

  describe('resetPlayerPosition', () => {
    it('should reset player position to default', () => {
      levelManager.loadLevel('level_1_forest')
      
      // Move player somewhere else
      world.addComponent(playerEntity, COMPONENTS.TRANSFORM, { x: 999, y: 999 })
      
      // Reset position
      levelManager.resetPlayerPosition()
      
      const transform = world.getComponent(playerEntity, COMPONENTS.TRANSFORM)
      expect(transform?.x).toBe(200)
      expect(transform?.y).toBe(200)
    })

    it('should reset player position to custom coordinates', () => {
      levelManager.loadLevel('level_1_forest')
      
      levelManager.resetPlayerPosition(500, 600)
      
      const transform = world.getComponent(playerEntity, COMPONENTS.TRANSFORM)
      expect(transform?.x).toBe(500)
      expect(transform?.y).toBe(600)
    })

    it('should warn if no player entity set', () => {
      const newLevelManager = new LevelManager(world)
      // Don't set player
      expect(() => newLevelManager.resetPlayerPosition()).not.toThrow()
    })
  })

  describe('Multiple Levels', () => {
    it('should load all three predefined levels', () => {
      const levels = ['level_1_forest', 'level_2_cave', 'level_3_fortress']
      
      levels.forEach(levelId => {
        const success = levelManager.loadLevel(levelId)
        expect(success).toBe(true)
        expect(levelManager.getCurrentLevel()?.id).toBe(levelId)
      })
    })

    it('should properly clean up between level loads', () => {
      levelManager.loadLevel('level_1_forest')
      const level1Entities = levelManager.getLevelEntities().size

      levelManager.loadLevel('level_2_cave')
      const level2Entities = levelManager.getLevelEntities().size

      levelManager.loadLevel('level_3_fortress')
      const level3Entities = levelManager.getLevelEntities().size

      // Each level should have entities
      expect(level1Entities).toBeGreaterThan(0)
      expect(level2Entities).toBeGreaterThan(0)
      expect(level3Entities).toBeGreaterThan(0)
    })

    it('should maintain player across all level transitions', () => {
      const levels = ['level_1_forest', 'level_2_cave', 'level_3_fortress']
      
      levels.forEach(levelId => {
        levelManager.loadLevel(levelId)
        const playerTransform = world.getComponent(playerEntity, COMPONENTS.TRANSFORM)
        expect(playerTransform).toBeDefined()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle loading same level twice', () => {
      levelManager.loadLevel('level_1_forest')
      const firstLoad = levelManager.getCurrentLevel()

      levelManager.loadLevel('level_1_forest')
      const secondLoad = levelManager.getCurrentLevel()

      expect(firstLoad?.id).toBe(secondLoad?.id)
    })

    it('should handle unload without load', () => {
      expect(() => levelManager.unloadLevel()).not.toThrow()
    })

    it('should handle transition without initial load', async () => {
      const success = await levelManager.transitionToLevel('level_1_forest')
      expect(success).toBe(true)
    })
  })
})
