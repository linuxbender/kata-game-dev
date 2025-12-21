/**
 * Reactive World
 *
 * Extends the base World class with simplified reactive capabilities.
 * Provides a simpler API on top of World's existing event system.
 *
 * @example
 * ```ts
 * const world = new ReactiveWorld()
 *
 * // Listen to component changes
 * const unsubscribe = world.onComponentChange('Transform', (entity, component) => {
 *   console.log(`Entity ${entity} transform changed:`, component)
 * })
 *
 * // Add component triggers listener
 * world.addComponent(player, 'Transform', { x: 10, y: 20 })
 *
 * // Unsubscribe when done
 * unsubscribe()
 * ```
 */

import { World } from './ECS'
import type { Entity, ComponentKey, ComponentSchema, KnownComponentEvent } from './ECS'

/**
 * Component change callback type.
 *
 * @param entity - Entity that changed
 * @param component - New component value (undefined on removal)
 * @param type - Type of change ('add' | 'update' | 'remove')
 */
export type ComponentChangeCallback<T = any> = (
  entity: Entity,
  component: T | undefined,
  type: 'add' | 'update' | 'remove'
) => void

/**
 * Unsubscribe function type.
 */
export type UnsubscribeFunction = () => void

/**
 * Reactive World
 *
 * World with simplified reactive component change notifications.
 */
export class ReactiveWorld<C extends ComponentSchema = ComponentSchema> extends World<C> {
  /**
   * Component change listeners.
   * Map<ComponentName, Set<Callbacks>>
   */
  private changeListeners = new Map<string, Set<ComponentChangeCallback>>()

  /**
   * World event unsubscribe functions.
   * Map<ComponentName, UnsubscribeFunction>
   * Only one World listener per component type.
   */
  private worldUnsubscribers = new Map<string, UnsubscribeFunction>()

  /**
   * Listen to component changes.
   *
   * @param componentName - Component to listen to
   * @param callback - Function to call on change
   * @returns Unsubscribe function
   *
   * @example
   * ```ts
   * const unsubscribe = world.onComponentChange('Health', (entity, health, type) => {
   *   if (type === 'update' && health && health.current <= 0) {
   *     console.log(`Entity ${entity} died!`)
   *   }
   * })
   *
   * // Later...
   * unsubscribe()
   * ```
   */
  onComponentChange<T = any>(
    componentName: ComponentKey,
    callback: ComponentChangeCallback<T>
  ): UnsubscribeFunction {
    const key = String(componentName)

    // Get or create listener set
    if (!this.changeListeners.has(key)) {
      this.changeListeners.set(key, new Set())

      // Subscribe to World events for this component (only once per component type)
      const unsubscribeWorld = this.onComponentEventFor(componentName as any, (event: KnownComponentEvent<C, any>) => {
        // For REMOVE events, event.component is undefined
        this.notifyListeners(key, event.entity, 'component' in event ? event.component : undefined, event.type)
      })
      this.worldUnsubscribers.set(key, unsubscribeWorld)
    }

    const listenerSet = this.changeListeners.get(key)!
    listenerSet.add(callback as ComponentChangeCallback)

    // Return unsubscribe function
    return () => {
      listenerSet.delete(callback as ComponentChangeCallback)
      if (listenerSet.size === 0) {
        this.changeListeners.delete(key)
        // Unsubscribe from World events when no more listeners
        const unsubscribeWorld = this.worldUnsubscribers.get(key)
        if (unsubscribeWorld) {
          unsubscribeWorld()
          this.worldUnsubscribers.delete(key)
        }
      }
    }
  }

  /**
   * Notify all listeners for a component.
   *
   * @param componentKey - Component that changed
   * @param entity - Entity that changed
   * @param component - New component value
   * @param type - Type of change
   *
   * @private
   */
  private notifyListeners<T = any>(
    componentKey: string,
    entity: Entity,
    component: T | undefined,
    type: 'add' | 'update' | 'remove'
  ): void {
    const listenerSet = this.changeListeners.get(componentKey)
    if (!listenerSet || listenerSet.size === 0) return

    // Notify all listeners
    listenerSet.forEach(callback => {
      try {
        callback(entity, component, type)
      } catch (error) {
        console.error(`Error in component listener for ${componentKey}:`, error)
      }
    })
  }

  /**
   * Get all active listeners.
   *
   * @returns Map of component names to listener counts
   *
   * @example
   * ```ts
   * const stats = world.getListenerStats()
   * console.log(`Transform listeners: ${stats.get('Transform')}`)
   * ```
   */
  getListenerStats(): Map<string, number> {
    const stats = new Map<string, number>()
    this.changeListeners.forEach((listeners, componentName) => {
      stats.set(componentName, listeners.size)
    })
    return stats
  }

  /**
   * Clear all listeners.
   *
   * Useful for cleanup or scene transitions.
   *
   * @example
   * ```ts
   * world.clearAllListeners()
   * ```
   */
  clearAllListeners(): void {
    this.changeListeners.clear()
    // Unsubscribe all World event listeners
    this.worldUnsubscribers.forEach(unsubscribe => unsubscribe())
    this.worldUnsubscribers.clear()
  }

  /**
   * Check if component has listeners.
   *
   * @param componentName - Component to check
   * @returns true if has listeners
   *
   * @example
   * ```ts
   * if (world.hasListeners('Health')) {
   *   console.log('Health changes are being monitored')
   * }
   * ```
   */
  hasListeners(componentName: ComponentKey): boolean {
    const key = String(componentName)
    const listenerSet = this.changeListeners.get(key)
    return listenerSet !== undefined && listenerSet.size > 0
  }

  /**
   * Get listener count for component.
   *
   * @param componentName - Component to check
   * @returns Number of listeners
   *
   * @example
   * ```ts
   * const count = world.getListenerCount('Transform')
   * console.log(`${count} listeners for Transform`)
   * ```
   */
  getListenerCount(componentName: ComponentKey): number {
    const key = String(componentName)
    const listenerSet = this.changeListeners.get(key)
    return listenerSet ? listenerSet.size : 0
  }
}
