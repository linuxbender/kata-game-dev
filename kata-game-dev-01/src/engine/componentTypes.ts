import type { Transform } from './components/Transform'
import type { Velocity } from './components/Velocity'
import type { Renderable } from './components/Renderable'
import type { EnemyComponent } from './components/Enemy'

export type GlobalComponents = {
  Transform: Transform
  Velocity: Velocity
  Renderable: Renderable
  Enemy: EnemyComponent
}

export type TypedWorld = import('./ECS').World<GlobalComponents>

