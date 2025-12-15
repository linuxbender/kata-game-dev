// Core ECS: World and basic types
export type Entity = number

/**
 * World stores components in maps keyed by component name.
 * This is a small, pragmatic implementation intended for learning and extension.
 */
export class World {
  private nextId = 1
  private components = new Map<string, Map<Entity, any>>()

  // Create a new entity id.
  createEntity = (): Entity => this.nextId++

  // Add or replace a component for an entity.
  addComponent = <T>(entity: Entity, name: string, comp: T): void => {
    let map = this.components.get(name)
    if (!map) {
      map = new Map<Entity, T>()
      this.components.set(name, map)
    }
    map.set(entity, comp)
  }

  // Remove a component from an entity.
  removeComponent = (entity: Entity, name: string): void => {
    const map = this.components.get(name)
    map?.delete(entity)
  }

  // Get a component of a specific entity if present.
  getComponent = <T>(entity: Entity, name: string): T | undefined => {
    return this.components.get(name)?.get(entity)
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
