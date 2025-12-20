import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { ReactiveWorld } from '@engine/ReactiveWorld'
import {
  useWorldQuery,
  useWorldQueryWithComponents,
  useWorldQueryFilter,
} from './useWorldQuery'
import type { Entity } from '@engine/ECS'

describe('useWorldQuery', () => {
  let world: ReactiveWorld

  beforeEach(() => {
    world = new ReactiveWorld()
  })

  afterEach(() => {
    cleanup()
    world.clearAllListeners()
  })

  describe('Basic functionality', () => {
    it('should return empty array when no entities match', () => {
      const { result } = renderHook(() => useWorldQuery(world, ['Transform', 'Health']))

      expect(result.current).toEqual([])
    })

    it('should return entities with all required components', () => {
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()
      const entity3 = world.createEntity()

      world.addComponent(entity1, 'Transform', { x: 0, y: 0 })
      world.addComponent(entity1, 'Health', { current: 100, max: 100 })

      world.addComponent(entity2, 'Transform', { x: 10, y: 10 })
      world.addComponent(entity2, 'Health', { current: 50, max: 100 })

      world.addComponent(entity3, 'Transform', { x: 20, y: 20 })
      // entity3 has no Health

      const { result } = renderHook(() => useWorldQuery(world, ['Transform', 'Health']))

      expect(result.current).toHaveLength(2)
      expect(result.current).toContain(entity1)
      expect(result.current).toContain(entity2)
      expect(result.current).not.toContain(entity3)
    })

    it('should handle null world', () => {
      const { result } = renderHook(() => useWorldQuery(null, ['Transform']))

      expect(result.current).toEqual([])
    })
  })

  describe('Reactive updates', () => {
    it('should update when matching entity is added', async () => {
      const { result } = renderHook(() => useWorldQuery(world, ['Transform', 'Health']))

      expect(result.current).toHaveLength(0)

      const entity = world.createEntity()

      act(() => {
        world.addComponent(entity, 'Transform', { x: 0, y: 0 })
        world.addComponent(entity, 'Health', { current: 100, max: 100 })
      })

      await waitFor(
        () => {
          expect(result.current).toHaveLength(1)
          expect(result.current).toContain(entity)
        },
        { timeout: 1000 }
      )
    })

    it('should update when entity gains required component', async () => {
      const entity = world.createEntity()
      world.addComponent(entity, 'Transform', { x: 0, y: 0 })

      const { result } = renderHook(() => useWorldQuery(world, ['Transform', 'Health']))

      expect(result.current).toHaveLength(0)

      act(() => {
        world.addComponent(entity, 'Health', { current: 100, max: 100 })
      })

      await waitFor(
        () => {
          expect(result.current).toHaveLength(1)
          expect(result.current).toContain(entity)
        },
        { timeout: 1000 }
      )
    })

    it('should handle multiple entities added simultaneously', async () => {
      const { result } = renderHook(() => useWorldQuery(world, ['Transform']))

      act(() => {
        for (let i = 0; i < 10; i++) {
          const entity = world.createEntity()
          world.addComponent(entity, 'Transform', { x: i, y: i })
        }
      })

      await waitFor(
        () => {
          expect(result.current).toHaveLength(10)
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Performance', () => {
    it('should handle large entity counts', async () => {
      const entities: Entity[] = []

      act(() => {
        for (let i = 0; i < 100; i++) {
          const entity = world.createEntity()
          world.addComponent(entity, 'Transform', { x: i, y: i })
          entities.push(entity)
        }
      })

      const { result } = renderHook(() => useWorldQuery(world, ['Transform']))

      await waitFor(
        () => {
          expect(result.current).toHaveLength(100)
        },
        { timeout: 2000 }
      )
    })
  })
})

describe('useWorldQueryWithComponents', () => {
  let world: ReactiveWorld

  beforeEach(() => {
    world = new ReactiveWorld()
  })

  afterEach(() => {
    cleanup()
    world.clearAllListeners()
  })

  it('should return entities with component data', () => {
    const entity1 = world.createEntity()
    const entity2 = world.createEntity()

    world.addComponent(entity1, 'Transform', { x: 10, y: 20 })
    world.addComponent(entity1, 'Health', { current: 100, max: 100 })

    world.addComponent(entity2, 'Transform', { x: 30, y: 40 })
    world.addComponent(entity2, 'Health', { current: 50, max: 100 })

    const { result } = renderHook(() =>
      useWorldQueryWithComponents(world, ['Transform', 'Health'])
    )

    expect(result.current).toHaveLength(2)

    const result1 = result.current.find(r => r.entity === entity1)
    expect(result1?.components.Transform).toEqual({ x: 10, y: 20 })
    expect(result1?.components.Health).toEqual({ current: 100, max: 100 })

    const result2 = result.current.find(r => r.entity === entity2)
    expect(result2?.components.Transform).toEqual({ x: 30, y: 40 })
    expect(result2?.components.Health).toEqual({ current: 50, max: 100 })
  })

  it('should update when component data changes', async () => {
    const entity = world.createEntity()
    world.addComponent(entity, 'Transform', { x: 10, y: 20 })
    world.addComponent(entity, 'Health', { current: 100, max: 100 })

    const { result } = renderHook(() =>
      useWorldQueryWithComponents(world, ['Transform', 'Health'])
    )

    act(() => {
      world.addComponent(entity, 'Health', { current: 50, max: 100 })
    })

    await waitFor(
      () => {
        const entityResult = result.current.find(r => r.entity === entity)
        expect(entityResult?.components.Health).toEqual({ current: 50, max: 100 })
      },
      { timeout: 1000 }
    )
  })
})

describe('useWorldQueryFilter', () => {
  let world: ReactiveWorld

  beforeEach(() => {
    world = new ReactiveWorld()
  })

  afterEach(() => {
    cleanup()
    world.clearAllListeners()
  })

  it('should filter entities by custom predicate', async () => {
    const entity1 = world.createEntity()
    const entity2 = world.createEntity()
    const entity3 = world.createEntity()

    world.addComponent(entity1, 'Health', { current: 100, max: 100 })
    world.addComponent(entity2, 'Health', { current: 30, max: 100 })
    world.addComponent(entity3, 'Health', { current: 70, max: 100 })

    const { result } = renderHook(() =>
      useWorldQueryFilter(
        world,
        (entity) => {
          const health = world.getComponent(entity, 'Health') as any
          return health && health.current < 50
        },
        []
      )
    )

    await waitFor(
      () => {
        expect(result.current).toHaveLength(1)
        expect(result.current).toContain(entity2)
      },
      { timeout: 1000 }
    )
  })

  it('should update when entities match filter', async () => {
    const entity = world.createEntity()
    world.addComponent(entity, 'Health', { current: 100, max: 100 })

    const { result } = renderHook(() =>
      useWorldQueryFilter(
        world,
        (e) => {
          const health = world.getComponent(e, 'Health') as any
          return health && health.current < 50
        },
        []
      )
    )

    expect(result.current).toHaveLength(0)

    act(() => {
      world.addComponent(entity, 'Health', { current: 30, max: 100 })
    })

    await waitFor(
      () => {
        expect(result.current).toHaveLength(1)
        expect(result.current).toContain(entity)
      },
      { timeout: 1000 }
    )
  })

  it('should handle complex filter logic', async () => {
    const entity1 = world.createEntity()
    const entity2 = world.createEntity()
    const entity3 = world.createEntity()

    world.addComponent(entity1, 'Transform', { x: 10, y: 20 })
    world.addComponent(entity1, 'Health', { current: 30, max: 100 })
    world.addComponent(entity1, 'Enemy', {})

    world.addComponent(entity2, 'Transform', { x: 30, y: 40 })
    world.addComponent(entity2, 'Health', { current: 30, max: 100 })

    world.addComponent(entity3, 'Transform', { x: 50, y: 60 })
    world.addComponent(entity3, 'Health', { current: 90, max: 100 })
    world.addComponent(entity3, 'Enemy', {})

    const { result } = renderHook(() =>
      useWorldQueryFilter(
        world,
        (e) => {
          const health = world.getComponent(e, 'Health') as any
          const enemy = world.getComponent(e, 'Enemy')
          return health && enemy && health.current < 50
        },
        []
      )
    )

    await waitFor(
      () => {
        expect(result.current).toHaveLength(1)
        expect(result.current).toContain(entity1)
      },
      { timeout: 1000 }
    )
  })
})

