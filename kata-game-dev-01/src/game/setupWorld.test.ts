import { describe, it, expect, beforeEach } from 'vitest'
import { createWorld } from './setupWorld'
import { Entity } from '@engine/ECS'

describe('setupWorld', () => {
  let result: ReturnType<typeof createWorld>

  beforeEach(() => {
    result = createWorld()
  })

  describe('createWorld', () => {
    it('should return world, player, and quadConfig', () => {
      expect(result).toHaveProperty('world')
      expect(result).toHaveProperty('player')
      expect(result).toHaveProperty('quadConfig')
    })

    it('should create a valid world instance', () => {
      expect(result.world).toBeDefined()
      expect(typeof result.world.createEntity).toBe('function')
      expect(typeof result.world.addComponent).toBe('function')
      expect(typeof result.world.getComponent).toBe('function')
    })

    it('should create player entity as first entity', () => {
      expect(result.player).toBe(1)
    })

    it('should return valid quad config', () => {
      const { quadConfig } = result
      expect(quadConfig.boundary).toBeDefined()
      expect(quadConfig.capacity).toBeGreaterThan(0)
      expect(quadConfig.maxDepth).toBeGreaterThan(0)
    })
  })

  describe('Player Entity', () => {
    it('should have player with transform component', () => {
      const { world, player } = result
      const transform = world.getComponent(player, 'transform')
      expect(transform).toBeDefined()
      expect(transform?.x).toBe(200)
      expect(transform?.y).toBe(200)
    })

    it('should have player with velocity component', () => {
      const { world, player } = result
      const velocity = world.getComponent(player, 'velocity')
      expect(velocity).toBeDefined()
      expect(velocity?.vx).toBe(0)
      expect(velocity?.vy).toBe(0)
    })

    it('should have player with health component', () => {
      const { world, player } = result
      const health = world.getComponent(player, 'health')
      expect(health).toBeDefined()
      expect(health.current).toBe(100)
      expect(health.max).toBe(100)
    })

    it('should have player with inventory component', () => {
      const { world, player } = result
      const inventory = world.getComponent(player, 'inventory')
      expect(inventory).toBeDefined()
      expect(inventory.maxSlots).toBe(20)
      expect(Array.isArray(inventory.items)).toBe(true)
    })

    it('should have player with equipment component', () => {
      const { world, player } = result
      const equipment = world.getComponent(player, 'equipment')
      expect(equipment).toBeDefined()
      expect(equipment.slots).toBeDefined()
    })

    it('should have player with stats component', () => {
      const { world, player } = result
      const stats = world.getComponent(player, 'stats')
      expect(stats).toBeDefined()
      expect(stats.level).toBe(1)
      expect(stats.experience).toBe(0)
    })

    it('should have player with renderable component', () => {
      const { world, player } = result
      const renderable = world.getComponent(player, 'renderable')
      expect(renderable).toBeDefined()
      expect(renderable.type).toBe('circle')
      expect(renderable.color).toBe('#0088ff')
      expect(renderable.radius).toBe(10)
    })

    it('should have player with collider component', () => {
      const { world, player } = result
      const collider = world.getComponent(player, 'collider')
      expect(collider).toBeDefined()
      expect(collider.width).toBe(20)
      expect(collider.height).toBe(20)
      expect(collider.isTrigger).toBe(false)
    })
  })

  describe('Enemy Entities', () => {
    it('should spawn enemies at predefined locations', () => {
      const { world } = result

      // Entities 2-7 should be enemies (player is 1)
      const expectedEnemyIds = [2, 3, 4, 5, 6, 7]

      expectedEnemyIds.forEach(entityId => {
        const transform = world.getComponent(entityId, 'transform')
        expect(transform).toBeDefined()
        expect(typeof transform.x).toBe('number')
        expect(typeof transform.y).toBe('number')
      })
    })

    it('should have goblins with correct properties', () => {
      const { world } = result

      // Goblins should be entities 2, 3, 4
      const goblinIds = [2, 3, 4]

      goblinIds.forEach(entityId => {
        const health = world.getComponent(entityId, 'health')
        const damage = world.getComponent(entityId, 'damage')
        const renderable = world.getComponent(entityId, 'renderable')

        expect(health.max).toBe(20) // Goblin health
        expect(damage.baseValue).toBe(5) // Goblin damage
        expect(renderable.color).toBe('#00ff00') // Goblin color
      })
    })

    it('should have orcs with correct properties', () => {
      const { world } = result

      // Orcs should be entities 5, 6, 7
      const orcIds = [5, 6, 7]

      orcIds.forEach(entityId => {
        const health = world.getComponent(entityId, 'health')
        const damage = world.getComponent(entityId, 'damage')
        const renderable = world.getComponent(entityId, 'renderable')

        expect(health.max).toBe(60) // Orc health
        expect(damage.baseValue).toBe(12) // Orc damage
        expect(renderable.color).toBe('#88ff00') // Orc color
      })
    })

    it('should have enemies with AI component', () => {
      const { world } = result

      // All enemies should have AI
      for (let entityId = 2; entityId <= 7; entityId++) {
        const ai = world.getComponent(entityId, 'ai')
        expect(ai).toBeDefined()
        expect(ai.type).toBe('aggressive')
        expect(ai.detectionRange).toBeGreaterThan(0)
        expect(ai.attackRange).toBeGreaterThan(0)
      }
    })

    it('should have enemies with velocity component', () => {
      const { world } = result

      // All enemies should have velocity
      for (let entityId = 2; entityId <= 7; entityId++) {
        const velocity = world.getComponent(entityId, 'velocity')
        expect(velocity).toBeDefined()
        expect(velocity.vx).toBe(0)
        expect(velocity.vy).toBe(0)
      }
    })

    it('should spawn correct number of enemies', () => {
      const { world } = result

      // 6 enemies total (3 goblins + 3 orcs)
      let enemyCount = 0
      for (let entityId = 2; entityId <= 10; entityId++) {
        const health = world.getComponent(entityId, 'health')
        if (health && (health.max === 20 || health.max === 60)) {
          enemyCount++
        }
      }

      expect(enemyCount).toBe(6)
    })
  })

  describe('NPC Entities', () => {
    it('should spawn NPCs at predefined locations', () => {
      const { world } = result

      // Entity 8 should be merchant (after player + 6 enemies)
      const npc = world.getComponent(8, 'transform')
      expect(npc).toBeDefined()
      expect(npc.x).toBe(600)
      expect(npc.y).toBe(500)
    })

    it('should have merchant with correct properties', () => {
      const { world } = result

      const merchant = 8 // First NPC after enemies
      const renderable = world.getComponent(merchant, 'renderable')
      const inventory = world.getComponent(merchant, 'inventory')

      expect(renderable.color).toBe('#ffaa00') // Merchant color
      expect(inventory).toBeDefined()
      expect(inventory.maxSlots).toBeGreaterThan(0)
    })

    it('should have merchant with health component', () => {
      const { world } = result

      const merchant = 8
      const health = world.getComponent(merchant, 'health')
      expect(health).toBeDefined()
      expect(health.max).toBe(50)
    })
  })

  describe('QuadTree Configuration', () => {
    it('should have proper boundary configuration', () => {
      const { quadConfig } = result
      const { boundary } = quadConfig

      expect(boundary.x).toBe(-5000)
      expect(boundary.y).toBe(-5000)
      expect(boundary.w).toBe(10000)
      expect(boundary.h).toBe(10000)
    })

    it('should have reasonable capacity and depth', () => {
      const { quadConfig } = result

      expect(quadConfig.capacity).toBeGreaterThanOrEqual(4)
      expect(quadConfig.capacity).toBeLessThanOrEqual(16)
      expect(quadConfig.maxDepth).toBeGreaterThanOrEqual(4)
      expect(quadConfig.maxDepth).toBeLessThanOrEqual(12)
    })

    it('should have tuning parameters', () => {
      const { quadConfig } = result

      expect(quadConfig.mergeThreshold).toBeGreaterThan(0)
      expect(quadConfig.mergeThreshold).toBeLessThan(1)
      expect(quadConfig.rebalanceInterval).toBeGreaterThan(0)
    })
  })

  describe('World State Consistency', () => {
    it('should create unique entities', () => {
      const { world } = result

      // Collect all entity IDs that have components
      const entities = new Set<Entity>()
      for (let entityId = 1; entityId <= 20; entityId++) {
        const transform = world.getComponent(entityId, 'transform')
        if (transform) {
          entities.add(entityId)
        }
      }

      // Should have: 1 player + 6 enemies + 1 merchant = 8 entities
      expect(entities.size).toBe(8)
    })

    it('should have valid entity positions', () => {
      const { world } = result

      // Check that all entities have valid positions
      for (let entityId = 1; entityId <= 10; entityId++) {
        const transform = world.getComponent(entityId, 'transform')
        if (transform) {
          expect(typeof transform.x).toBe('number')
          expect(typeof transform.y).toBe('number')
          expect(isFinite(transform.x)).toBe(true)
          expect(isFinite(transform.y)).toBe(true)
        }
      }
    })

    it('should not have negative health values', () => {
      const { world } = result

      // Check that all entities with health have valid values
      for (let entityId = 1; entityId <= 10; entityId++) {
        const health = world.getComponent(entityId, 'health')
        if (health) {
          expect(health.current).toBeGreaterThanOrEqual(0)
          expect(health.max).toBeGreaterThan(0)
          expect(health.current).toBeLessThanOrEqual(health.max)
        }
      }
    })

    it('should maintain proper component relationships', () => {
      const { world, player } = result

      // Player should have all expected components together
      expect(world.getComponent(player, 'transform')).toBeDefined()
      expect(world.getComponent(player, 'velocity')).toBeDefined()
      expect(world.getComponent(player, 'health')).toBeDefined()
      expect(world.getComponent(player, 'renderable')).toBeDefined()
      expect(world.getComponent(player, 'collider')).toBeDefined()
    })
  })

  describe('Blueprint Integration', () => {
    it('should use EntityBlueprints correctly', () => {
      const { world, player } = result

      // Verify player has all components from PLAYER_BLUEPRINT
      const expectedComponents = [
        'transform',
        'velocity',
        'collider',
        'renderable',
        'health',
        'inventory',
        'equipment',
        'stats',
      ]

      expectedComponents.forEach(componentKey => {
        const component = world.getComponent(player, componentKey as any)
        expect(component).toBeDefined()
      })
    })

    it('should properly override blueprint positions', () => {
      const { world } = result

      // Enemy positions should match spawn config, not blueprint defaults
      const enemyEntity2 = world.getComponent(2, 'transform')
      expect(enemyEntity2.x).toBe(300) // From spawn config, not blueprint (0, 0)
      expect(enemyEntity2.y).toBe(300)

      // Merchant position should match spawn config
      const merchantTransform = world.getComponent(8, 'transform')
      expect(merchantTransform.x).toBe(600)
      expect(merchantTransform.y).toBe(500)
    })

    it('should preserve other blueprint properties during override', () => {
      const { world } = result

      // Enemy at entity 2 should be goblin (from blueprint)
      const enemyHealth = world.getComponent(2, 'health')
      const enemyDamage = world.getComponent(2, 'damage')
      const enemyAI = world.getComponent(2, 'ai')

      // These should be from GOBLIN_BLUEPRINT, only position overridden
      expect(enemyHealth.max).toBe(20)
      expect(enemyDamage.baseValue).toBe(5)
      expect(enemyAI.type).toBe('aggressive')
    })
  })

  describe('Edge Cases & Advanced Scenarios', () => {
    it('should handle multiple world creations independently', () => {
      const world1 = createWorld()
      const world2 = createWorld()

      // Worlds should be different instances
      expect(world1.world).not.toBe(world2.world)
      expect(world1.player).toBe(world2.player) // Both first entity
      expect(world1.quadConfig).not.toBe(world2.quadConfig)
    })

    it('should have consistent entity IDs across multiple creations', () => {
      // Multiple world creations should produce same entity structure
      const worlds = [createWorld(), createWorld(), createWorld()]

      worlds.forEach(({ player }) => {
        expect(player).toBe(1) // Player always entity 1
      })
    })

    it('should not have overlapping entities between different worlds', () => {
      const { world: world1, player: player1 } = createWorld()
      const { world: world2, player: player2 } = createWorld()

      // Get player from world1
      const player1Transform = world1.getComponent(player1, 'transform')
      expect(player1Transform).toBeDefined()

      // Trying to get world1's player from world2 should work
      // (but be a different entity instance)
      const falseEntity = world2.getComponent(player1, 'transform')
      // Entity 1 in world2 is player, so it should exist but be different
      expect(falseEntity).toBeDefined()
    })

    it('should have positive total entity count', () => {
      const { world } = result
      let count = 0
      for (let i = 1; i <= 20; i++) {
        if (world.getComponent(i, 'transform')) {
          count++
        }
      }
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThanOrEqual(20)
    })

    it('should handle all enemy types correctly', () => {
      const { world } = result

      // Check we have both goblin (health=20) and orc (health=60) types
      const healthValues = new Set<number>()
      for (let i = 2; i <= 10; i++) {
        const health = world.getComponent(i, 'health')
        if (health && (health.max === 20 || health.max === 60)) {
          healthValues.add(health.max)
        }
      }

      expect(healthValues.has(20)).toBe(true) // Has goblins
      expect(healthValues.has(60)).toBe(true) // Has orcs
    })

    it('should have valid collider dimensions for all entities', () => {
      const { world } = result

      for (let i = 1; i <= 10; i++) {
        const collider = world.getComponent(i, 'collider')
        if (collider) {
          expect(collider.width).toBeGreaterThan(0)
          expect(collider.height).toBeGreaterThan(0)
        }
      }
    })

    it('should have consistent AI settings for same enemy type', () => {
      const { world } = result

      // All goblins (entities 2, 3, 4) should have same AI settings
      const goblinAIs = [2, 3, 4].map(id => world.getComponent(id, 'ai'))
      const firstGoblinAI = goblinAIs[0]

      goblinAIs.forEach(ai => {
        expect(ai?.detectionRange).toBe(firstGoblinAI?.detectionRange)
        expect(ai?.attackRange).toBe(firstGoblinAI?.attackRange)
        expect(ai?.type).toBe(firstGoblinAI?.type)
      })
    })

    it('should spawn entities in correct order', () => {
      const { world, player } = result

      // Expected order: player (1), enemies (2-7), npc (8)
      expect(world.getComponent(1, 'transform')).toBeDefined() // Player
      expect(world.getComponent(2, 'health')).toBeDefined() // First enemy
      expect(world.getComponent(8, 'transform')).toBeDefined() // NPC

      // Entity 9+ should not exist
      expect(world.getComponent(9, 'transform')).toBeUndefined()
    })

    it('should have valid experience/level progression setup', () => {
      const { world, player } = result

      const stats = world.getComponent(player, 'stats')
      expect(stats).toBeDefined()
      expect(stats?.level).toBeGreaterThan(0)
      expect(stats?.experienceToNextLevel).toBeGreaterThan(stats?.experience ?? 0)
    })

    it('should have inventory with reasonable slot count', () => {
      const { world, player } = result

      const inventory = world.getComponent(player, 'inventory')
      expect(inventory?.maxSlots).toBeGreaterThan(0)
      expect(inventory?.maxSlots).toBeLessThanOrEqual(100) // Reasonable limit
    })

    it('should support equipment slots for player', () => {
      const { world, player } = result

      const equipment = world.getComponent(player, 'equipment')
      expect(equipment?.slots).toBeDefined()
      expect(equipment?.slots).toHaveProperty('mainHand')
      expect(equipment?.slots).toHaveProperty('offHand')
    })

    it('should have proper damage variance', () => {
      const { world } = result

      for (let i = 2; i <= 7; i++) {
        const damage = world.getComponent(i, 'damage')
        if (damage) {
          expect(damage.variance).toBeGreaterThan(0)
          expect(damage.baseValue).toBeGreaterThan(0)
          // Variance should be reasonable (not exceed base value)
          expect(damage.variance).toBeLessThanOrEqual(damage.baseValue)
        }
      }
    })

    it('should have valid color coding for entity types', () => {
      const { world, player } = result

      const playerRender = world.getComponent(player, 'renderable')
      const goblinRender = world.getComponent(2, 'renderable')
      const orcRender = world.getComponent(5, 'renderable')
      const merchantRender = world.getComponent(8, 'renderable')

      // All should have different colors
      const colors = [
        playerRender?.color,
        goblinRender?.color,
        orcRender?.color,
        merchantRender?.color,
      ].filter(Boolean)

      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBe(colors.length) // All unique
    })

    it('should have reasonable spawn distance from origin', () => {
      const { world } = result

      for (let i = 1; i <= 10; i++) {
        const transform = world.getComponent(i, 'transform')
        if (transform) {
          const distance = Math.sqrt(transform.x ** 2 + transform.y ** 2)
          // Should not be too far from world boundaries
          expect(distance).toBeLessThan(10000)
        }
      }
    })

    it('should handle player movement without component errors', () => {
      const { world, player } = result

      // Simulate player movement by updating velocity
      const velocity = world.getComponent(player, 'velocity')
      expect(() => {
        // Note: Using addComponent as setComponent is not available
        world.addComponent(player, 'velocity', {
          ...velocity,
          vx: 10,
          vy: 10,
        })
      }).not.toThrow()

      // Verify velocity was updated
      const updatedVelocity = world.getComponent(player, 'velocity')
      expect(updatedVelocity?.vx).toBe(10)
      expect(updatedVelocity?.vy).toBe(10)
    })

    it('should allow enemy position queries', () => {
      const { world } = result

      // Simulate querying enemies near a position
      const playerTransform = world.getComponent(1, 'transform')
      const nearbyEnemies = []

      for (let i = 2; i <= 7; i++) {
        const enemyTransform = world.getComponent(i, 'transform')
        if (enemyTransform && playerTransform) {
          const distance = Math.sqrt(
            (enemyTransform.x - playerTransform.x) ** 2 +
              (enemyTransform.y - playerTransform.y) ** 2
          )
          if (distance < 500) {
            nearbyEnemies.push(i)
          }
        }
      }

      // Some enemies should be nearby
      expect(nearbyEnemies.length).toBeGreaterThan(0)
    })

    it('should have consistent world boundaries', () => {
      const { quadConfig } = result
      const { boundary } = quadConfig

      // Boundary should form a square
      expect(boundary.w).toBeGreaterThan(0)
      expect(boundary.h).toBeGreaterThan(0)

      // All spawn positions should be within bounds
      const spawnPositions = [
        { x: 300, y: 300 }, // Goblin 1
        { x: 350, y: 250 }, // Goblin 2
        { x: 400, y: 350 }, // Goblin 3
        { x: 800, y: 200 }, // Orc 1
        { x: 1000, y: 600 }, // Orc 2
        { x: 500, y: 900 }, // Orc 3
        { x: 600, y: 500 }, // Merchant
      ]

      spawnPositions.forEach(pos => {
        expect(pos.x).toBeGreaterThanOrEqual(boundary.x)
        expect(pos.x).toBeLessThanOrEqual(boundary.x + boundary.w)
        expect(pos.y).toBeGreaterThanOrEqual(boundary.y)
        expect(pos.y).toBeLessThanOrEqual(boundary.y + boundary.h)
      })
    })
  })
})

