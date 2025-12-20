/**
 * Convenience Hooks
 *
 * Pre-configured hooks for common game queries.
 * Makes it easy to access frequently needed game state.
 *
 * @example
 * ```tsx
 * function PlayerHealthBar() {
 *   const health = usePlayerHealth(world, playerId)
 *   if (!health) return null
 *   return <div>HP: {health.current}/{health.max}</div>
 * }
 * ```
 */

import { useComponentWatch } from './useComponentWatch'
import { useWorldQuery } from './useWorldQuery'
import type { ReactiveWorld } from '@engine/ReactiveWorld'
import type { Entity } from '@engine/ECS'

/**
 * Watch player health component.
 *
 * @param world - ReactiveWorld instance
 * @param playerId - Player entity ID
 * @returns Health component or undefined
 *
 * @example
 * ```tsx
 * const health = usePlayerHealth(world, playerId)
 * ```
 */
export function usePlayerHealth(
  world: ReactiveWorld | null,
  playerId: Entity | null
) {
  return useComponentWatch<{ current: number; max: number }>(
    world,
    playerId,
    'Health'
  )
}

/**
 * Watch player transform component.
 *
 * @param world - ReactiveWorld instance
 * @param playerId - Player entity ID
 * @returns Transform component or undefined
 *
 * @example
 * ```tsx
 * const position = usePlayerTransform(world, playerId)
 * ```
 */
export function usePlayerTransform(
  world: ReactiveWorld | null,
  playerId: Entity | null
) {
  return useComponentWatch<{ x: number; y: number }>(
    world,
    playerId,
    'Transform'
  )
}

/**
 * Watch player inventory component.
 *
 * @param world - ReactiveWorld instance
 * @param playerId - Player entity ID
 * @returns Inventory component or undefined
 *
 * @example
 * ```tsx
 * const inventory = usePlayerInventory(world, playerId)
 * ```
 */
export function usePlayerInventory(
  world: ReactiveWorld | null,
  playerId: Entity | null
) {
  return useComponentWatch<any>(world, playerId, 'Inventory')
}

/**
 * Watch player equipment component.
 *
 * @param world - ReactiveWorld instance
 * @param playerId - Player entity ID
 * @returns Equipment component or undefined
 *
 * @example
 * ```tsx
 * const equipment = usePlayerEquipment(world, playerId)
 * ```
 */
export function usePlayerEquipment(
  world: ReactiveWorld | null,
  playerId: Entity | null
) {
  return useComponentWatch<any>(world, playerId, 'Equipment')
}

/**
 * Watch player character stats.
 *
 * @param world - ReactiveWorld instance
 * @param playerId - Player entity ID
 * @returns CharacterStats component or undefined
 *
 * @example
 * ```tsx
 * const stats = usePlayerStats(world, playerId)
 * ```
 */
export function usePlayerStats(
  world: ReactiveWorld | null,
  playerId: Entity | null
) {
  return useComponentWatch<any>(world, playerId, 'CharacterStats')
}

/**
 * Query all enemy entities.
 *
 * @param world - ReactiveWorld instance
 * @returns Array of enemy entity IDs
 *
 * @example
 * ```tsx
 * const enemies = useAllEnemies(world)
 * console.log(`${enemies.length} enemies on screen`)
 * ```
 */
export function useAllEnemies(world: ReactiveWorld | null): Entity[] {
  return useWorldQuery(world, ['Enemy', 'Transform'])
}

/**
 * Query all NPC entities.
 *
 * @param world - ReactiveWorld instance
 * @returns Array of NPC entity IDs
 *
 * @example
 * ```tsx
 * const npcs = useAllNPCs(world)
 * ```
 */
export function useAllNPCs(world: ReactiveWorld | null): Entity[] {
  return useWorldQuery(world, ['NPC', 'Transform'])
}

/**
 * Query all item entities.
 *
 * @param world - ReactiveWorld instance
 * @returns Array of item entity IDs
 *
 * @example
 * ```tsx
 * const items = useAllItems(world)
 * ```
 */
export function useAllItems(world: ReactiveWorld | null): Entity[] {
  return useWorldQuery(world, ['Item', 'Transform'])
}

/**
 * Query all entities with health.
 *
 * @param world - ReactiveWorld instance
 * @returns Array of entities with health
 *
 * @example
 * ```tsx
 * const livingEntities = useAllLivingEntities(world)
 * ```
 */
export function useAllLivingEntities(world: ReactiveWorld | null): Entity[] {
  return useWorldQuery(world, ['Health', 'Transform'])
}

/**
 * Watch entity count for performance monitoring.
 *
 * @param world - ReactiveWorld instance
 * @param componentNames - Components to count
 * @returns Number of entities with all specified components
 *
 * @example
 * ```tsx
 * const enemyCount = useEntityCount(world, ['Enemy'])
 * const npcCount = useEntityCount(world, ['NPC'])
 * ```
 */
export function useEntityCount(
  world: ReactiveWorld | null,
  componentNames: string[]
): number {
  const entities = useWorldQuery(world, componentNames as any)
  return entities.length
}

