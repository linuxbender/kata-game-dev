import { describe, it, expect } from 'vitest'
import {
  PLAYER_BLUEPRINT,
  GOBLIN_BLUEPRINT,
  ORC_BLUEPRINT,
  MERCHANT_BLUEPRINT,
  HEALTH_POTION_BLUEPRINT,
  ENTITY_BLUEPRINTS,
  createEntityFromBlueprint,
  getBlueprintById,
  isValidBlueprint,
  getBlueprintsByType,
  getBlueprintsByTag,
} from './EntityBlueprints'

describe('EntityBlueprints', () => {
  describe('Blueprint Validation', () => {
    it('should have all blueprints registered', () => {
      expect(ENTITY_BLUEPRINTS[PLAYER_BLUEPRINT.id]).toBe(PLAYER_BLUEPRINT)
      expect(ENTITY_BLUEPRINTS[GOBLIN_BLUEPRINT.id]).toBe(GOBLIN_BLUEPRINT)
      expect(ENTITY_BLUEPRINTS[ORC_BLUEPRINT.id]).toBe(ORC_BLUEPRINT)
      expect(ENTITY_BLUEPRINTS[MERCHANT_BLUEPRINT.id]).toBe(MERCHANT_BLUEPRINT)
      expect(ENTITY_BLUEPRINTS[HEALTH_POTION_BLUEPRINT.id]).toBe(
        HEALTH_POTION_BLUEPRINT
      )
    })

    it('should not have duplicate IDs', () => {
      const ids = Object.keys(ENTITY_BLUEPRINTS)
      const uniqueIds = new Set(ids)
      expect(ids.length).toBe(uniqueIds.size)
    })

    it('should validate correct blueprints', () => {
      expect(isValidBlueprint(PLAYER_BLUEPRINT)).toBe(true)
      expect(isValidBlueprint(GOBLIN_BLUEPRINT)).toBe(true)
      expect(isValidBlueprint(MERCHANT_BLUEPRINT)).toBe(true)
    })

    it('should reject invalid blueprints', () => {
      const invalidBlueprints: any[] = [
        // Missing ID
        {
          id: '',
          name: 'Test',
          type: 'player' as const,
          components: { transform: { x: 0, y: 0 } },
        },
        // Missing name
        {
          id: 'test_id',
          name: '',
          type: 'player' as const,
          components: { transform: { x: 0, y: 0 } },
        },
        // Missing components
        {
          id: 'test_id',
          name: 'Test',
          type: 'player' as const,
          components: {},
        },
        // Components is not object
        {
          id: 'test_id',
          name: 'Test',
          type: 'player' as const,
          components: 'invalid' as any,
        },
      ]

      invalidBlueprints.forEach(bp => {
        expect(isValidBlueprint(bp)).toBe(false)
      })
    })
  })

  describe('Blueprint Components', () => {
    it('player should have all required components', () => {
      const components = PLAYER_BLUEPRINT.components
      expect(components.transform).toBeDefined()
      expect(components.velocity).toBeDefined()
      expect(components.collider).toBeDefined()
      expect(components.renderable).toBeDefined()
      expect(components.health).toBeDefined()
      expect(components.inventory).toBeDefined()
      expect(components.equipment).toBeDefined()
      expect(components.stats).toBeDefined()
    })

    it('player should have correct default values', () => {
      const { transform, health, stats } = PLAYER_BLUEPRINT.components
      expect(transform.x).toBe(200)
      expect(transform.y).toBe(200)
      expect(health.current).toBe(100)
      expect(health.max).toBe(100)
      expect(stats.level).toBe(1)
    })

    it('enemies should have AI component', () => {
      expect(GOBLIN_BLUEPRINT.components.ai).toBeDefined()
      expect(ORC_BLUEPRINT.components.ai).toBeDefined()
    })

    it('enemy AI should have correct settings', () => {
      const goblinAI = GOBLIN_BLUEPRINT.components.ai
      const orcAI = ORC_BLUEPRINT.components.ai

      expect(goblinAI.type).toBe('aggressive')
      expect(goblinAI.detectionRange).toBe(200)
      expect(orcAI.detectionRange).toBe(300)
    })

    it('NPC should have inventory', () => {
      expect(MERCHANT_BLUEPRINT.components.inventory).toBeDefined()
      expect(MERCHANT_BLUEPRINT.components.inventory.items.length).toBeGreaterThan(0)
    })

    it('items should have collider with isTrigger', () => {
      expect(HEALTH_POTION_BLUEPRINT.components.collider.isTrigger).toBe(true)
    })
  })

  describe('Blueprint Types', () => {
    it('should have correct entity types', () => {
      expect(PLAYER_BLUEPRINT.type).toBe('player')
      expect(GOBLIN_BLUEPRINT.type).toBe('enemy')
      expect(ORC_BLUEPRINT.type).toBe('enemy')
      expect(MERCHANT_BLUEPRINT.type).toBe('npc')
      expect(HEALTH_POTION_BLUEPRINT.type).toBe('item')
    })

    it('should identify player correctly', () => {
      const players = getBlueprintsByType('player')
      expect(players).toContain(PLAYER_BLUEPRINT)
      expect(players.length).toBe(1)
    })

    it('should identify enemies correctly', () => {
      const enemies = getBlueprintsByType('enemy')
      expect(enemies).toContain(GOBLIN_BLUEPRINT)
      expect(enemies).toContain(ORC_BLUEPRINT)
      expect(enemies.length).toBe(2)
    })

    it('should identify NPCs correctly', () => {
      const npcs = getBlueprintsByType('npc')
      expect(npcs).toContain(MERCHANT_BLUEPRINT)
    })

    it('should identify items correctly', () => {
      const items = getBlueprintsByType('item')
      expect(items).toContain(HEALTH_POTION_BLUEPRINT)
    })
  })

  describe('Blueprint Tags', () => {
    it('should have correct tags', () => {
      expect(PLAYER_BLUEPRINT.tags).toContain('player')
      expect(GOBLIN_BLUEPRINT.tags).toContain('melee')
      expect(GOBLIN_BLUEPRINT.tags).toContain('small')
      expect(ORC_BLUEPRINT.tags).toContain('boss')
    })

    it('should filter by boss tag', () => {
      const bosses = getBlueprintsByTag('boss')
      expect(bosses).toContain(ORC_BLUEPRINT)
      expect(bosses.length).toBeGreaterThanOrEqual(1)
    })

    it('should filter by melee tag', () => {
      const melee = getBlueprintsByTag('melee')
      expect(melee).toContain(GOBLIN_BLUEPRINT)
      expect(melee).toContain(ORC_BLUEPRINT)
    })
  })

  describe('createEntityFromBlueprint', () => {
    it('should create blueprint with overrides', () => {
      const customPlayer = createEntityFromBlueprint(PLAYER_BLUEPRINT, {
        components: {
          transform: { x: 500, y: 500, rotation: 0 },
        },
      })

      expect(customPlayer.components.transform.x).toBe(500)
      expect(customPlayer.components.transform.y).toBe(500)
      // Other components should be unchanged
      expect(customPlayer.components.health.max).toBe(
        PLAYER_BLUEPRINT.components.health.max
      )
    })

    it('should not mutate original blueprint', () => {
      const originalX = PLAYER_BLUEPRINT.components.transform.x
      createEntityFromBlueprint(PLAYER_BLUEPRINT, {
        components: {
          transform: { x: 999, y: 999, rotation: 0 },
        },
      })

      expect(PLAYER_BLUEPRINT.components.transform.x).toBe(originalX)
    })

    it('should merge component overrides correctly', () => {
      const toughGoblin = createEntityFromBlueprint(GOBLIN_BLUEPRINT, {
        components: {
          health: { current: 50, max: 50 },
        },
      })

      expect(toughGoblin.components.health.max).toBe(50)
      // AI should still be intact
      expect(toughGoblin.components.ai).toEqual(GOBLIN_BLUEPRINT.components.ai)
    })

    it('should allow metadata overrides', () => {
      const customBlueprint = createEntityFromBlueprint(PLAYER_BLUEPRINT, {
        name: 'Custom Player',
        components: {
          metadata: { customFlag: true },
        },
      })

      expect(customBlueprint.name).toBe('Custom Player')
      expect(customBlueprint.components.metadata.customFlag).toBe(true)
    })
  })

  describe('getBlueprintById', () => {
    it('should find blueprint by ID', () => {
      const blueprint = getBlueprintById(PLAYER_BLUEPRINT.id)
      expect(blueprint).toBe(PLAYER_BLUEPRINT)
    })

    it('should find all registered blueprints', () => {
      expect(getBlueprintById(GOBLIN_BLUEPRINT.id)).toBe(GOBLIN_BLUEPRINT)
      expect(getBlueprintById(ORC_BLUEPRINT.id)).toBe(ORC_BLUEPRINT)
      expect(getBlueprintById(MERCHANT_BLUEPRINT.id)).toBe(MERCHANT_BLUEPRINT)
      expect(getBlueprintById(HEALTH_POTION_BLUEPRINT.id)).toBe(
        HEALTH_POTION_BLUEPRINT
      )
    })

    it('should return undefined for non-existent ID', () => {
      const blueprint = getBlueprintById('non_existent_id')
      expect(blueprint).toBeUndefined()
    })
  })

  describe('Rendering', () => {
    it('should have renderables for visual entities', () => {
      const visualBlueprints = [
        PLAYER_BLUEPRINT,
        GOBLIN_BLUEPRINT,
        ORC_BLUEPRINT,
        MERCHANT_BLUEPRINT,
        HEALTH_POTION_BLUEPRINT,
      ]

      visualBlueprints.forEach(bp => {
        expect(bp.components.renderable).toBeDefined()
        expect(bp.components.renderable.type).toBeDefined()
        expect(bp.components.renderable.color).toBeDefined()
      })
    })

    it('player and enemies should have different colors', () => {
      const playerColor = PLAYER_BLUEPRINT.components.renderable.color
      const goblinColor = GOBLIN_BLUEPRINT.components.renderable.color
      const orcColor = ORC_BLUEPRINT.components.renderable.color

      expect(playerColor).not.toBe(goblinColor)
      expect(playerColor).not.toBe(orcColor)
      expect(goblinColor).not.toBe(orcColor)
    })

    it('should have appropriate layers for rendering order', () => {
      expect(PLAYER_BLUEPRINT.components.renderable.layer).toBeGreaterThan(
        GOBLIN_BLUEPRINT.components.renderable.layer
      )
    })
  })

  describe('Health and Combat', () => {
    it('player should have more health than goblin', () => {
      expect(PLAYER_BLUEPRINT.components.health.max).toBeGreaterThan(
        GOBLIN_BLUEPRINT.components.health.max
      )
    })

    it('orc should have more damage than goblin', () => {
      expect(ORC_BLUEPRINT.components.damage.baseValue).toBeGreaterThan(
        GOBLIN_BLUEPRINT.components.damage.baseValue
      )
    })

    it('damage should have variance', () => {
      const goblinDamage = GOBLIN_BLUEPRINT.components.damage
      const orcDamage = ORC_BLUEPRINT.components.damage

      expect(goblinDamage.variance).toBeGreaterThan(0)
      expect(orcDamage.variance).toBeGreaterThan(0)
    })
  })

  describe('Collision', () => {
    it('should have collision configuration', () => {
      const playerCollider = PLAYER_BLUEPRINT.components.collider
      expect(playerCollider.width).toBeDefined()
      expect(playerCollider.height).toBeDefined()
      expect(playerCollider.isTrigger).toBeDefined()
    })

    it('items should have trigger colliders', () => {
      expect(HEALTH_POTION_BLUEPRINT.components.collider.isTrigger).toBe(true)
    })

    it('enemies should not have trigger colliders', () => {
      expect(GOBLIN_BLUEPRINT.components.collider.isTrigger).not.toBe(true)
      expect(ORC_BLUEPRINT.components.collider.isTrigger).not.toBe(true)
    })
  })

  describe('Registry Integrity', () => {
    it('all registered blueprints should be valid', () => {
      Object.values(ENTITY_BLUEPRINTS).forEach(blueprint => {
        expect(isValidBlueprint(blueprint)).toBe(true)
      })
    })

    it('registry should not be empty', () => {
      expect(Object.keys(ENTITY_BLUEPRINTS).length).toBeGreaterThan(0)
    })

    it('all blueprint IDs should match their registry keys', () => {
      Object.entries(ENTITY_BLUEPRINTS).forEach(([key, blueprint]) => {
        expect(blueprint.id).toBe(key)
      })
    })
  })
})

