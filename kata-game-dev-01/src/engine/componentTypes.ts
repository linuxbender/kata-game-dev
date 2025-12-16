import type { Transform, Velocity, Renderable, EnemyComponent, Health } from '@components'

// GlobalComponents maps string literal keys to component types
// Keys match the string values of COMPONENTS enum members
export interface GlobalComponents {
  'Transform': Transform
  'Velocity': Velocity
  'Renderable': Renderable
  'Enemy': EnemyComponent
  'Health': Health
}

export type TypedWorld = import('./ECS').World<GlobalComponents>
