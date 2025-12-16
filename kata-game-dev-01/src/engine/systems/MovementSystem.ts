import type { TypedWorld } from '@engine/componentTypes'
import { COMPONENTS } from '@engine/constants'

// Movement system: updates Transform by Velocity each frame
export const createMovementSystem = () => {
  const update = (world: TypedWorld, dt: number) => {
    const hits = world.query(COMPONENTS.TRANSFORM, COMPONENTS.VELOCITY)
    for (const h of hits) {
      const entity = h.entity
      const t = h.comps[0]
      const v = h.comps[1]
      t.x += v.vx * dt
      t.y += v.vy * dt
      // Notify world that Transform was updated in-place
      world.markComponentUpdated(entity, COMPONENTS.TRANSFORM)
    }
  }

  return { update }
}
