/**
 * useComponentWatch Hook
 *
 * React Hook to watch component changes on a specific entity.
 * Automatically subscribes to component changes and updates React state.
 *
 * @example
 * ```tsx
 * function HealthBar({ entity }: { entity: Entity }) {
 *   const health = useComponentWatch<Health>(world, entity, 'Health')
 *
 *   if (!health) return null
 *
 *   return (
 *     <div className="health-bar">
 *       {health.current} / {health.max}
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
 * Watch a component on a specific entity.
 *
 * @param world - ReactiveWorld instance
 * @param entity - Entity to watch
 * @param componentName - Component name to watch
 * @returns Component value or undefined
 *
 * @example
 * ```tsx
 * const health = useComponentWatch<Health>(world, playerId, 'Health')
 * const transform = useComponentWatch<Transform>(world, playerId, 'Transform')
 * ```
 */
export function useComponentWatch<T = any>(
  world: ReactiveWorld | null,
  entity: Entity | null,
  componentName: ComponentKey
): T | undefined {
  // Get initial component value
  const [component, setComponent] = useState<T | undefined>(() => {
    if (!world || entity === null) return undefined
    return world.getComponent(entity, componentName) as T | undefined
  })

  useEffect(() => {
    if (!world || entity === null) return

    // Subscribe to component changes
    const unsubscribe = world.onComponentChange<T>(componentName, (e, comp, type) => {
      // debug
      try {
        console.debug('[useComponentWatch] event', String(componentName), 'entity', e, 'type', type, 'component', comp)
      } catch {}
      // Only update if this is our entity
      if (e === entity) {
        setComponent(comp as T | undefined)
      }
    })

    // Get current value in case it changed before subscription
    const current = world.getComponent(entity, componentName) as T | undefined
    setComponent(current)

    // Polling fallback to cover missed events (lightweight)
    const poll = setInterval(() => {
      try {
        const now = world.getComponent(entity, componentName) as T | undefined
        setComponent(now)
      } catch {
        // ignore
      }
    }, 250)

    // Cleanup on unmount
    return () => {
      clearInterval(poll)
      unsubscribe()
    }
  }, [world, entity, componentName])

  return component
}

/**
 * Watch multiple components on a specific entity.
 *
 * @param world - ReactiveWorld instance
 * @param entity - Entity to watch
 * @param componentNames - Array of component names
 * @returns Object with component values
 *
 * @example
 * ```tsx
 * const { Health, Transform } = useMultipleComponentWatch(
 *   world,
 *   playerId,
 *   ['Health', 'Transform']
 * )
 * ```
 */
export function useMultipleComponentWatch<T extends Record<string, any>>(
  world: ReactiveWorld | null,
  entity: Entity | null,
  componentNames: ComponentKey[]
): Partial<T> {
  const [components, setComponents] = useState<Partial<T>>(() => {
    if (!world || entity === null) return {}

    const result: Partial<T> = {}
    componentNames.forEach(name => {
      const comp = world.getComponent(entity, name)
      if (comp !== undefined) {
        result[name as keyof T] = comp
      }
    })
    return result
  })

  useEffect(() => {
    if (!world || entity === null) return

    const unsubscribers = componentNames.map(componentName =>
      world.onComponentChange(componentName, (e, comp) => {
        if (e === entity) {
          setComponents(prev => ({
            ...prev,
            [componentName]: comp,
          }))
        }
      })
    )

    // Get current values
    const current: Partial<T> = {}
    componentNames.forEach(name => {
      const comp = world.getComponent(entity, name)
      if (comp !== undefined) {
        current[name as keyof T] = comp
      }
    })
    setComponents(current)

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [world, entity, ...componentNames])

  return components
}
