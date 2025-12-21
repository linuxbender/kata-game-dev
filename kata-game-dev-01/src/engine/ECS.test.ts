import { describe, it, expect, beforeEach, vi } from 'vitest'
import { World, type ComponentSchema, type ComponentEvent } from '@engine/ECS'
import { EVENT_TYPES } from '@engine/constants'

// Test component schema
interface TestComponents extends ComponentSchema {
  position: { x: number; y: number }
  velocity: { dx: number; dy: number }
  health: { hp: number; maxHp: number }
}

// Helper function to check if event has component property
function hasComponent<T extends ComponentSchema>(event: ComponentEvent<T>): event is ComponentEvent<T> & { component: unknown } {
  return 'component' in event && event.component !== undefined
}

describe('World', () => {
  let world: World<TestComponents>

  beforeEach(() => {
    world = new World<TestComponents>()
  })

  describe('createEntity', () => {
    it('should create entities with incrementing IDs', () => {
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()
      const entity3 = world.createEntity()

      expect(entity1).toBe(1)
      expect(entity2).toBe(2)
      expect(entity3).toBe(3)
    })

    it('should return different entities on each call', () => {
      const entities = [world.createEntity(), world.createEntity(), world.createEntity()]
      const uniqueEntities = new Set(entities)
      expect(uniqueEntities.size).toBe(3)
    })
  })

  describe('getTime and updateTime', () => {
    it('should initialize with elapsed time 0', () => {
      expect(world.getTime()).toBe(0)
    })

    it('should update elapsed time', () => {
      world.updateTime(16.67)
      expect(world.getTime()).toBe(16.67)
    })

    it('should accumulate time across multiple updates', () => {
      world.updateTime(10)
      world.updateTime(20)
      world.updateTime(5)
      expect(world.getTime()).toBe(35)
    })
  })

  describe('addComponent', () => {
    it('should add a component to an entity', () => {
      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })

      const component = world.getComponent(entity, 'position')
      expect(component).toEqual({ x: 10, y: 20 })
    })

    it('should add multiple different components to an entity', () => {
      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })
      world.addComponent(entity, 'velocity', { dx: 1, dy: 2 })

      expect(world.getComponent(entity, 'position')).toEqual({ x: 10, y: 20 })
      expect(world.getComponent(entity, 'velocity')).toEqual({ dx: 1, dy: 2 })
    })

    it('should add same component to different entities', () => {
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()

      world.addComponent(entity1, 'position', { x: 10, y: 20 })
      world.addComponent(entity2, 'position', { x: 30, y: 40 })

      expect(world.getComponent(entity1, 'position')).toEqual({ x: 10, y: 20 })
      expect(world.getComponent(entity2, 'position')).toEqual({ x: 30, y: 40 })
    })

    it('should overwrite existing component', () => {
      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })
      world.addComponent(entity, 'position', { x: 30, y: 40 })

      expect(world.getComponent(entity, 'position')).toEqual({ x: 30, y: 40 })
    })

    it('should emit ADD event when adding new component', () => {
      const callback = vi.fn()
      const entity = world.createEntity()
      world.onComponentEvent(callback)

      world.addComponent(entity, 'position', { x: 10, y: 20 })

      expect(callback).toHaveBeenCalledOnce()
      const event = callback.mock.calls[0][0] as ComponentEvent<TestComponents>
      expect(event.type).toBe(EVENT_TYPES.ADD)
      expect(event.entity).toBe(entity)
      expect(event.name).toBe('position')
      expect(hasComponent(event) && event.component).toEqual({ x: 10, y: 20 })
    })

    it('should emit UPDATE event when updating existing component', () => {
      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })

      const callback = vi.fn()
      world.onComponentEvent(callback)

      world.addComponent(entity, 'position', { x: 30, y: 40 })

      expect(callback).toHaveBeenCalledOnce()
      const event = callback.mock.calls[0][0] as ComponentEvent<TestComponents>
      expect(event.type).toBe(EVENT_TYPES.UPDATE)
      expect(event.entity).toBe(entity)
      expect(hasComponent(event) && event.component).toEqual({ x: 30, y: 40 })
    })
  })

  describe('getComponent', () => {
    it('should return undefined for non-existent component', () => {
      const entity = world.createEntity()
      expect(world.getComponent(entity, 'position')).toBeUndefined()
    })

    it('should return undefined for non-existent entity', () => {
      expect(world.getComponent(999, 'position')).toBeUndefined()
    })

    it('should return component for entity that has it', () => {
      const entity = world.createEntity()
      const position = { x: 100, y: 200 }
      world.addComponent(entity, 'position', position)

      expect(world.getComponent(entity, 'position')).toEqual(position)
    })

    it('should return correct component when entity has multiple components', () => {
      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })
      world.addComponent(entity, 'velocity', { dx: 1, dy: 2 })
      world.addComponent(entity, 'health', { hp: 100, maxHp: 100 })

      expect(world.getComponent(entity, 'velocity')).toEqual({ dx: 1, dy: 2 })
    })
  })

  describe('markComponentUpdated', () => {
    it('should emit UPDATE event for existing component', () => {
      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })

      const callback = vi.fn()
      world.onComponentEvent(callback)

      world.markComponentUpdated(entity, 'position')

      expect(callback).toHaveBeenCalledOnce()
      const event = callback.mock.calls[0][0] as ComponentEvent<TestComponents>
      expect(event.type).toBe(EVENT_TYPES.UPDATE)
      expect(event.entity).toBe(entity)
      expect(hasComponent(event) && event.component).toEqual({ x: 10, y: 20 })
    })

    it('should not emit event for non-existent component', () => {
      const entity = world.createEntity()
      const callback = vi.fn()
      world.onComponentEvent(callback)

      world.markComponentUpdated(entity, 'position')

      expect(callback).not.toHaveBeenCalled()
    })

    it('should emit event with current component state', () => {
      const entity = world.createEntity()
      world.addComponent(entity, 'health', { hp: 100, maxHp: 100 })

      const callback = vi.fn()
      world.onComponentEvent(callback)

      world.markComponentUpdated(entity, 'health')

      const event = callback.mock.calls[0][0] as ComponentEvent<TestComponents>
      expect(hasComponent(event) && event.component).toEqual({ hp: 100, maxHp: 100 })
    })
  })

  describe('query', () => {
    it('should return empty array when no entities match', () => {
      world.createEntity()
      const results = world.query('position')
      expect(results).toEqual([])
    })

    it('should return empty array for empty query', () => {
      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })

      const results = world.query()
      expect(results).toEqual([])
    })

    it('should find entity with single component', () => {
      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })

      const results = world.query('position')

      expect(results).toHaveLength(1)
      expect(results[0].entity).toBe(entity)
      expect(results[0].comps).toHaveLength(1)
      expect(results[0].comps[0]).toEqual({ x: 10, y: 20 })
    })

    it('should find entities with multiple components', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, 'position', { x: 10, y: 20 })
      world.addComponent(entity1, 'velocity', { dx: 1, dy: 2 })

      const entity2 = world.createEntity()
      world.addComponent(entity2, 'position', { x: 30, y: 40 })
      world.addComponent(entity2, 'velocity', { dx: 3, dy: 4 })

      const results = world.query('position', 'velocity')

      expect(results).toHaveLength(2)
      expect(results[0].comps).toEqual([{ x: 10, y: 20 }, { dx: 1, dy: 2 }])
      expect(results[1].comps).toEqual([{ x: 30, y: 40 }, { dx: 3, dy: 4 }])
    })

    it('should not find entity missing one of the queried components', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, 'position', { x: 10, y: 20 })

      const entity2 = world.createEntity()
      world.addComponent(entity2, 'position', { x: 30, y: 40 })
      world.addComponent(entity2, 'velocity', { dx: 1, dy: 2 })

      const results = world.query('position', 'velocity')

      expect(results).toHaveLength(1)
      expect(results[0].entity).toBe(entity2)
    })

    it('should return components in correct order', () => {
      const entity = world.createEntity()
      const position = { x: 10, y: 20 }
      const velocity = { dx: 1, dy: 2 }
      const health = { hp: 100, maxHp: 100 }

      world.addComponent(entity, 'position', position)
      world.addComponent(entity, 'velocity', velocity)
      world.addComponent(entity, 'health', health)

      const results = world.query('health', 'velocity', 'position')

      expect(results[0].comps[0]).toEqual(health)
      expect(results[0].comps[1]).toEqual(velocity)
      expect(results[0].comps[2]).toEqual(position)
    })

    it('should handle multiple entities with same component subset', () => {
      const entities = []
      for (let i = 0; i < 5; i++) {
        const entity = world.createEntity()
        world.addComponent(entity, 'position', { x: i, y: i * 2 })
        world.addComponent(entity, 'velocity', { dx: i, dy: i })
        entities.push(entity)
      }

      const results = world.query('position', 'velocity')

      expect(results).toHaveLength(5)
      for (let i = 0; i < 5; i++) {
        expect(results[i].entity).toBe(entities[i])
      }
    })
  })

  describe('onComponentEvent', () => {
    it('should call callback on any component event', () => {
      const callback = vi.fn()
      world.onComponentEvent(callback)

      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })

      expect(callback).toHaveBeenCalledOnce()
    })

    it('should call callback multiple times for multiple events', () => {
      const callback = vi.fn()
      world.onComponentEvent(callback)

      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })
      world.addComponent(entity, 'velocity', { dx: 1, dy: 2 })

      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('should return unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = world.onComponentEvent(callback)

      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })
      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()
      world.addComponent(entity, 'velocity', { dx: 1, dy: 2 })
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should support multiple listeners', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      world.onComponentEvent(callback1)
      world.onComponentEvent(callback2)

      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })

      expect(callback1).toHaveBeenCalledOnce()
      expect(callback2).toHaveBeenCalledOnce()
    })

    it('should catch listener errors and continue', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error')
      })
      const successCallback = vi.fn()

      world.onComponentEvent(errorCallback)
      world.onComponentEvent(successCallback)

      const entity = world.createEntity()
      expect(() => {
        world.addComponent(entity, 'position', { x: 10, y: 20 })
      }).not.toThrow()

      expect(errorCallback).toHaveBeenCalled()
      expect(successCallback).toHaveBeenCalled()
    })
  })

  describe('onComponentEventFor', () => {
    it('should call callback only for specific component', () => {
      const callback = vi.fn()
      world.onComponentEventFor('position', callback)

      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })
      world.addComponent(entity, 'velocity', { dx: 1, dy: 2 })

      expect(callback).toHaveBeenCalledTimes(1)
      const event = callback.mock.calls[0][0]
      expect(event.name).toBe('position')
    })

    it('should return unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = world.onComponentEventFor('position', callback)

      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })
      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()
      world.addComponent(entity, 'position', { x: 30, y: 40 })
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should support multiple specific listeners', () => {
      const positionCallback = vi.fn()
      const velocityCallback = vi.fn()

      world.onComponentEventFor('position', positionCallback)
      world.onComponentEventFor('velocity', velocityCallback)

      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })
      world.addComponent(entity, 'velocity', { dx: 1, dy: 2 })

      expect(positionCallback).toHaveBeenCalledOnce()
      expect(velocityCallback).toHaveBeenCalledOnce()
    })

    it('should not call callback for different component', () => {
      const callback = vi.fn()
      world.onComponentEventFor('position', callback)

      const entity = world.createEntity()
      world.addComponent(entity, 'velocity', { dx: 1, dy: 2 })

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Complex scenarios', () => {
    it('should handle create, add, query, and update workflow', () => {
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()

      world.addComponent(entity1, 'position', { x: 0, y: 0 })
      world.addComponent(entity1, 'velocity', { dx: 1, dy: 1 })

      world.addComponent(entity2, 'position', { x: 10, y: 10 })
      world.addComponent(entity2, 'velocity', { dx: -1, dy: -1 })

      const results = world.query('position', 'velocity')
      expect(results).toHaveLength(2)

      // Simulate movement
      for (const { entity, comps } of results) {
        const [pos, vel] = comps
        world.addComponent(entity, 'position', {
          x: pos.x + vel.dx,
          y: pos.y + vel.dy
        })
      }

      expect(world.getComponent(entity1, 'position')).toEqual({ x: 1, y: 1 })
      expect(world.getComponent(entity2, 'position')).toEqual({ x: 9, y: 9 })
    })

    it('should track component changes through events', () => {
      const events: ComponentEvent<TestComponents>[] = []
      world.onComponentEvent((e) => events.push(e))

      const entity = world.createEntity()
      world.addComponent(entity, 'health', { hp: 100, maxHp: 100 })
      world.addComponent(entity, 'health', { hp: 80, maxHp: 100 })
      world.markComponentUpdated(entity, 'health')

      expect(events).toHaveLength(3)
      expect(events[0].type).toBe(EVENT_TYPES.ADD)
      expect(events[1].type).toBe(EVENT_TYPES.UPDATE)
      expect(events[2].type).toBe(EVENT_TYPES.UPDATE)

      // Filter to get only events with component property
      const eventsWithComponent = events.filter(hasComponent)
      const [, update1, update2] = eventsWithComponent
      expect(update1.component.hp).toBe(80)
      expect(update2.component.hp).toBe(80)
    })

    it('should handle many entities efficiently', () => {
      const entityCount = 1000
      for (let i = 0; i < entityCount; i++) {
        const entity = world.createEntity()
        world.addComponent(entity, 'position', { x: i, y: i })
        if (i % 2 === 0) {
          world.addComponent(entity, 'velocity', { dx: 1, dy: 1 })
        }
      }

      const results = world.query('position', 'velocity')
      expect(results).toHaveLength(500)
    })
  })

  describe('removeComponent', () => {
    it('should remove a component from an entity', () => {
      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })
      
      const position = world.getComponent(entity, 'position')
      expect(position).toEqual({ x: 10, y: 20 })
      
      world.removeComponent(entity, 'position')
      
      const positionAfter = world.getComponent(entity, 'position')
      expect(positionAfter).toBeUndefined()
    })

    it('should emit REMOVE event when component is removed', () => {
      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })
      
      const events: ComponentEvent<TestComponents>[] = []
      world.onComponentEvent((event) => {
        events.push(event)
      })
      
      world.removeComponent(entity, 'position')
      
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe(EVENT_TYPES.REMOVE)
      expect(events[0].entity).toBe(entity)
      expect(events[0].name).toBe('position')
    })

    it('should do nothing if component does not exist', () => {
      const entity = world.createEntity()
      
      const events: ComponentEvent<TestComponents>[] = []
      world.onComponentEvent((event) => {
        events.push(event)
      })
      
      world.removeComponent(entity, 'position')
      
      expect(events).toHaveLength(0)
    })

    it('should only remove specified component', () => {
      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })
      world.addComponent(entity, 'velocity', { dx: 1, dy: 2 })
      
      world.removeComponent(entity, 'position')
      
      const position = world.getComponent(entity, 'position')
      const velocity = world.getComponent(entity, 'velocity')
      expect(position).toBeUndefined()
      expect(velocity).toEqual({ dx: 1, dy: 2 })
    })
  })

  describe('removeEntity', () => {
    it('should remove all components from an entity', () => {
      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })
      world.addComponent(entity, 'velocity', { dx: 1, dy: 2 })
      world.addComponent(entity, 'health', { hp: 100, maxHp: 100 })
      
      world.removeEntity(entity)
      
      expect(world.getComponent(entity, 'position')).toBeUndefined()
      expect(world.getComponent(entity, 'velocity')).toBeUndefined()
      expect(world.getComponent(entity, 'health')).toBeUndefined()
    })

    it('should emit REMOVE events for all components', () => {
      const entity = world.createEntity()
      world.addComponent(entity, 'position', { x: 10, y: 20 })
      world.addComponent(entity, 'velocity', { dx: 1, dy: 2 })
      
      const events: ComponentEvent<TestComponents>[] = []
      world.onComponentEvent((event) => {
        if (event.type === EVENT_TYPES.REMOVE) {
          events.push(event)
        }
      })
      
      world.removeEntity(entity)
      
      expect(events.length).toBeGreaterThanOrEqual(2)
      const componentNames = events.map(e => e.name)
      expect(componentNames).toContain('position')
      expect(componentNames).toContain('velocity')
    })

    it('should not affect other entities', () => {
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()
      world.addComponent(entity1, 'position', { x: 10, y: 20 })
      world.addComponent(entity2, 'position', { x: 30, y: 40 })
      
      world.removeEntity(entity1)
      
      expect(world.getComponent(entity1, 'position')).toBeUndefined()
      expect(world.getComponent(entity2, 'position')).toEqual({ x: 30, y: 40 })
    })

    it('should remove entity from query results', () => {
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()
      world.addComponent(entity1, 'position', { x: 10, y: 20 })
      world.addComponent(entity2, 'position', { x: 30, y: 40 })
      
      const resultsBefore = world.query('position')
      expect(resultsBefore).toHaveLength(2)
      
      world.removeEntity(entity1)
      
      const resultsAfter = world.query('position')
      expect(resultsAfter).toHaveLength(1)
      expect(resultsAfter[0].entity).toBe(entity2)
    })

    it('should do nothing if entity has no components', () => {
      const entity = world.createEntity()
      
      const events: ComponentEvent<TestComponents>[] = []
      world.onComponentEvent((event) => {
        events.push(event)
      })
      
      world.removeEntity(entity)
      
      expect(events).toHaveLength(0)
    })
  })
})
