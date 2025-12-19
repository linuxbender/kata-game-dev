import { describe, it, expect } from 'vitest'
import type { GlobalComponents, TypedWorld } from '@engine/componentTypes'
import { COMPONENTS } from '@engine/constants'
import { World } from '@engine/ECS'

describe('componentTypes', () => {
  describe('GlobalComponents type', () => {
    it('should have all component keys from COMPONENTS enum', () => {
      // This is a compile-time test - if it compiles, the types are correct
      const componentKeys: (keyof GlobalComponents)[] = [
        COMPONENTS.TRANSFORM as keyof GlobalComponents,
        COMPONENTS.VELOCITY as keyof GlobalComponents,
        COMPONENTS.RENDERABLE as keyof GlobalComponents,
        COMPONENTS.ENEMY as keyof GlobalComponents,
        COMPONENTS.HEALTH as keyof GlobalComponents
      ]

      expect(componentKeys).toHaveLength(5)
      expect(componentKeys).toContain(COMPONENTS.TRANSFORM as keyof GlobalComponents)
    })

    it('should correctly map component keys to their types', () => {
      // Test Transform component type
      const transform: GlobalComponents[typeof COMPONENTS.TRANSFORM] = { x: 10, y: 20 }
      expect(transform).toEqual({ x: 10, y: 20 })
      expect(transform.x).toBe(10)
      expect(transform.y).toBe(20)
    })

    it('should correctly map Velocity component type', () => {
      const velocity: GlobalComponents[typeof COMPONENTS.VELOCITY] = { vx: 1, vy: 2 }
      expect(velocity).toEqual({ vx: 1, vy: 2 })
      expect(velocity.vx).toBe(1)
      expect(velocity.vy).toBe(2)
    })

    it('should correctly map Health component type', () => {
      const health: GlobalComponents[typeof COMPONENTS.HEALTH] = { current: 100, max: 100 }
      expect(health).toEqual({ current: 100, max: 100 })
      expect(health.current).toBe(100)
      expect(health.max).toBe(100)
    })

    it('should correctly map Renderable component type', () => {
      const renderable: GlobalComponents[typeof COMPONENTS.RENDERABLE] = {
        color: '#ffffff',
        size: 32
      }
      expect(renderable.color).toBe('#ffffff')
      expect(renderable.size).toBe(32)
    })

    it('should correctly map Enemy component type', () => {
      const enemy: GlobalComponents[typeof COMPONENTS.ENEMY] = {
        targetEntity: 0,
        attackRange: 50,
        attackDamage: 10,
        attackCooldown: 1000,
        lastAttackTime: 0,
        speed: 100,
        detectionRange: 200,
        spawnX: 0,
        spawnY: 0,
        isReturning: false,
        patrolRadius: 100,
        patrolAngle: 0,
        patrolSpeed: 50
      }
      expect(enemy.targetEntity).toBe(0)
      expect(enemy.attackRange).toBe(50)
      expect(enemy.speed).toBe(100)
    })
  })

  describe('TypedWorld integration', () => {
    it('should create a typed world instance', () => {
      const world: TypedWorld = new World<GlobalComponents>()
      expect(world).toBeDefined()
      expect(typeof world.createEntity).toBe('function')
      expect(typeof world.addComponent).toBe('function')
      expect(typeof world.getComponent).toBe('function')
      expect(typeof world.query).toBe('function')
    })

    it('should support type-safe component operations', () => {
      const world: TypedWorld = new World<GlobalComponents>()
      const entity = world.createEntity()

      // Type-safe: should allow adding Transform with correct type
      world.addComponent(entity, COMPONENTS.TRANSFORM, { x: 0, y: 0 })

      // Type-safe: should retrieve with correct type
      const transform = world.getComponent(entity, COMPONENTS.TRANSFORM)
      expect(transform).toEqual({ x: 0, y: 0 })
    })

    it('should handle multiple component types correctly', () => {
      const world: TypedWorld = new World<GlobalComponents>()
      const entity = world.createEntity()

      // Add different component types
      world.addComponent(entity, COMPONENTS.TRANSFORM, { x: 10, y: 20 })
      world.addComponent(entity, COMPONENTS.VELOCITY, { vx: 1, vy: 2 })
      world.addComponent(entity, COMPONENTS.HEALTH, { current: 100, max: 100 })

      // Retrieve each component type
      const transform = world.getComponent(entity, COMPONENTS.TRANSFORM)
      const velocity = world.getComponent(entity, COMPONENTS.VELOCITY)
      const health = world.getComponent(entity, COMPONENTS.HEALTH)

      expect(transform).toEqual({ x: 10, y: 20 })
      expect(velocity).toEqual({ vx: 1, vy: 2 })
      expect(health).toEqual({ current: 100, max: 100 })
    })

    it('should query entities with typed components', () => {
      const world: TypedWorld = new World<GlobalComponents>()

      // Create entities with different component combinations
      const entity1 = world.createEntity()
      world.addComponent(entity1, COMPONENTS.TRANSFORM, { x: 0, y: 0 })
      world.addComponent(entity1, COMPONENTS.VELOCITY, { vx: 1, vy: 1 })

      const entity2 = world.createEntity()
      world.addComponent(entity2, COMPONENTS.TRANSFORM, { x: 10, y: 10 })
      world.addComponent(entity2, COMPONENTS.VELOCITY, { vx: 2, vy: 2 })

      const entity3 = world.createEntity()
      world.addComponent(entity3, COMPONENTS.TRANSFORM, { x: 20, y: 20 })
      // entity3 has no velocity

      // Query should find only entities with both components
      const results = world.query(COMPONENTS.TRANSFORM, COMPONENTS.VELOCITY)

      expect(results).toHaveLength(2)
      expect(results[0].entity).toBe(entity1)
      expect(results[1].entity).toBe(entity2)

      // Verify component types in results
      const [, firstVelocity] = results[0].comps
      expect(firstVelocity.vx).toBe(1)
      expect(firstVelocity.vy).toBe(1)
    })

    it('should support event listeners with typed components', () => {
      const world: TypedWorld = new World<GlobalComponents>()
      const events: any[] = []

      // Listen for specific component events
      world.onComponentEventFor(COMPONENTS.HEALTH, (event) => {
        events.push(event)
      })

      const entity = world.createEntity()
      world.addComponent(entity, COMPONENTS.HEALTH, { current: 100, max: 100 })
      world.addComponent(entity, COMPONENTS.HEALTH, { current: 80, max: 100 })

      expect(events).toHaveLength(2)
      expect(events[0].name).toBe(COMPONENTS.HEALTH)
      expect(events[1].name).toBe(COMPONENTS.HEALTH)
    })

    it('should work with game entity lifecycle', () => {
      const world: TypedWorld = new World<GlobalComponents>()

      // Simulate player creation
      const player = world.createEntity()
      world.addComponent(player, COMPONENTS.TRANSFORM, { x: 0, y: 0 })
      world.addComponent(player, COMPONENTS.VELOCITY, { vx: 0, vy: 0 })
      world.addComponent(player, COMPONENTS.HEALTH, { current: 100, max: 100 })
      world.addComponent(player, COMPONENTS.RENDERABLE, {
        color: '#00ff00',
        size: 32
      })

      // Simulate enemy creation
      const enemy = world.createEntity()
      world.addComponent(enemy, COMPONENTS.TRANSFORM, { x: 50, y: 50 })
      world.addComponent(enemy, COMPONENTS.VELOCITY, { vx: 0, vy: 0 })
      world.addComponent(enemy, COMPONENTS.HEALTH, { current: 30, max: 30 })
      world.addComponent(enemy, COMPONENTS.ENEMY, {
        targetEntity: player,
        attackRange: 50,
        attackDamage: 10,
        attackCooldown: 1000,
        lastAttackTime: 0,
        speed: 100,
        detectionRange: 200,
        spawnX: 50,
        spawnY: 50,
        isReturning: false,
        patrolRadius: 100,
        patrolAngle: 0,
        patrolSpeed: 50
      })
      world.addComponent(enemy, COMPONENTS.RENDERABLE, {
        color: '#ff0000',
        size: 32
      })

      // Query entities with moveable components
      const moveableEntities = world.query(COMPONENTS.TRANSFORM, COMPONENTS.VELOCITY)
      expect(moveableEntities).toHaveLength(2)

      // Query entities with AI
      const aiEntities = world.query(COMPONENTS.ENEMY)
      expect(aiEntities).toHaveLength(1)
      expect(aiEntities[0].entity).toBe(enemy)

      // Query renderable entities
      const renderableEntities = world.query(COMPONENTS.RENDERABLE)
      expect(renderableEntities).toHaveLength(2)

      // Simulate damage
      const playerHealth = world.getComponent(player, COMPONENTS.HEALTH)
      if (playerHealth) {
        world.addComponent(player, COMPONENTS.HEALTH, {
          current: playerHealth.current - 10,
          max: playerHealth.max
        })
      }

      const updatedPlayerHealth = world.getComponent(player, COMPONENTS.HEALTH)
      expect(updatedPlayerHealth?.current).toBe(90)
    })
  })

  describe('Type safety', () => {
    it('should maintain type information through component lifecycle', () => {
      const world: TypedWorld = new World<GlobalComponents>()
      const entity = world.createEntity()

      const originalTransform = { x: 5, y: 15 }
      world.addComponent(entity, COMPONENTS.TRANSFORM, originalTransform)

      const retrieved = world.getComponent(entity, COMPONENTS.TRANSFORM)
      expect(retrieved).toEqual(originalTransform)

      // Modify and update
      const updatedTransform = { x: 10, y: 20 }
      world.addComponent(entity, COMPONENTS.TRANSFORM, updatedTransform)

      const finalTransform = world.getComponent(entity, COMPONENTS.TRANSFORM)
      expect(finalTransform).toEqual(updatedTransform)
    })

    it('should correctly handle all component types in queries', () => {
      const world: TypedWorld = new World<GlobalComponents>()
      const entity = world.createEntity()

      // Add all component types
      world.addComponent(entity, COMPONENTS.TRANSFORM, { x: 0, y: 0 })
      world.addComponent(entity, COMPONENTS.VELOCITY, { vx: 1, vy: 1 })
      world.addComponent(entity, COMPONENTS.HEALTH, { current: 100, max: 100 })
      world.addComponent(entity, COMPONENTS.RENDERABLE, {
        color: '#ffffff',
        size: 32
      })
      world.addComponent(entity, COMPONENTS.ENEMY, {
        targetEntity: 0,
        attackRange: 50,
        attackDamage: 10,
        attackCooldown: 1000,
        lastAttackTime: 0,
        speed: 100,
        detectionRange: 200,
        spawnX: 0,
        spawnY: 0,
        isReturning: false,
        patrolRadius: 100,
        patrolAngle: 0,
        patrolSpeed: 50
      })

      // Query with all components
      const results = world.query(
        COMPONENTS.TRANSFORM,
        COMPONENTS.VELOCITY,
        COMPONENTS.HEALTH,
        COMPONENTS.RENDERABLE,
        COMPONENTS.ENEMY
      )

      expect(results).toHaveLength(1)
      expect(results[0].comps).toHaveLength(5)

      const [transform, velocity, health, renderable, enemy] = results[0].comps
      expect(transform.x).toBe(0)
      expect(velocity.vx).toBe(1)
      expect(health.current).toBe(100)
      expect(renderable.color).toBe('#ffffff')
      expect(enemy.attackRange).toBe(50)
    })
  })
})

