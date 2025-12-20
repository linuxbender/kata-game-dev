import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { ReactiveWorld } from '@engine/ReactiveWorld'
import {
  usePlayerHealth,
  usePlayerTransform,
  usePlayerInventory,
  usePlayerEquipment,
  usePlayerStats,
  useAllEnemies,
  useAllNPCs,
  useAllItems,
  useAllLivingEntities,
  useEntityCount,
} from './useConvenience'
import type { Entity } from '@engine/ECS'

describe('Convenience Hooks', () => {
  let world: ReactiveWorld
  let playerId: Entity

  beforeEach(() => {
    world = new ReactiveWorld()
    playerId = world.createEntity()
  })

  afterEach(() => {
    cleanup()
    world.clearAllListeners()
  })

  describe('usePlayerHealth', () => {
    it('should return player health', () => {
      world.addComponent(playerId, 'Health', { current: 100, max: 100 })

      const { result } = renderHook(() => usePlayerHealth(world, playerId))

      expect(result.current).toEqual({ current: 100, max: 100 })
    })

    it('should update when health changes', async () => {
      world.addComponent(playerId, 'Health', { current: 100, max: 100 })

      const { result } = renderHook(() => usePlayerHealth(world, playerId))

      act(() => {
        world.addComponent(playerId, 'Health', { current: 50, max: 100 })
      })

      await waitFor(() => {
        expect(result.current).toEqual({ current: 50, max: 100 })
      })
    })

    it('should return undefined when no health component', () => {
      const { result } = renderHook(() => usePlayerHealth(world, playerId))

      expect(result.current).toBeUndefined()
    })
  })

  describe('usePlayerTransform', () => {
    it('should return player transform', () => {
      world.addComponent(playerId, 'Transform', { x: 10, y: 20 })

      const { result } = renderHook(() => usePlayerTransform(world, playerId))

      expect(result.current).toEqual({ x: 10, y: 20 })
    })

    it('should update when transform changes', async () => {
      world.addComponent(playerId, 'Transform', { x: 10, y: 20 })

      const { result } = renderHook(() => usePlayerTransform(world, playerId))

      act(() => {
        world.addComponent(playerId, 'Transform', { x: 30, y: 40 })
      })

      await waitFor(() => {
        expect(result.current).toEqual({ x: 30, y: 40 })
      })
    })
  })

  describe('usePlayerInventory', () => {
    it('should return player inventory', () => {
      const inventory = { items: [], capacity: 20 }
      world.addComponent(playerId, 'Inventory', inventory)

      const { result } = renderHook(() => usePlayerInventory(world, playerId))

      expect(result.current).toEqual(inventory)
    })
  })

  describe('usePlayerEquipment', () => {
    it('should return player equipment', () => {
      const equipment = { mainHand: null, offHand: null }
      world.addComponent(playerId, 'Equipment', equipment)

      const { result } = renderHook(() => usePlayerEquipment(world, playerId))

      expect(result.current).toEqual(equipment)
    })
  })

  describe('usePlayerStats', () => {
    it('should return player stats', () => {
      const stats = { strength: 10, dexterity: 10 }
      world.addComponent(playerId, 'CharacterStats', stats)

      const { result } = renderHook(() => usePlayerStats(world, playerId))

      expect(result.current).toEqual(stats)
    })
  })

  describe('useAllEnemies', () => {
    it('should return all enemies', () => {
      const enemy1 = world.createEntity()
      const enemy2 = world.createEntity()
      const npc = world.createEntity()

      world.addComponent(enemy1, 'Enemy', {})
      world.addComponent(enemy1, 'Transform', { x: 0, y: 0 })

      world.addComponent(enemy2, 'Enemy', {})
      world.addComponent(enemy2, 'Transform', { x: 10, y: 10 })

      world.addComponent(npc, 'NPC', {})
      world.addComponent(npc, 'Transform', { x: 20, y: 20 })

      const { result } = renderHook(() => useAllEnemies(world))

      expect(result.current).toHaveLength(2)
      expect(result.current).toContain(enemy1)
      expect(result.current).toContain(enemy2)
      expect(result.current).not.toContain(npc)
    })

    it('should update when enemies are added', async () => {
      const { result } = renderHook(() => useAllEnemies(world))

      expect(result.current).toHaveLength(0)

      const enemy = world.createEntity()

      act(() => {
        world.addComponent(enemy, 'Enemy', {})
        world.addComponent(enemy, 'Transform', { x: 0, y: 0 })
      })

      await waitFor(() => {
        expect(result.current).toHaveLength(1)
        expect(result.current).toContain(enemy)
      })
    })
  })

  describe('useAllNPCs', () => {
    it('should return all NPCs', () => {
      const npc1 = world.createEntity()
      const npc2 = world.createEntity()
      const enemy = world.createEntity()

      world.addComponent(npc1, 'NPC', {})
      world.addComponent(npc1, 'Transform', { x: 0, y: 0 })

      world.addComponent(npc2, 'NPC', {})
      world.addComponent(npc2, 'Transform', { x: 10, y: 10 })

      world.addComponent(enemy, 'Enemy', {})
      world.addComponent(enemy, 'Transform', { x: 20, y: 20 })

      const { result } = renderHook(() => useAllNPCs(world))

      expect(result.current).toHaveLength(2)
      expect(result.current).toContain(npc1)
      expect(result.current).toContain(npc2)
      expect(result.current).not.toContain(enemy)
    })
  })

  describe('useAllItems', () => {
    it('should return all items', () => {
      const item1 = world.createEntity()
      const item2 = world.createEntity()
      const enemy = world.createEntity()

      world.addComponent(item1, 'Item', {})
      world.addComponent(item1, 'Transform', { x: 0, y: 0 })

      world.addComponent(item2, 'Item', {})
      world.addComponent(item2, 'Transform', { x: 10, y: 10 })

      world.addComponent(enemy, 'Enemy', {})
      world.addComponent(enemy, 'Transform', { x: 20, y: 20 })

      const { result } = renderHook(() => useAllItems(world))

      expect(result.current).toHaveLength(2)
      expect(result.current).toContain(item1)
      expect(result.current).toContain(item2)
      expect(result.current).not.toContain(enemy)
    })
  })

  describe('useAllLivingEntities', () => {
    it('should return all entities with health', () => {
      const player = world.createEntity()
      const enemy = world.createEntity()
      const item = world.createEntity()

      world.addComponent(player, 'Health', { current: 100, max: 100 })
      world.addComponent(player, 'Transform', { x: 0, y: 0 })

      world.addComponent(enemy, 'Health', { current: 50, max: 50 })
      world.addComponent(enemy, 'Transform', { x: 10, y: 10 })

      world.addComponent(item, 'Transform', { x: 20, y: 20 })

      const { result } = renderHook(() => useAllLivingEntities(world))

      expect(result.current).toHaveLength(2)
      expect(result.current).toContain(player)
      expect(result.current).toContain(enemy)
      expect(result.current).not.toContain(item)
    })
  })

  describe('useEntityCount', () => {
    it('should return count of entities with component', () => {
      const enemy1 = world.createEntity()
      const enemy2 = world.createEntity()
      const enemy3 = world.createEntity()
      const npc = world.createEntity()

      world.addComponent(enemy1, 'Enemy', {})
      world.addComponent(enemy2, 'Enemy', {})
      world.addComponent(enemy3, 'Enemy', {})
      world.addComponent(npc, 'NPC', {})

      const { result } = renderHook(() => useEntityCount(world, ['Enemy']))

      expect(result.current).toBe(3)
    })

    it('should update when entities are added', async () => {
      const { result } = renderHook(() => useEntityCount(world, ['Enemy']))

      expect(result.current).toBe(0)

      act(() => {
        for (let i = 0; i < 5; i++) {
          const enemy = world.createEntity()
          world.addComponent(enemy, 'Enemy', {})
        }
      })

      await waitFor(() => {
        expect(result.current).toBe(5)
      })
    })
  })

  describe('Integration', () => {
    it('should work with multiple hooks simultaneously', () => {
      world.addComponent(playerId, 'Health', { current: 100, max: 100 })
      world.addComponent(playerId, 'Transform', { x: 10, y: 20 })

      const enemy = world.createEntity()
      world.addComponent(enemy, 'Enemy', {})
      world.addComponent(enemy, 'Transform', { x: 50, y: 50 })

      const { result: healthResult } = renderHook(() => usePlayerHealth(world, playerId))
      const { result: transformResult } = renderHook(() =>
        usePlayerTransform(world, playerId)
      )
      const { result: enemiesResult } = renderHook(() => useAllEnemies(world))

      expect(healthResult.current).toEqual({ current: 100, max: 100 })
      expect(transformResult.current).toEqual({ x: 10, y: 20 })
      expect(enemiesResult.current).toHaveLength(1)
      expect(enemiesResult.current).toContain(enemy)
    })
  })
})

