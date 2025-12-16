import type { Transform, Velocity, Renderable, EnemyComponent } from '@components'

// GlobalComponents is declared as an interface so it can be augmented via
// declaration merging in other files or packages (useful for plugins).
export interface GlobalComponents {
  Transform: Transform
  Velocity: Velocity
  Renderable: Renderable
  Enemy: EnemyComponent
}

export type TypedWorld = import('./ECS').World<GlobalComponents>
