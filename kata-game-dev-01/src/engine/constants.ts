// Component keys centralized to avoid string duplication and typos
export enum COMPONENTS {
  TRANSFORM = 'Transform',
  VELOCITY = 'Velocity',
  RENDERABLE = 'Renderable',
  ENEMY = 'Enemy',
  HEALTH = 'Health'
}

// ComponentKey is the enum type
export type ComponentKey = COMPONENTS

// Sentinel values and shared strings used across the engine/game.
// Prefer using actual `undefined` (the JS value) to represent absence.
// Use the string sentinel when you specifically need a string token
// (for serialization, logging, or interoperability).
export const SENTINELS = {
    UNDEFINED_STRING: 'undefined'
} as const

export type Sentinel = typeof SENTINELS[keyof typeof SENTINELS]

// Centralized event type strings for component lifecycle events.
// Use these instead of magic strings throughout the codebase.
export enum EVENT_TYPES {
    ADD = 'add',
    UPDATE = 'update',
    REMOVE = 'remove'
}

// Export a type alias for convenience (the enum itself can be used as a type too)
export type EventType = EVENT_TYPES
