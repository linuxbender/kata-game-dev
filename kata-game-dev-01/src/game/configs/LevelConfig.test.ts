import { describe, it, expect } from 'vitest'
import {
  LEVEL_1_FOREST,
  LEVEL_2_CAVE,
  LEVEL_3_FORTRESS,
  LEVELS,
  getLevelById,
  getAllLevelIds,
  isValidLevel,
  type LevelDefinition,
  type SpawnZone,
  type EnemySpawn,
  type NPCSpawn,
  type ItemSpawn
} from './LevelConfig'

describe('LevelConfig', () => {
  describe('Level Definitions', () => {
    it('should have valid LEVEL_1_FOREST definition', () => {
      expect(LEVEL_1_FOREST).toBeDefined()
      expect(LEVEL_1_FOREST.id).toBe('level_1_forest')
      expect(LEVEL_1_FOREST.name).toBe('Forest Clearing')
      expect(LEVEL_1_FOREST.description).toBeTruthy()
      expect(Array.isArray(LEVEL_1_FOREST.enemies)).toBe(true)
      expect(Array.isArray(LEVEL_1_FOREST.npcs)).toBe(true)
      expect(Array.isArray(LEVEL_1_FOREST.items)).toBe(true)
    })

    it('should have valid LEVEL_2_CAVE definition', () => {
      expect(LEVEL_2_CAVE).toBeDefined()
      expect(LEVEL_2_CAVE.id).toBe('level_2_cave')
      expect(LEVEL_2_CAVE.name).toBe('Dark Cave')
      expect(LEVEL_2_CAVE.description).toBeTruthy()
      expect(Array.isArray(LEVEL_2_CAVE.enemies)).toBe(true)
      expect(Array.isArray(LEVEL_2_CAVE.npcs)).toBe(true)
      expect(Array.isArray(LEVEL_2_CAVE.items)).toBe(true)
    })

    it('should have valid LEVEL_3_FORTRESS definition', () => {
      expect(LEVEL_3_FORTRESS).toBeDefined()
      expect(LEVEL_3_FORTRESS.id).toBe('level_3_fortress')
      expect(LEVEL_3_FORTRESS.name).toBe('Orc Fortress')
      expect(LEVEL_3_FORTRESS.description).toBeTruthy()
      expect(Array.isArray(LEVEL_3_FORTRESS.enemies)).toBe(true)
      expect(Array.isArray(LEVEL_3_FORTRESS.npcs)).toBe(true)
      expect(Array.isArray(LEVEL_3_FORTRESS.items)).toBe(true)
    })
  })

  describe('Enemy Spawns', () => {
    it('LEVEL_1_FOREST should have goblin scouts', () => {
      const goblins = LEVEL_1_FOREST.enemies.find(e => e.blueprintId === 'goblin_scout')
      expect(goblins).toBeDefined()
      expect(goblins!.count).toBeGreaterThan(0)
      expect(goblins!.spawnZones.length).toBeGreaterThan(0)
    })

    it('LEVEL_2_CAVE should have both goblins and orcs', () => {
      const goblins = LEVEL_2_CAVE.enemies.find(e => e.blueprintId === 'goblin_scout')
      const orcs = LEVEL_2_CAVE.enemies.find(e => e.blueprintId === 'orc_warrior')
      expect(goblins).toBeDefined()
      expect(orcs).toBeDefined()
      expect(goblins!.count).toBeGreaterThan(0)
      expect(orcs!.count).toBeGreaterThan(0)
    })

    it('LEVEL_3_FORTRESS should have multiple orcs', () => {
      const orcs = LEVEL_3_FORTRESS.enemies.find(e => e.blueprintId === 'orc_warrior')
      expect(orcs).toBeDefined()
      expect(orcs!.count).toBeGreaterThanOrEqual(5)
    })

    it('spawn zones should have valid boundaries', () => {
      const allLevels = [LEVEL_1_FOREST, LEVEL_2_CAVE, LEVEL_3_FORTRESS]
      allLevels.forEach(level => {
        level.enemies.forEach(enemy => {
          enemy.spawnZones.forEach(zone => {
            expect(zone.minX).toBeLessThan(zone.maxX)
            expect(zone.minY).toBeLessThan(zone.maxY)
          })
        })
      })
    })
  })

  describe('NPC Spawns', () => {
    it('LEVEL_1_FOREST should have merchant', () => {
      const merchant = LEVEL_1_FOREST.npcs.find(n => n.blueprintId === 'merchant_john')
      expect(merchant).toBeDefined()
      expect(merchant!.x).toBeGreaterThan(0)
      expect(merchant!.y).toBeGreaterThan(0)
    })

    it('LEVEL_2_CAVE should have no NPCs', () => {
      expect(LEVEL_2_CAVE.npcs.length).toBe(0)
    })

    it('LEVEL_3_FORTRESS should have no NPCs', () => {
      expect(LEVEL_3_FORTRESS.npcs.length).toBe(0)
    })
  })

  describe('Item Spawns', () => {
    it('all levels should have health potions', () => {
      const allLevels = [LEVEL_1_FOREST, LEVEL_2_CAVE, LEVEL_3_FORTRESS]
      allLevels.forEach(level => {
        const potions = level.items.find(i => i.blueprintId === 'item_potion_health')
        expect(potions).toBeDefined()
        expect(potions!.count).toBeGreaterThan(0)
      })
    })

    it('item spawn zones should have valid boundaries', () => {
      const allLevels = [LEVEL_1_FOREST, LEVEL_2_CAVE, LEVEL_3_FORTRESS]
      allLevels.forEach(level => {
        level.items.forEach(item => {
          item.spawnZones.forEach(zone => {
            expect(zone.minX).toBeLessThan(zone.maxX)
            expect(zone.minY).toBeLessThan(zone.maxY)
          })
        })
      })
    })
  })

  describe('LEVELS Registry', () => {
    it('should contain all levels', () => {
      expect(LEVELS['level_1_forest']).toBe(LEVEL_1_FOREST)
      expect(LEVELS['level_2_cave']).toBe(LEVEL_2_CAVE)
      expect(LEVELS['level_3_fortress']).toBe(LEVEL_3_FORTRESS)
    })

    it('should have at least 3 levels', () => {
      expect(Object.keys(LEVELS).length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('getLevelById', () => {
    it('should return level by ID', () => {
      const level = getLevelById('level_1_forest')
      expect(level).toBe(LEVEL_1_FOREST)
    })

    it('should return undefined for invalid ID', () => {
      const level = getLevelById('invalid_level')
      expect(level).toBeUndefined()
    })

    it('should return correct level for each ID', () => {
      expect(getLevelById('level_1_forest')).toBe(LEVEL_1_FOREST)
      expect(getLevelById('level_2_cave')).toBe(LEVEL_2_CAVE)
      expect(getLevelById('level_3_fortress')).toBe(LEVEL_3_FORTRESS)
    })
  })

  describe('getAllLevelIds', () => {
    it('should return all level IDs', () => {
      const ids = getAllLevelIds()
      expect(ids).toContain('level_1_forest')
      expect(ids).toContain('level_2_cave')
      expect(ids).toContain('level_3_fortress')
    })

    it('should return at least 3 IDs', () => {
      const ids = getAllLevelIds()
      expect(ids.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('isValidLevel', () => {
    it('should validate all predefined levels', () => {
      expect(isValidLevel(LEVEL_1_FOREST)).toBe(true)
      expect(isValidLevel(LEVEL_2_CAVE)).toBe(true)
      expect(isValidLevel(LEVEL_3_FORTRESS)).toBe(true)
    })

    it('should reject invalid level (missing id)', () => {
      const invalid = {
        name: 'Test',
        description: 'Test',
        enemies: [],
        npcs: [],
        items: []
      } as any
      expect(isValidLevel(invalid)).toBe(false)
    })

    it('should reject invalid level (missing name)', () => {
      const invalid = {
        id: 'test',
        description: 'Test',
        enemies: [],
        npcs: [],
        items: []
      } as any
      expect(isValidLevel(invalid)).toBe(false)
    })

    it('should reject invalid level (missing arrays)', () => {
      const invalid = {
        id: 'test',
        name: 'Test',
        description: 'Test'
      } as any
      expect(isValidLevel(invalid)).toBe(false)
    })

    it('should reject invalid level (non-array enemies)', () => {
      const invalid = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        enemies: 'not an array',
        npcs: [],
        items: []
      } as any
      expect(isValidLevel(invalid)).toBe(false)
    })
  })

  describe('Camera Bounds', () => {
    it('all levels should have camera bounds', () => {
      expect(LEVEL_1_FOREST.cameraBounds).toBeDefined()
      expect(LEVEL_2_CAVE.cameraBounds).toBeDefined()
      expect(LEVEL_3_FORTRESS.cameraBounds).toBeDefined()
    })

    it('camera bounds should have valid dimensions', () => {
      const allLevels = [LEVEL_1_FOREST, LEVEL_2_CAVE, LEVEL_3_FORTRESS]
      allLevels.forEach(level => {
        expect(level.cameraBounds!.width).toBeGreaterThan(0)
        expect(level.cameraBounds!.height).toBeGreaterThan(0)
      })
    })
  })

  describe('Theme', () => {
    it('all levels should have theme with backgroundColor', () => {
      expect(LEVEL_1_FOREST.theme?.backgroundColor).toBeDefined()
      expect(LEVEL_2_CAVE.theme?.backgroundColor).toBeDefined()
      expect(LEVEL_3_FORTRESS.theme?.backgroundColor).toBeDefined()
    })

    it('backgroundColor should be valid hex color', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/
      expect(LEVEL_1_FOREST.theme!.backgroundColor).toMatch(hexColorRegex)
      expect(LEVEL_2_CAVE.theme!.backgroundColor).toMatch(hexColorRegex)
      expect(LEVEL_3_FORTRESS.theme!.backgroundColor).toMatch(hexColorRegex)
    })
  })
})
