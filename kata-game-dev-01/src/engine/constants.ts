// Component keys: const object provides type-safety without duplication
// Single source of truth for component names and their string values
export const COMPONENTS = {
  TRANSFORM: 'Transform',
  VELOCITY: 'Velocity',
  RENDERABLE: 'Renderable',
  ENEMY: 'Enemy',
  HEALTH: 'Health'
} as const satisfies Record<string, string>

// ComponentKey extracts the string literal union from values ('Transform' | 'Velocity' | ...)
export type ComponentKey = typeof COMPONENTS[keyof typeof COMPONENTS]

// Sentinel values as const object (rare usage pattern, const is sufficient)
export const SENTINELS = {
    UNDEFINED_STRING: 'undefined'
} as const

// Event types: const object for consistency with COMPONENTS pattern
export const EVENT_TYPES = {
  ADD: 'add',
  UPDATE: 'update',
  REMOVE: 'remove'
} as const satisfies Record<string, string>

// EventType extracts string literal union from values
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES]
