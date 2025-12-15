// Core ECS: World and basic types
export type Entity = number

export type ComponentEvent = {
  type: 'add' | 'update' | 'remove'
  entity: Entity
  name: string
  component?: any
}

/**
 * World stores components in maps keyed by component name.
 * Small pragmatic implementation intended for learning and extension.
 * Now supports component events so external systems (e.g., spatial index)
 * can react to component adds/updates/removals.
 */
export class World {
  private nextId = 1
  private components = new Map<string, Map<Entity, any>>()
  private listeners = new Set<(e: ComponentEvent) => void>()

  // Create a new entity id.
  createEntity = (): Entity => this.nextId++

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
  addComponent = <T>(entity: Entity, name: string, comp: T): void => {
    let map = this.components.get(name)
    if (!map) {
      map = new Map<Entity, T>()
      this.components.set(name, map)
    }
    const existed = map.has(entity)
    map.set(entity, comp)
    this.emit({ type: existed ? 'update' : 'add', entity, name, component: comp })
  }

  // Remove a component from an entity and emit event.
  removeComponent = (entity: Entity, name: string) => {
    const map = this.components.get(name)
    if (!map) return
    const existed = map.has(entity)
    map.delete(entity)
    if (existed) this.emit({ type: 'remove', entity, name })
  }

  // Get a component of a specific entity if present.
  getComponent = <T>(entity: Entity, name: string): T | undefined => {
    return this.components.get(name)?.get(entity)
  }

  // Inform listeners that a component has been updated in-place.
  // Useful when systems mutate component objects directly and want to notify subscribers.
  markComponentUpdated = (entity: Entity, name: string) => {
    const comp = this.getComponent(entity, name)
    if (comp !== undefined) this.emit({ type: 'update', entity, name, component: comp })
  }

  // Query entities that have all requested component names.
  query = (names: string[]): { entity: Entity; comps: any[] }[] => {
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
