/**
 * useWorldQuery Hook
 *
 * React Hook to query entities with specific components.
 * Automatically updates when entities matching the query change.
 *
 * @example
 * ```tsx
 * function EnemyList() {
 *   const enemies = useWorldQuery(world, ['Enemy', 'Transform', 'Health'])
 *
 *   return (
 *     <div>
 *       {enemies.map(entity => (
 *         <EnemyCard key={entity} entity={entity} />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */

import { useState, useEffect } from 'react'
import type { ReactiveWorld } from '@engine/ReactiveWorld'
import type { Entity } from '@engine/ECS'
import type { ComponentKey } from '@engine/constants'

/**
 * Query result containing entity and its components.
 */
export interface QueryResult<T extends Record<string, any> = Record<string, any>> {
  entity: Entity
  components: T
}

/**
 * Query entities with specific components.
 *
 * @param world - ReactiveWorld instance
 * @param componentNames - Array of required component names
 * @returns Array of entities that have all specified components
 *
 * @example
 * ```tsx
 * const enemies = useWorldQuery(world, ['Enemy', 'Health'])
 * const players = useWorldQuery(world, ['Player', 'Transform'])
 * ```
 */
export function useWorldQuery(
  world: ReactiveWorld | null,
  componentNames: ComponentKey[]
): Entity[] {
  const [entities, setEntities] = useState<Entity[]>([])

  useEffect(() => {
    if (!world) {
      setEntities([])
      return
    }

    let isMounted = true

    // Function to check if entity has all required components
    const updateQuery = () => {
      if (!isMounted) return

      const results: Entity[] = []

      // Query all entities (simple implementation)
      // In production, use World.query() if available
      const allEntities = world.getAllEntities ? world.getAllEntities() : []

      for (const entity of allEntities) {
        const hasAll = componentNames.every(name =>
          world.getComponent(entity, name) !== undefined
        )
        if (hasAll) {
          results.push(entity)
        }
      }

      setEntities(results)
    }

    // Subscribe to all relevant component changes
    const unsubscribers = componentNames.map(componentName =>
      world.onComponentChange(componentName, () => {
        updateQuery()
      })
    )

    // Initial query
    updateQuery()

    return () => {
      isMounted = false
      unsubscribers.forEach(unsub => unsub())
    }
  }, [world, ...componentNames])

  return entities
}

/**
 * Query entities with components and return full data.
 *
 * @param world - ReactiveWorld instance
 * @param componentNames - Array of required component names
 * @returns Array of query results with entity and components
 *
 * @example
 * ```tsx
 * const results = useWorldQueryWithComponents<{
 *   Transform: Transform,
 *   Health: Health
 * }>(world, ['Transform', 'Health'])
 *
 * results.forEach(({ entity, components }) => {
 *   console.log(entity, components.Transform, components.Health)
 * })
 * ```
 */
export function useWorldQueryWithComponents<T extends Record<string, any>>(
  world: ReactiveWorld | null,
  componentNames: ComponentKey[]
): QueryResult<T>[] {
  const [results, setResults] = useState<QueryResult<T>[]>([])

  useEffect(() => {
    if (!world) {
      setResults([])
      return
    }

    let isMounted = true

    const updateQuery = () => {
      if (!isMounted) return

      const queryResults: QueryResult<T>[] = []

      const allEntities = world.getAllEntities ? world.getAllEntities() : []

      for (const entity of allEntities) {
        const components: Partial<T> = {}
        let hasAll = true

        for (const name of componentNames) {
          const comp = world.getComponent(entity, name)
          if (comp === undefined) {
            hasAll = false
            break
          }
          components[name as keyof T] = comp
        }

        if (hasAll) {
          queryResults.push({
            entity,
            components: components as T,
          })
        }
      }

      setResults(queryResults)
    }

    const unsubscribers = componentNames.map(componentName =>
      world.onComponentChange(componentName, () => {
        updateQuery()
      })
    )

    updateQuery()

    return () => {
      isMounted = false
      unsubscribers.forEach(unsub => unsub())
    }
  }, [world, ...componentNames])

  return results
}

/**
 * Query entities by a filter function.
 *
 * @param world - ReactiveWorld instance
 * @param filter - Filter function
 * @param dependencies - Dependencies for the filter
 * @returns Array of entities matching the filter
 *
 * @example
 * ```tsx
 * const lowHealthEnemies = useWorldQueryFilter(
 *   world,
 *   (entity) => {
 *     const health = world.getComponent(entity, 'Health')
 *     const enemy = world.getComponent(entity, 'Enemy')
 *     return health && enemy && health.current < health.max * 0.3
 *   },
 *   []
 * )
 * ```
 */
export function useWorldQueryFilter(
  world: ReactiveWorld | null,
  filter: (entity: Entity) => boolean,
  dependencies: any[] = []
): Entity[] {
  const [entities, setEntities] = useState<Entity[]>([])

  useEffect(() => {
    if (!world) {
      setEntities([])
      return
    }

    let timeoutId: NodeJS.Timeout | null = null
    let isMounted = true

    const updateQuery = () => {
      if (!isMounted) return

      // Debounce updates to avoid excessive re-renders
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        if (!isMounted) return
        const allEntities = world.getAllEntities ? world.getAllEntities() : []
        const filtered = allEntities.filter(filter)
        setEntities(filtered)
      }, 0)
    }

    // Subscribe to all component changes
    const unsubscribe = world.onComponentEvent ? world.onComponentEvent(() => {
      updateQuery()
    }) : undefined

    // Initial query
    updateQuery()

    // Cleanup
    return () => {
      isMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [world, filter, ...dependencies])

  return entities
}

