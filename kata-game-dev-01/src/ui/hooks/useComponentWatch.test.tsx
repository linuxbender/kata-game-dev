import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { ReactiveWorld } from '@engine/ReactiveWorld'
import { useComponentWatch, useMultipleComponentWatch } from './useComponentWatch'
import type { Entity } from '@engine/ECS'

describe('useComponentWatch', () => {
  let world: ReactiveWorld
  let entity: Entity

  beforeEach(() => {
    world = new ReactiveWorld()
    entity = world.createEntity()
  })

  afterEach(() => {
    cleanup()
    world.clearAllListeners()
  })

  describe('Basic functionality', () => {
    it('should return undefined for non-existent component', () => {
      const { result } = renderHook(() =>
        useComponentWatch(world, entity, 'Transform')
      )

      expect(result.current).toBeUndefined()
    })

    it('should return component value when exists', () => {
      const transform = { x: 10, y: 20 }
      world.addComponent(entity, 'Transform', transform)

      const { result } = renderHook(() =>
        useComponentWatch(world, entity, 'Transform')
      )

      expect(result.current).toEqual(transform)
    })

    it('should handle null world', () => {
      const { result } = renderHook(() =>
        useComponentWatch(null, entity, 'Transform')
      )

      expect(result.current).toBeUndefined()
    })

    it('should handle null entity', () => {
      const { result } = renderHook(() =>
        useComponentWatch(world, null, 'Transform')
      )

      expect(result.current).toBeUndefined()
    })
  })

  describe('Reactive updates', () => {
    it('should update when component is added', async () => {
      const { result } = renderHook(() =>
        useComponentWatch(world, entity, 'Transform')
      )

      expect(result.current).toBeUndefined()

      act(() => {
        world.addComponent(entity, 'Transform', { x: 10, y: 20 })
      })

      await waitFor(() => {
        expect(result.current).toEqual({ x: 10, y: 20 })
      })
    })

    it('should update when component is modified', async () => {
      world.addComponent(entity, 'Transform', { x: 10, y: 20 })

      const { result } = renderHook(() =>
        useComponentWatch(world, entity, 'Transform')
      )

      expect(result.current).toEqual({ x: 10, y: 20 })

      act(() => {
        world.addComponent(entity, 'Transform', { x: 30, y: 40 })
      })

      await waitFor(() => {
        expect(result.current).toEqual({ x: 30, y: 40 })
      })
    })

    it('should not update for different entity', async () => {
      const entity2 = world.createEntity()
      world.addComponent(entity, 'Transform', { x: 10, y: 20 })

      const { result } = renderHook(() =>
        useComponentWatch(world, entity, 'Transform')
      )

      expect(result.current).toEqual({ x: 10, y: 20 })

      act(() => {
        world.addComponent(entity2, 'Transform', { x: 999, y: 999 })
      })

      // Should NOT update
      expect(result.current).toEqual({ x: 10, y: 20 })
    })

    it('should handle multiple updates', async () => {
      const { result } = renderHook(() =>
        useComponentWatch(world, entity, 'Transform')
      )

      for (let i = 0; i < 5; i++) {
        act(() => {
          world.addComponent(entity, 'Transform', { x: i, y: i * 2 })
        })

        await waitFor(() => {
          expect(result.current).toEqual({ x: i, y: i * 2 })
        })
      }
    })
  })

  describe('Cleanup', () => {
    it('should unsubscribe on unmount', () => {
      const { unmount } = renderHook(() =>
        useComponentWatch(world, entity, 'Transform')
      )

      expect(world.hasListeners('Transform')).toBe(true)

      unmount()

      expect(world.hasListeners('Transform')).toBe(false)
    })

    it('should handle multiple mounts/unmounts', () => {
      const { unmount: unmount1 } = renderHook(() =>
        useComponentWatch(world, entity, 'Transform')
      )

      expect(world.getListenerCount('Transform')).toBe(1)

      const { unmount: unmount2 } = renderHook(() =>
        useComponentWatch(world, entity, 'Transform')
      )

      expect(world.getListenerCount('Transform')).toBe(2)

      unmount1()
      expect(world.getListenerCount('Transform')).toBe(1)

      unmount2()
      expect(world.getListenerCount('Transform')).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle rapid component changes', async () => {
      const { result } = renderHook(() =>
        useComponentWatch(world, entity, 'Transform')
      )

      act(() => {
        for (let i = 0; i < 100; i++) {
          world.addComponent(entity, 'Transform', { x: i, y: i })
        }
      })

      await waitFor(() => {
        expect(result.current).toEqual({ x: 99, y: 99 })
      })
    })

    it('should handle component type changes', async () => {
      const { result } = renderHook(() =>
        useComponentWatch(world, entity, 'Health')
      )

      act(() => {
        world.addComponent(entity, 'Health', { current: 100, max: 100 })
      })

      await waitFor(() => {
        expect(result.current).toEqual({ current: 100, max: 100 })
      })

      act(() => {
        world.addComponent(entity, 'Health', { current: 50, max: 100 })
      })

      await waitFor(() => {
        expect(result.current).toEqual({ current: 50, max: 100 })
      })
    })
  })
})

describe('useMultipleComponentWatch', () => {
  let world: ReactiveWorld
  let entity: Entity

  beforeEach(() => {
    world = new ReactiveWorld()
    entity = world.createEntity()
  })

  afterEach(() => {
    cleanup()
    world.clearAllListeners()
  })

  it('should watch multiple components', () => {
    world.addComponent(entity, 'Transform', { x: 10, y: 20 })
    world.addComponent(entity, 'Health', { current: 100, max: 100 })

    const { result } = renderHook(() =>
      useMultipleComponentWatch(world, entity, ['Transform', 'Health'])
    )

    expect(result.current.Transform).toEqual({ x: 10, y: 20 })
    expect(result.current.Health).toEqual({ current: 100, max: 100 })
  })

  it('should update when any component changes', async () => {
    world.addComponent(entity, 'Transform', { x: 10, y: 20 })
    world.addComponent(entity, 'Health', { current: 100, max: 100 })

    const { result } = renderHook(() =>
      useMultipleComponentWatch(world, entity, ['Transform', 'Health'])
    )

    act(() => {
      world.addComponent(entity, 'Transform', { x: 30, y: 40 })
    })

    await waitFor(() => {
      expect(result.current.Transform).toEqual({ x: 30, y: 40 })
    })

    expect(result.current.Health).toEqual({ current: 100, max: 100 })
  })

  it('should handle partial component availability', () => {
    world.addComponent(entity, 'Transform', { x: 10, y: 20 })

    const { result } = renderHook(() =>
      useMultipleComponentWatch(world, entity, ['Transform', 'Health'])
    )

    expect(result.current.Transform).toEqual({ x: 10, y: 20 })
    expect(result.current.Health).toBeUndefined()
  })
})

