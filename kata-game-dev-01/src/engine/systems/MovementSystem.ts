import type { TypedWorld } from '@engine/componentTypes'

// Movement system: updates Transform by Velocity each frame
export const createMovementSystem = () => {
  const update = (world: TypedWorld, dt: number) => {
    const hits = world.query('Transform', 'Velocity')
    for (const h of hits) {
      const entity = h.entity
      const t = h.comps[0]
      const v = h.comps[1]
      t.x += v.vx * dt
      t.y += v.vy * dt
      // Notify world that Transform was updated in-place
      world.markComponentUpdated(entity, 'Transform')
    }
  }

  return { update }
}
