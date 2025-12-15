export type Entity = number

export class World {
  private nextId = 1
  private components = new Map<string, Map<Entity, any>>()

  createEntity(): Entity {
    return this.nextId++
  }

  addComponent<T>(entity: Entity, name: string, comp: T) {
    let map = this.components.get(name)
    if (!map) {
      map = new Map()
      this.components.set(name, map)
    }
    map.set(entity, comp)
  }

  removeComponent(entity: Entity, name: string) {
    const map = this.components.get(name)
    map?.delete(entity)
  }

  getComponent<T>(entity: Entity, name: string): T | undefined {
    return this.components.get(name)?.get(entity)
  }

  query(names: string[]): { entity: Entity; comps: any[] }[] {
    if (names.length === 0) return []
    const first = this.components.get(names[0])
    if (!first) return []
    const result: { entity: Entity; comps: any[] }[] = []
    for (const [entity] of first) {
      let ok = true
      const comps: any[] = []
      for (const n of names) {
        const map = this.components.get(n)
        if (!map || !map.has(entity)) { ok = false; break }
        comps.push(map.get(entity))
      }
      if (ok) result.push({ entity, comps })
    }
    return result
  }
}

