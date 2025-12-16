// Component keys centralized to avoid string duplication and typos
export const COMPONENTS = {
    TRANSFORM: 'Transform',
    VELOCITY: 'Velocity',
    RENDERABLE: 'Renderable',
    ENEMY: 'Enemy',
    HEALTH: 'Health'
} as const

export type ComponentKey = typeof COMPONENTS[keyof typeof COMPONENTS]

// Sentinel values and shared strings used across the engine/game.
// Prefer using actual `undefined` (the JS value) to represent absence.
// Use the string sentinel when you specifically need a string token
// (for serialization, logging, or interoperability).
export const SENTINELS = {
  UNDEFINED_STRING: 'undefined'
} as const

export type Sentinel = typeof SENTINELS[keyof typeof SENTINELS]
