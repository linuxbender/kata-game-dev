import type { Transform, Velocity, Renderable } from '@components'
import type { EnemyComponent } from '@components'

export type GlobalComponents = {
  Transform: Transform
  Velocity: Velocity
  Renderable: Renderable
  Enemy: EnemyComponent
}

export type TypedWorld = import('./ECS').World<GlobalComponents>
