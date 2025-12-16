import type { Transform, Velocity, Renderable, EnemyComponent, Health } from '@components'
import type { COMPONENTS } from '@engine/constants'

// GlobalComponents is declared as an interface so it can be augmented via
// declaration merging in other files or packages (useful for plugins).
// We map the enum values (ComponentKey) to the concrete component types.
export interface GlobalComponents {
  [COMPONENTS.TRANSFORM]: Transform
  [COMPONENTS.VELOCITY]: Velocity
  [COMPONENTS.RENDERABLE]: Renderable
  [COMPONENTS.ENEMY]: EnemyComponent
  [COMPONENTS.HEALTH]: Health
}

export type TypedWorld = import('./ECS').World<GlobalComponents>
