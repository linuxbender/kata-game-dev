import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { ReactNode } from 'react'
import { ReactiveWorld } from '@engine/ReactiveWorld'
import {
  GameStateProvider,
  useGameState,
  useWorld,
  usePlayerId,
  useIsGameInitialized,
} from './GameStateContext'
import type { Entity } from '@engine/ECS'

describe('GameStateContext', () => {
  let world: ReactiveWorld
  let playerId: Entity

  beforeEach(() => {
    world = new ReactiveWorld()
    playerId = world.createEntity()
  })

  describe('GameStateProvider', () => {
    it('should provide game state to children', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={world} playerId={playerId}>
          {children}
        </GameStateProvider>
      )

      const { result } = renderHook(() => useGameState(), { wrapper })

      expect(result.current.world).toBe(world)
      expect(result.current.playerId).toBe(playerId)
      expect(result.current.isInitialized).toBe(true)
    })

    it('should handle null world and player', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={null} playerId={null}>
          {children}
        </GameStateProvider>
      )

      const { result } = renderHook(() => useGameState(), { wrapper })

      expect(result.current.world).toBeNull()
      expect(result.current.playerId).toBeNull()
      expect(result.current.isInitialized).toBe(false)
    })

    it('should handle partially initialized state', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={world} playerId={null}>
          {children}
        </GameStateProvider>
      )

      const { result } = renderHook(() => useGameState(), { wrapper })

      expect(result.current.world).toBe(world)
      expect(result.current.playerId).toBeNull()
      expect(result.current.isInitialized).toBe(false)
    })
  })

  describe('useGameState', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = () => {}

      expect(() => {
        renderHook(() => useGameState())
      }).toThrow('useGameState must be used within a GameStateProvider')

      console.error = originalError
    })

    it('should return game context value', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={world} playerId={playerId}>
          {children}
        </GameStateProvider>
      )

      const { result } = renderHook(() => useGameState(), { wrapper })

      expect(result.current).toHaveProperty('world')
      expect(result.current).toHaveProperty('playerId')
      expect(result.current).toHaveProperty('isInitialized')
    })

    it('should have stable reference when props do not change', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={world} playerId={playerId}>
          {children}
        </GameStateProvider>
      )

      const { result, rerender } = renderHook(() => useGameState(), { wrapper })

      const firstRender = result.current

      rerender()

      expect(result.current).toBe(firstRender)
    })
  })

  describe('useWorld', () => {
    it('should return world instance', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={world} playerId={playerId}>
          {children}
        </GameStateProvider>
      )

      const { result } = renderHook(() => useWorld(), { wrapper })

      expect(result.current).toBe(world)
    })

    it('should return null when world is not provided', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={null} playerId={playerId}>
          {children}
        </GameStateProvider>
      )

      const { result } = renderHook(() => useWorld(), { wrapper })

      expect(result.current).toBeNull()
    })
  })

  describe('usePlayerId', () => {
    it('should return player entity ID', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={world} playerId={playerId}>
          {children}
        </GameStateProvider>
      )

      const { result } = renderHook(() => usePlayerId(), { wrapper })

      expect(result.current).toBe(playerId)
    })

    it('should return null when player ID is not provided', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={world} playerId={null}>
          {children}
        </GameStateProvider>
      )

      const { result } = renderHook(() => usePlayerId(), { wrapper })

      expect(result.current).toBeNull()
    })
  })

  describe('useIsGameInitialized', () => {
    it('should return true when both world and player are available', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={world} playerId={playerId}>
          {children}
        </GameStateProvider>
      )

      const { result } = renderHook(() => useIsGameInitialized(), { wrapper })

      expect(result.current).toBe(true)
    })

    it('should return false when world is null', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={null} playerId={playerId}>
          {children}
        </GameStateProvider>
      )

      const { result } = renderHook(() => useIsGameInitialized(), { wrapper })

      expect(result.current).toBe(false)
    })

    it('should return false when player ID is null', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={world} playerId={null}>
          {children}
        </GameStateProvider>
      )

      const { result } = renderHook(() => useIsGameInitialized(), { wrapper })

      expect(result.current).toBe(false)
    })

    it('should return false when both are null', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={null} playerId={null}>
          {children}
        </GameStateProvider>
      )

      const { result } = renderHook(() => useIsGameInitialized(), { wrapper })

      expect(result.current).toBe(false)
    })
  })

  describe('Integration Tests', () => {
    it('should work with multiple hooks together', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={world} playerId={playerId}>
          {children}
        </GameStateProvider>
      )

      const { result: worldResult } = renderHook(() => useWorld(), { wrapper })
      const { result: playerResult } = renderHook(() => usePlayerId(), { wrapper })
      const { result: initResult } = renderHook(() => useIsGameInitialized(), { wrapper })

      expect(worldResult.current).toBe(world)
      expect(playerResult.current).toBe(playerId)
      expect(initResult.current).toBe(true)
    })

    it('should provide access to world methods', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={world} playerId={playerId}>
          {children}
        </GameStateProvider>
      )

      const { result } = renderHook(() => useWorld(), { wrapper })

      expect(result.current).not.toBeNull()
      expect(result.current?.createEntity).toBeDefined()
      expect(result.current?.addComponent).toBeDefined()
      expect(result.current?.getComponent).toBeDefined()
    })

    it('should work with component data access', () => {
      world.addComponent(playerId, 'Health', { current: 100, max: 100 })

      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={world} playerId={playerId}>
          {children}
        </GameStateProvider>
      )

      const { result: worldResult } = renderHook(() => useWorld(), { wrapper })
      const { result: playerResult } = renderHook(() => usePlayerId(), { wrapper })

      const health = worldResult.current?.getComponent(playerResult.current!, 'Health')

      expect(health).toEqual({ current: 100, max: 100 })
    })
  })

  describe('Re-render behavior', () => {
    it('should not cause unnecessary re-renders', () => {
      let renderCount = 0

      const wrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={world} playerId={playerId}>
          {children}
        </GameStateProvider>
      )

      const { rerender } = renderHook(() => {
        renderCount++
        return useGameState()
      }, { wrapper })

      const firstRenderCount = renderCount

      // Force re-render with same props
      rerender()

      // Should only render twice (initial + rerender)
      expect(renderCount).toBe(firstRenderCount + 1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle switching from null to initialized', () => {
      let currentWorld: ReactiveWorld | null = null
      let currentPlayerId: Entity | null = null

      const TestWrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={currentWorld} playerId={currentPlayerId}>
          {children}
        </GameStateProvider>
      )

      const { result, rerender } = renderHook(() => useIsGameInitialized(), {
        wrapper: TestWrapper,
      })

      expect(result.current).toBe(false)

      // Update to initialized state
      currentWorld = world
      currentPlayerId = playerId
      rerender()

      expect(result.current).toBe(true)
    })

    it('should handle switching from initialized to null', () => {
      let currentWorld: ReactiveWorld | null = world
      let currentPlayerId: Entity | null = playerId

      const TestWrapper = ({ children }: { children: ReactNode }) => (
        <GameStateProvider world={currentWorld} playerId={currentPlayerId}>
          {children}
        </GameStateProvider>
      )

      const { result, rerender } = renderHook(() => useIsGameInitialized(), {
        wrapper: TestWrapper,
      })

      expect(result.current).toBe(true)

      // Update to null state
      currentWorld = null
      currentPlayerId = null
      rerender()

      expect(result.current).toBe(false)
    })
  })
})

