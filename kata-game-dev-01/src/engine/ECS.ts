import { EVENT_TYPES } from '@engine/constants'
import type { ComponentKey, EventType } from '@engine/constants'

// Core ECS: World and basic types
export type Entity = number

// Component event types: produce a per-key discriminated union so
// event handlers get strongly-typed `component` payloads when the
// `name` is one of the world's known component keys. We also include
// a string fallback to handle external/unknown component names at runtime.
export type KnownComponentEvent<C extends Record<string, any>, K extends keyof C & ComponentKey> =
  | { type: EVENT_TYPES.ADD | EVENT_TYPES.UPDATE; entity: Entity; name: K; component: C[K] }
  | { type: EVENT_TYPES.REMOVE; entity: Entity; name: K }

export type ComponentEvent<C extends Record<string, any> = Record<string, any>> =
  // Union of all known-key events
  | { [K in keyof C & ComponentKey]: KnownComponentEvent<C, K> }[keyof C & ComponentKey]
  // Fallback for unknown/external names (keeps runtime flexibility)
  | { type: EventType; entity: Entity; name: string; component?: unknown }

/**
 * World stores components in maps keyed by component name.
 * Small pragmatic implementation intended for learning and extension.
 * Now supports component events so external systems (e.g., spatial index)
 * can react to component adds/updates/removals.
 *
 * Note: Public API accepts string for flexibility, but always use COMPONENTS.<KEY>
 * from constants.ts in practice for type safety and consistency.
 */
export class World<C extends Record<string, any> = Record<string, any>> {
  private nextId = 1
  // Map from component key -> Map(entity -> component)
  // Use `unknown` internally and narrow to specific C[K] when accessed —
  // avoids wide `any` while keeping a single container for heterogeneous maps.
  private components = new Map<keyof C & ComponentKey, Map<Entity, unknown>>()
  // Listeners are typed against this world's component map
  private listeners = new Set<(e: ComponentEvent<C>) => void>()
  private elapsedTime = 0  // Track elapsed time for game logic

  // Create a new entity id.
  createEntity = (): Entity => this.nextId++

  // Get elapsed time in seconds since world creation
  getTime = (): number => this.elapsedTime

  // Update world time (called by game loop)
  updateTime = (dt: number): void => {
    this.elapsedTime += dt
  }

  // Subscribe to component events. Returns an unsubscribe function.
  onComponentEvent = (cb: (e: ComponentEvent<C>) => void) => {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  /**
   * Typed subscription helper for a specific known component key.
   * The callback receives a narrowed event where `component` has the exact
   * type for that component key (for 'add'/'update' events).
   * Returns an unsubscribe function.
   */
  onComponentEventFor = <K extends keyof C & ComponentKey>(name: K, cb: (ev: KnownComponentEvent<C, K>) => void) => {
    const wrapper = (e: ComponentEvent<C>) => {
      // Narrow by runtime name equality; if matched, cast to known event type
      if (e.name === name) cb(e as KnownComponentEvent<C, K>)
    }
    this.listeners.add(wrapper)
    return () => this.listeners.delete(wrapper)
  }

  private emit = (ev: ComponentEvent<C>) => {
    for (const l of Array.from(this.listeners)) {
      try { l(ev) } catch (e) { /* listener errors shouldn't break world */ }
    }
  }

  // Add or replace a component for an entity.
  // Emits 'add' if it didn't exist before, otherwise 'update'.
  addComponent = <K extends keyof C & ComponentKey>(entity: Entity, name: K, comp: C[K]): void => {
    // Narrow the stored map to the concrete per-key map type for operations
    let map = this.components.get(name) as Map<Entity, C[K]> | undefined
    if (!map) {
      map = new Map<Entity, C[K]>()
      // Note: stored as Map<Entity, unknown> under the hood
      this.components.set(name, map as Map<Entity, unknown>)
    }
    const existed = map.has(entity)
    map.set(entity, comp)
    // Emit a strongly-typed event for known keys (name is K here)
    const ev: KnownComponentEvent<C, K> = {
      type: existed ? EVENT_TYPES.UPDATE : EVENT_TYPES.ADD,
      entity,
      name,
      component: comp
    }
    this.emit(ev)
  }

  // Get a component of a specific entity if present.
  getComponent = <K extends keyof C & ComponentKey>(entity: Entity, name: K): C[K] | undefined => {
    // Narrow stored map to the concrete type; avoids returning `unknown`.
    const map = this.components.get(name) as Map<Entity, C[K]> | undefined
    return map?.get(entity)
  }

  // Inform listeners that a component has been updated in-place.
  // Useful when systems mutate component objects directly and want to notify subscribers.
  markComponentUpdated = <K extends keyof C & ComponentKey>(entity: Entity, name: K) => {
    const comp = this.getComponent(entity, name)
    if (comp !== undefined) {
      // Emit a typed KnownComponentEvent for this specific key K
      const ev: KnownComponentEvent<C, K> = { type: EVENT_TYPES.UPDATE, entity, name, component: comp }
      this.emit(ev)
    }
  }

  // Query entities that have all requested component names.
  // Returns typed tuple in the same order as names.
  query = <K extends readonly (keyof C & ComponentKey)[]>(...names: K): { entity: Entity; comps: { [P in keyof K]: K[P] extends keyof C ? C[K[P]] : never } }[] => {
    if (names.length === 0) return []
    const first = this.components.get(names[0])
    if (!first) return []
    const result: { entity: Entity; comps: { [P in keyof K]: K[P] extends keyof C ? C[K[P]] : never } }[] = []
    for (const [entity] of first) {
      let ok = true
      const comps: unknown[] = []
      for (const n of names) {
        const map = this.components.get(n) as Map<Entity, unknown> | undefined
        if (!map || !map.has(entity)) { ok = false; break }
        comps.push(map.get(entity))
      }
      if (ok) {
        result.push({ entity, comps: comps as { [P in keyof K]: K[P] extends keyof C ? C[K[P]] : never } })
      }
    }
    return result
  }
}
