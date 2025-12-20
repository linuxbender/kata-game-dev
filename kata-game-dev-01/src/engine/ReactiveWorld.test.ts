import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReactiveWorld } from './ReactiveWorld'
import type { Entity } from './ECS'

describe('ReactiveWorld', () => {
  let world: ReactiveWorld
  let entity: Entity

  beforeEach(() => {
    world = new ReactiveWorld()
    entity = world.createEntity()
  })

  describe('onComponentChange', () => {
    it('should register a listener', () => {
      const callback = vi.fn()
      const unsubscribe = world.onComponentChange('Transform', callback)

      expect(typeof unsubscribe).toBe('function')
      expect(world.hasListeners('Transform')).toBe(true)
    })

    it('should return unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = world.onComponentChange('Transform', callback)

      expect(unsubscribe).toBeDefined()
      expect(typeof unsubscribe).toBe('function')
    })

    it('should allow multiple listeners for same component', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      world.onComponentChange('Transform', callback1)
      world.onComponentChange('Transform', callback2)

      expect(world.getListenerCount('Transform')).toBe(2)
    })

    it('should allow listeners for different components', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      world.onComponentChange('Transform', callback1)
      world.onComponentChange('Velocity', callback2)

      expect(world.hasListeners('Transform')).toBe(true)
      expect(world.hasListeners('Velocity')).toBe(true)
    })
  })

  describe('addComponent notifications', () => {
    it('should notify listener when component is added', () => {
      const callback = vi.fn()
      world.onComponentChange('Transform', callback)

      const transform = { x: 10, y: 20 }
      world.addComponent(entity, 'Transform', transform)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(entity, transform, 'add')
    })

    it('should not notify if no listeners registered', () => {
      const callback = vi.fn()
      // No listener registered

      const transform = { x: 10, y: 20 }
      world.addComponent(entity, 'Transform', transform)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should notify multiple listeners', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      world.onComponentChange('Transform', callback1)
      world.onComponentChange('Transform', callback2)

      const transform = { x: 10, y: 20 }
      world.addComponent(entity, 'Transform', transform)

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('should pass correct entity and component to listener', () => {
      const callback = vi.fn()
      world.onComponentChange('Velocity', callback)

      const velocity = { x: 5, y: -3 }
      world.addComponent(entity, 'Velocity', velocity)

      expect(callback).toHaveBeenCalledWith(entity, velocity, 'add')
    })
  })

  describe('update notifications', () => {
    it('should notify listener when component is updated', () => {
      const oldTransform = { x: 10, y: 20 }
      const newTransform = { x: 30, y: 40 }

      world.addComponent(entity, 'Transform', oldTransform)

      const callback = vi.fn()
      world.onComponentChange('Transform', callback)

      // Trigger update by adding again
      world.addComponent(entity, 'Transform', newTransform)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(entity, newTransform, 'update')
    })

    it('should handle markComponentUpdated', () => {
      const transform = { x: 10, y: 20 }
      world.addComponent(entity, 'Transform', transform)

      const callback = vi.fn()
      world.onComponentChange('Transform', callback)

      world.markComponentUpdated(entity, 'Transform')

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(entity, transform, 'update')
    })
  })

  describe('unsubscribe functionality', () => {
    it('should unsubscribe listener', () => {
      const callback = vi.fn()
      const unsubscribe = world.onComponentChange('Transform', callback)

      unsubscribe()

      world.addComponent(entity, 'Transform', { x: 10, y: 20 })
      expect(callback).not.toHaveBeenCalled()
    })

    it('should remove listener from count', () => {
      const callback = vi.fn()
      const unsubscribe = world.onComponentChange('Transform', callback)

      expect(world.getListenerCount('Transform')).toBe(1)

      unsubscribe()

      expect(world.getListenerCount('Transform')).toBe(0)
    })

    it('should allow unsubscribe multiple times safely', () => {
      const callback = vi.fn()
      const unsubscribe = world.onComponentChange('Transform', callback)

      unsubscribe()
      unsubscribe()
      unsubscribe()

      expect(world.getListenerCount('Transform')).toBe(0)
    })

    it('should only unsubscribe specific listener', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      const unsubscribe1 = world.onComponentChange('Transform', callback1)
      world.onComponentChange('Transform', callback2)

      unsubscribe1()

      world.addComponent(entity, 'Transform', { x: 10, y: 20 })

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalledTimes(1)
    })
  })

  describe('getListenerStats', () => {
    it('should return empty map when no listeners', () => {
      const stats = world.getListenerStats()

      expect(stats.size).toBe(0)
    })

    it('should return listener counts', () => {
      world.onComponentChange('Transform', vi.fn())
      world.onComponentChange('Transform', vi.fn())
      world.onComponentChange('Velocity', vi.fn())

      const stats = world.getListenerStats()

      expect(stats.get('Transform')).toBe(2)
      expect(stats.get('Velocity')).toBe(1)
    })

    it('should update after unsubscribe', () => {
      const unsubscribe = world.onComponentChange('Transform', vi.fn())
      world.onComponentChange('Transform', vi.fn())

      let stats = world.getListenerStats()
      expect(stats.get('Transform')).toBe(2)

      unsubscribe()

      stats = world.getListenerStats()
      expect(stats.get('Transform')).toBe(1)
    })
  })

  describe('clearAllListeners', () => {
    it('should clear all listeners', () => {
      world.onComponentChange('Transform', vi.fn())
      world.onComponentChange('Velocity', vi.fn())
      world.onComponentChange('Health', vi.fn())

      world.clearAllListeners()

      expect(world.getListenerCount('Transform')).toBe(0)
      expect(world.getListenerCount('Velocity')).toBe(0)
      expect(world.getListenerCount('Health')).toBe(0)
    })

    it('should not notify after clear', () => {
      const callback = vi.fn()
      world.onComponentChange('Transform', callback)

      world.clearAllListeners()

      world.addComponent(entity, 'Transform', { x: 10, y: 20 })

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('hasListeners', () => {
    it('should return false when no listeners', () => {
      expect(world.hasListeners('Transform')).toBe(false)
    })

    it('should return true when has listeners', () => {
      world.onComponentChange('Transform', vi.fn())

      expect(world.hasListeners('Transform')).toBe(true)
    })

    it('should return false after unsubscribe', () => {
      const unsubscribe = world.onComponentChange('Transform', vi.fn())

      expect(world.hasListeners('Transform')).toBe(true)

      unsubscribe()

      expect(world.hasListeners('Transform')).toBe(false)
    })
  })

  describe('getListenerCount', () => {
    it('should return 0 when no listeners', () => {
      expect(world.getListenerCount('Transform')).toBe(0)
    })

    it('should return correct count', () => {
      world.onComponentChange('Transform', vi.fn())
      world.onComponentChange('Transform', vi.fn())
      world.onComponentChange('Transform', vi.fn())

      expect(world.getListenerCount('Transform')).toBe(3)
    })

    it('should update after unsubscribe', () => {
      const unsubscribe1 = world.onComponentChange('Transform', vi.fn())
      const unsubscribe2 = world.onComponentChange('Transform', vi.fn())

      expect(world.getListenerCount('Transform')).toBe(2)

      unsubscribe1()
      expect(world.getListenerCount('Transform')).toBe(1)

      unsubscribe2()
      expect(world.getListenerCount('Transform')).toBe(0)
    })
  })

  describe('Error handling', () => {
    it('should catch and log errors in listeners', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const errorCallback = vi.fn(() => {
        throw new Error('Test error')
      })
      const normalCallback = vi.fn()

      world.onComponentChange('Transform', errorCallback)
      world.onComponentChange('Transform', normalCallback)

      world.addComponent(entity, 'Transform', { x: 10, y: 20 })

      expect(errorCallback).toHaveBeenCalled()
      expect(normalCallback).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should not stop other listeners on error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const callback1 = vi.fn(() => {
        throw new Error('Error 1')
      })
      const callback2 = vi.fn()
      const callback3 = vi.fn()

      world.onComponentChange('Transform', callback1)
      world.onComponentChange('Transform', callback2)
      world.onComponentChange('Transform', callback3)

      world.addComponent(entity, 'Transform', { x: 10, y: 20 })

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
      expect(callback3).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Integration Tests', () => {
    it('should work with multiple entities', () => {
      const callback = vi.fn()
      world.onComponentChange('Transform', callback)

      const entity1 = world.createEntity()
      const entity2 = world.createEntity()

      world.addComponent(entity1, 'Transform', { x: 10, y: 20 })
      world.addComponent(entity2, 'Transform', { x: 30, y: 40 })

      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('should track component lifecycle', () => {
      const events: string[] = []

      world.onComponentChange('Health', (entity, component, type) => {
        events.push(type)
      })

      world.addComponent(entity, 'Health', { current: 100, max: 100 })
      world.addComponent(entity, 'Health', { current: 50, max: 100 }) // update
      world.markComponentUpdated(entity, 'Health')

      expect(events).toEqual(['add', 'update', 'update'])
    })

    it('should handle complex update scenarios', () => {
      const updates: any[] = []

      world.onComponentChange('Velocity', (entity, component, type) => {
        updates.push({
          entity,
          component,
          type,
        })
      })

      world.addComponent(entity, 'Velocity', { x: 1, y: 0 })
      world.addComponent(entity, 'Velocity', { x: 2, y: 0 })
      world.addComponent(entity, 'Velocity', { x: 3, y: 1 })

      expect(updates.length).toBe(3)
      expect(updates[0].type).toBe('add')
      expect(updates[1].type).toBe('update')
      expect(updates[2].type).toBe('update')
    })

    it('should work with different component types', () => {
      const transformCallback = vi.fn()
      const velocityCallback = vi.fn()
      const healthCallback = vi.fn()

      world.onComponentChange('Transform', transformCallback)
      world.onComponentChange('Velocity', velocityCallback)
      world.onComponentChange('Health', healthCallback)

      world.addComponent(entity, 'Transform', { x: 0, y: 0 })
      world.addComponent(entity, 'Velocity', { x: 1, y: 1 })
      world.addComponent(entity, 'Health', { current: 100, max: 100 })

      expect(transformCallback).toHaveBeenCalledTimes(1)
      expect(velocityCallback).toHaveBeenCalledTimes(1)
      expect(healthCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('Performance', () => {
    it('should handle many listeners efficiently', () => {
      const callCount = new Map<number, number>()

      // Create 100 unique callbacks
      for (let i = 0; i < 100; i++) {
        const index = i
        const callback = () => {
          const current = callCount.get(index) || 0
          callCount.set(index, current + 1)
        }
        world.onComponentChange('Transform', callback)
      }

      // Add component once - should notify all 100 listeners exactly once
      world.addComponent(entity, 'Transform', { x: 10, y: 20 })

      // Each listener should have been called exactly once
      expect(callCount.size).toBe(100)
      callCount.forEach((count) => {
        expect(count).toBe(1)
      })
    })

    it('should handle many component updates efficiently', () => {
      const callback = vi.fn()
      world.onComponentChange('Transform', callback)

      // Add component 100 times (first add, then 99 updates)
      for (let i = 0; i < 100; i++) {
        world.addComponent(entity, 'Transform', { x: i, y: i })
      }

      expect(callback).toHaveBeenCalledTimes(100)
    })
  })
})

