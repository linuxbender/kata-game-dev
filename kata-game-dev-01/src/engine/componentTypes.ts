import type { Transform, Velocity, Renderable, EnemyComponent, Health } from '@components'
import type { ComponentKey } from '@engine/constants'

// Component type mapping: connects COMPONENTS values to their actual types
type ComponentTypeMapping = {
  Transform: Transform
  Velocity: Velocity
  Renderable: Renderable
  Enemy: EnemyComponent
  Health: Health
}

// GlobalComponents auto-generated from COMPONENTS const object
// No more manual duplication of string keys
export type GlobalComponents = {
  [K in ComponentKey]: K extends keyof ComponentTypeMapping ? ComponentTypeMapping[K] : never
}

export type TypedWorld = import('./ECS').World<GlobalComponents>

