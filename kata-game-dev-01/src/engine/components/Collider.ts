// Collider component for collision detection
export interface Collider {
  radius: number
  layer: number // bitfield for collision layers (1, 2, 4, 8, etc.)
  isTrigger: boolean // if true, no physics response, only events
  solid: boolean // if false, can pass through
}

// Collision layers as const object with bitfield values
export const COLLISION_LAYERS = {
  NONE: 0,
  PLAYER: 1 << 0,
  ENEMY: 1 << 1,
  PROJECTILE: 1 << 2,
  WALL: 1 << 3,
  TRIGGER: 1 << 4,
  ALL: 0xFFFFFFFF
} as const satisfies Record<string, number>

export type CollisionLayer = typeof COLLISION_LAYERS[keyof typeof COLLISION_LAYERS]

