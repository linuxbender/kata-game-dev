// Component keys: string enum provides autocomplete, refactoring safety, and runtime values
export enum COMPONENTS {
    TRANSFORM = 'Transform',
    VELOCITY = 'Velocity',
    RENDERABLE = 'Renderable',
    ENEMY = 'Enemy',
    HEALTH = 'Health'
}

// ComponentKey extracts the string literal union from enum values
export type ComponentKey = `${COMPONENTS}`

// Sentinel values as const object (rare usage pattern, const is sufficient)
export const SENTINELS = {
    UNDEFINED_STRING: 'undefined'
} as const

// Event types: string enum for consistency with COMPONENTS pattern
export enum EVENT_TYPES {
    ADD = 'add',
    UPDATE = 'update',
    REMOVE = 'remove'
}

// EventType extracts string literal union from enum
export type EventType = `${EVENT_TYPES}`
