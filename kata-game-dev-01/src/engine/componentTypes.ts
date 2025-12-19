import type {EnemyComponent, Health, Renderable, Transform, Velocity} from '@components'
import type {ComponentKey} from '@engine/constants'

/**
 * Maps component keys to their actual runtime types
 * Ensures type safety when working with components
 *
 * @example
 * ```ts
 * type TransformType = ComponentTypeMapping['Transform'] // { x: number; y: number }
 * type HealthType = ComponentTypeMapping['Health'] // { hp: number; maxHp: number }
 * ```
 */
type ComponentTypeMapping = {
    Transform: Transform
    Velocity: Velocity
    Renderable: Renderable
    Enemy: EnemyComponent
    Health: Health
}

/**
 * Global component schema for the entire game world
 *
 * Auto-generated from COMPONENTS enum using mapped types.
 * Eliminates manual duplication of string keys between:
 * - COMPONENTS enum (runtime values)
 * - ComponentTypeMapping (type definitions)
 *
 * @template K Component key from ComponentKey enum
 *
 * @example
 * ```ts
 * // GlobalComponents expands to:
 * type GlobalComponents = {
 *   Transform: Transform
 *   Velocity: Velocity
 *   Renderable: Renderable
 *   Enemy: EnemyComponent
 *   Health: Health
 * }
 * ```
 */
export type GlobalComponents = {
    [K in ComponentKey]: K extends keyof ComponentTypeMapping ? ComponentTypeMapping[K] : never
}

/**
 * Typed World instance for the game engine
 *
 * Pre-configured World class with GlobalComponents as the component schema.
 * Use this instead of creating a raw World instance to get full type safety.
 *
 * @example
 * ```ts
 * import type { TypedWorld } from '@engine/componentTypes'
 *
 * const world: TypedWorld = new World<GlobalComponents>()
 *
 * // Type-safe component operations:
 * world.addComponent(entity, COMPONENTS.TRANSFORM, { x: 0, y: 0 })
 * const transform = world.getComponent(entity, COMPONENTS.TRANSFORM)
 * ```
 */
export type TypedWorld = import('./ECS').World<GlobalComponents>

