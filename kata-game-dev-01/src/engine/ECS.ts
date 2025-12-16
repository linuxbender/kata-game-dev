import type { ComponentKey } from './constants'

// Core ECS: World and basic types
export type Entity = number

export type ComponentEvent = {
  type: 'add' | 'update' | 'remove'
  entity: Entity
  name: string  // Flexible: accepts any component name for extensibility
  component?: any
}

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
  private components = new Map<keyof C & ComponentKey, Map<Entity, any>>()  // Uses string for flexibility
  private listeners = new Set<(e: ComponentEvent) => void>()
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
  onComponentEvent = (cb: (e: ComponentEvent) => void) => {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private emit = (ev: ComponentEvent) => {
    for (const l of Array.from(this.listeners)) {
      try { l(ev) } catch (e) { /* listener errors shouldn't break world */ }
    }
  }

  // Add or replace a component for an entity.
  // Emits 'add' if it didn't exist before, otherwise 'update'.
  addComponent = <K extends keyof C & ComponentKey>(entity: Entity, name: K, comp: C[K]): void => {
    let map = this.components.get(name)
    if (!map) {
      map = new Map<Entity, C[K]>()
      this.components.set(name, map)
    }
    const existed = map.has(entity)
    map.set(entity, comp)
    this.emit({ type: existed ? 'update' : 'add', entity, name: String(name), component: comp })
  }

  // Remove a component from an entity and emit event.
  removeComponent = (entity: Entity, name: keyof C & ComponentKey) => {
    const map = this.components.get(name)
    if (!map) return
    const existed = map.has(entity)
    map.delete(entity)
    if (existed) this.emit({ type: 'remove', entity, name: String(name) })
  }

  // Get a component of a specific entity if present.
  getComponent = <K extends keyof C & ComponentKey>(entity: Entity, name: K): C[K] | undefined => {
    return this.components.get(name)?.get(entity)
  }

  // Inform listeners that a component has been updated in-place.
  // Useful when systems mutate component objects directly and want to notify subscribers.
  markComponentUpdated = (entity: Entity, name: keyof C & ComponentKey) => {
    const comp = this.getComponent(entity, name as any)
    if (comp !== undefined) this.emit({ type: 'update', entity, name: String(name), component: comp })
  }

  // Query entities that have all requested component names.
  // The returned comps array is intentionally untyped here to preserve
  // compatibility with existing code; use getComponent with generics for
  // stricter typing at use sites.
  query = (names: (keyof C & ComponentKey)[]): { entity: Entity; comps: any[] }[] => {
    if (names.length === 0) return []
    const first = this.components.get(names[0])
    if (!first) return []
    const result: { entity: Entity; comps: any[] }[] = []
    for (const [entity] of first) {
      let ok = true
      const comps: any[] = []
      for (const n of names) {
        const map = this.components.get(n)
        if (!map || !map.has(entity)) {
          ok = false
          break
        }
        comps.push(map.get(entity))
      }
      if (ok) result.push({ entity, comps })
    }
    return result
  }
}
