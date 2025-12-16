import type { TypedWorld } from '@engine/componentTypes'
import type { createQuadTree } from '@engine/spatial/QuadTree'

/**
 * Collision system (prepared, not yet integrated)
 * Detects collisions between entities with Collider components using spatial indexing.
 * Supports trigger volumes and layer-based collision filtering.
 */
export const createCollisionSystem = (quadTree: ReturnType<typeof createQuadTree>) => {
  // Collision event callbacks (prepared for future event system)
  const onCollisionEnter = new Map<number, (self: number, other: number) => void>()
  const onCollisionExit = new Map<number, (self: number, other: number) => void>()

  // Track active collisions for enter/exit events
  const activeCollisions = new Map<number, Set<number>>()

  const update = (world: TypedWorld, dt: number) => {
    // TODO: Implementation when Collider component is added to COMPONENTS enum
    // const entities = world.query(COMPONENTS.TRANSFORM, COMPONENTS.COLLIDER)
    // ... collision detection logic
  }

  const registerCollisionCallback = (
    entity: number,
    onEnter?: (self: number, other: number) => void,
    onExit?: (self: number, other: number) => void
  ) => {
    if (onEnter) onCollisionEnter.set(entity, onEnter)
    if (onExit) onCollisionExit.set(entity, onExit)
  }

  return {
    update,
    registerCollisionCallback,
    getActiveCollisions: (entity: number) => activeCollisions.get(entity) || new Set()
  }
}

