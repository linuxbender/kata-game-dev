/**
 * Game State Context
 *
 * Provides global access to the game world and player entity.
 * This context makes it easy for UI components to access game state
 * without prop drilling.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { world, playerId } = useGameState()
 *   const health = world.getComponent(playerId, 'Health')
 *   return <div>HP: {health?.current}</div>
 * }
 * ```
 */

import { createContext, useContext, ReactNode, useMemo } from 'react'
import type { ReactiveWorld } from '@engine/ReactiveWorld'
import type { Entity } from '@engine/ECS'

/**
 * Game context value interface.
 */
export interface GameContextValue {
  /** The reactive world instance */
  world: ReactiveWorld | null

  /** The player entity ID */
  playerId: Entity | null

  /** Whether the game is initialized */
  isInitialized: boolean
}

/**
 * Game State Context.
 */
const GameStateContext = createContext<GameContextValue | undefined>(undefined)

/**
 * Props for GameStateProvider.
 */
export interface GameStateProviderProps {
  /** Child components */
  children: ReactNode

  /** The reactive world instance */
  world: ReactiveWorld | null

  /** The player entity ID */
  playerId: Entity | null
}

/**
 * Game State Provider Component.
 *
 * Wraps the application and provides game state to all children.
 *
 * @param props - Provider props
 * @returns Provider component
 *
 * @example
 * ```tsx
 * function App() {
 *   const [world] = useState(() => new ReactiveWorld())
 *   const [playerId] = useState(() => world.createEntity())
 *
 *   return (
 *     <GameStateProvider world={world} playerId={playerId}>
 *       <Game />
 *     </GameStateProvider>
 *   )
 * }
 * ```
 */
export function GameStateProvider({ children, world, playerId }: GameStateProviderProps) {
  // Memoize the context value to avoid unnecessary re-renders
  const value = useMemo<GameContextValue>(
    () => ({
      world,
      playerId,
      isInitialized: world !== null && playerId !== null,
    }),
    [world, playerId]
  )

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>
}

/**
 * Hook to access game state.
 *
 * Must be used within a GameStateProvider.
 *
 * @returns Game context value
 * @throws Error if used outside GameStateProvider
 *
 * @example
 * ```tsx
 * function HealthDisplay() {
 *   const { world, playerId } = useGameState()
 *
 *   if (!world || !playerId) {
 *     return <div>Loading...</div>
 *   }
 *
 *   const health = world.getComponent(playerId, 'Health')
 *   return <div>HP: {health?.current}</div>
 * }
 * ```
 */
export function useGameState(): GameContextValue {
  const context = useContext(GameStateContext)

  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider')
  }

  return context
}

/**
 * Hook to get the world instance.
 *
 * Convenience hook that returns only the world.
 *
 * @returns World instance or null
 *
 * @example
 * ```tsx
 * function EntityList() {
 *   const world = useWorld()
 *   const enemies = useWorldQuery(world, ['Enemy', 'Transform'])
 *   return <div>{enemies.length} enemies</div>
 * }
 * ```
 */
export function useWorld(): ReactiveWorld | null {
  const { world } = useGameState()
  return world
}

/**
 * Hook to get the player entity ID.
 *
 * Convenience hook that returns only the player ID.
 *
 * @returns Player entity ID or null
 *
 * @example
 * ```tsx
 * function PlayerHealth() {
 *   const playerId = usePlayerId()
 *   const world = useWorld()
 *   const health = useComponentWatch(world, playerId, 'Health')
 *   return <div>HP: {health?.current}</div>
 * }
 * ```
 */
export function usePlayerId(): Entity | null {
  const { playerId } = useGameState()
  return playerId
}

/**
 * Hook to check if game is initialized.
 *
 * @returns true if both world and player are available
 *
 * @example
 * ```tsx
 * function Game() {
 *   const isInitialized = useIsGameInitialized()
 *
 *   if (!isInitialized) {
 *     return <LoadingScreen />
 *   }
 *
 *   return <GameUI />
 * }
 * ```
 */
export function useIsGameInitialized(): boolean {
  const { isInitialized } = useGameState()
  return isInitialized
}

