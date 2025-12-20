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

  describe('Advanced Scenarios', () => {
    it('should support creating multiple variations of same blueprint', () => {
      const goblin1 = createEntityFromBlueprint(GOBLIN_BLUEPRINT, {
        components: { transform: { x: 100, y: 100 } },
      })
      const goblin2 = createEntityFromBlueprint(GOBLIN_BLUEPRINT, {
        components: { transform: { x: 200, y: 200 } },
      })
      const goblin3 = createEntityFromBlueprint(GOBLIN_BLUEPRINT, {
        components: { transform: { x: 300, y: 300 } },
      })

      expect(goblin1.components.transform.x).toBe(100)
      expect(goblin2.components.transform.x).toBe(200)
      expect(goblin3.components.transform.x).toBe(300)

      // All should still have goblin health
      expect(goblin1.components.health.max).toBe(20)
      expect(goblin2.components.health.max).toBe(20)
      expect(goblin3.components.health.max).toBe(20)
    })

    it('should allow partial component overrides', () => {
      const toughPlayer = createEntityFromBlueprint(PLAYER_BLUEPRINT, {
        components: {
          health: { current: 200, max: 200 },
        },
      })

      // Overridden
      expect(toughPlayer.components.health.max).toBe(200)
      // Unchanged
      expect(toughPlayer.components.inventory.maxSlots).toBe(20)
      expect(toughPlayer.components.stats.level).toBe(1)
    })

    it('should handle blueprint queries by type', () => {
      const enemies = getBlueprintsByType('enemy')
      const npcs = getBlueprintsByType('npc')
      const items = getBlueprintsByType('item')

      expect(enemies.length).toBeGreaterThanOrEqual(2) // At least goblin & orc
      expect(npcs.length).toBeGreaterThanOrEqual(1)
      expect(items.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle blueprint queries by tag', () => {
      const bosses = getBlueprintsByTag('boss')
      const melee = getBlueprintsByTag('melee')

      expect(bosses.length).toBeGreaterThan(0)
      expect(melee.length).toBeGreaterThan(0)

      // Boss should be in melee
      const bossInMelee = melee.some(bp => bp.tags?.includes('boss'))
      expect(bossInMelee).toBe(true)
    })

    it('should not mutate original blueprint when creating variations', () => {
      const originalPlayerHealth = PLAYER_BLUEPRINT.components.health.max
      const originalPlayerX = PLAYER_BLUEPRINT.components.transform.x

      createEntityFromBlueprint(PLAYER_BLUEPRINT, {
        components: {
          health: { current: 999, max: 999 },
          transform: { x: 999, y: 999 },
        },
      })

      expect(PLAYER_BLUEPRINT.components.health.max).toBe(originalPlayerHealth)
      expect(PLAYER_BLUEPRINT.components.transform.x).toBe(originalPlayerX)
    })

    it('should support chained blueprint modifications', () => {
      const base = createEntityFromBlueprint(GOBLIN_BLUEPRINT, {
        components: { health: { current: 40, max: 40 } },
      })

      const enhanced = createEntityFromBlueprint(base, {
        components: { damage: { baseValue: 10, variance: 2 } },
      })

      expect(enhanced.components.health.max).toBe(40) // From first override
      expect(enhanced.components.damage.baseValue).toBe(10) // From second override
    })

    it('should provide reasonable combat stats for each enemy type', () => {
      const goblinDamagePerHealth = GOBLIN_BLUEPRINT.components.damage.baseValue / GOBLIN_BLUEPRINT.components.health.max
      const orcDamagePerHealth = ORC_BLUEPRINT.components.damage.baseValue / ORC_BLUEPRINT.components.health.max

      // Both should have reasonable damage-to-health ratios (not too high or low)
      expect(goblinDamagePerHealth).toBeGreaterThan(0)
      expect(orcDamagePerHealth).toBeGreaterThan(0)
      expect(goblinDamagePerHealth).toBeLessThan(1) // Can't one-shot yourself
      expect(orcDamagePerHealth).toBeLessThan(1)
    })

    it('should have consistent AI settings within enemy archetypes', () => {
      // Both goblins and orcs are aggressive
      expect(GOBLIN_BLUEPRINT.components.ai.type).toBe(ORC_BLUEPRINT.components.ai.type)

      // But orcs detect from farther
      expect(ORC_BLUEPRINT.components.ai.detectionRange).toBeGreaterThan(
        GOBLIN_BLUEPRINT.components.ai.detectionRange
      )
    })

    it('should verify item blueprints are droppable', () => {
      const items = getBlueprintsByType('item')

      items.forEach(item => {
        expect(item.components.collider).toBeDefined()
        expect(item.components.collider.isTrigger).toBe(true) // Items are triggers
      })
    })

    it('should have proper merchant inventory setup', () => {
      const merchant = MERCHANT_BLUEPRINT

      expect(merchant.components.inventory).toBeDefined()
      expect(merchant.components.inventory.items.length).toBeGreaterThan(0)

      merchant.components.inventory.items.forEach((item: any) => {
        expect(item.id).toBeDefined()
        expect(item.type).toBeDefined()
        expect(item.quantity).toBeGreaterThan(0)
      })
    })

    it('should support blueprint filtering by multiple criteria', () => {
      const combatUnits = getBlueprintsByType('enemy').filter(bp =>
        bp.tags?.includes('melee')
      )

      expect(combatUnits.length).toBeGreaterThan(0)

      combatUnits.forEach(unit => {
        expect(unit.components.damage).toBeDefined()
        expect(unit.components.health).toBeDefined()
      })
    })

    it('should ensure player starts with empty inventory', () => {
      const playerInventory = PLAYER_BLUEPRINT.components.inventory

      expect(playerInventory.items).toBeDefined()
      expect(Array.isArray(playerInventory.items)).toBe(true)
      expect(playerInventory.items.length).toBe(0)
    })

    it('should provide reasonable stat progression starting values', () => {
      const playerStats = PLAYER_BLUEPRINT.components.stats

      expect(playerStats.level).toBe(1)
      expect(playerStats.experience).toBe(0)
      expect(playerStats.experienceToNextLevel).toBeGreaterThan(playerStats.experience)
    })

    it('should have all blueprints contain required rendering info', () => {
      Object.values(ENTITY_BLUEPRINTS).forEach(blueprint => {
        const renderable = blueprint.components.renderable
        expect(renderable).toBeDefined()
        expect(renderable.type).toBeDefined()
        expect(renderable.color).toBeDefined()

        // Color should be valid hex
        expect(renderable.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })

    it('should support blueprint cloning with deep copy behavior', () => {
      const original = PLAYER_BLUEPRINT
      const clone1 = createEntityFromBlueprint(original, {})
      const clone2 = createEntityFromBlueprint(original, {})

      // Both clones should equal original
      expect(clone1.id).toBe(clone2.id)
      expect(clone1.name).toBe(clone2.name)

      // But modifying clone shouldn't affect original or other clone
      clone1.components.health.max = 999
      expect(clone2.components.health.max).toBe(PLAYER_BLUEPRINT.components.health.max)
    })
  })
})

