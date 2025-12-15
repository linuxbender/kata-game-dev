import { World } from '../ECS'

export class MovementSystem {
  update(world: World, dt: number) {
    const hits = world.query(['Transform', 'Velocity'])
    for (const h of hits) {
      const t = h.comps[0] as { x: number; y: number }
      const v = h.comps[1] as { vx: number; vy: number }
      t.x += v.vx * dt
      t.y += v.vy * dt
    }
  }
}

