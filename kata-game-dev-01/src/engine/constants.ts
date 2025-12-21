/**
 * Component keys: const object provides type-safety without duplication
 *
 * Single source of truth for component names and their string values.
 * Using `as const` enables literal types, paired with `satisfies` for compile-time validation.
 *
 * Benefits:
 * - No manual string duplication between runtime values and type definitions
 * - Automatic type inference for keys and values
 * - Compile-time type safety with satisfies pattern
 * - Single reference point for refactoring
 *
 * @example
 * ```ts
 * const key = COMPONENTS.TRANSFORM // Type: 'Transform' (literal type)
 * world.addComponent(entity, COMPONENTS.VELOCITY, { vx: 1, vy: 2 })
 * ```
 */
export const COMPONENTS = {
    TRANSFORM: 'Transform',
    VELOCITY: 'Velocity',
    RENDERABLE: 'Renderable',
    ENEMY: 'Enemy',
    HEALTH: 'Health',
    INVENTORY: 'Inventory',
    EQUIPMENT: 'Equipment',
    CHARACTER_STATS: 'CharacterStats',
    NPC: 'NPC',
    ITEM: 'Item',
    METADATA: 'Metadata',
    DIALOG_STATE: 'DialogState',
    QUEST_FLAGS: 'QuestFlags'
} as const satisfies Record<string, string>

/**
 * ComponentKey type: union of all component keys
 *
 * Auto-generated from COMPONENTS object values.
 * Extracted using `keyof` to get literal string union type.
 *
 * @example
 * ```ts
 * type Key = ComponentKey
 * // Expands to: 'Transform' | 'Velocity' | 'Renderable' | 'Enemy' | 'Health'
 * ```
 */
export type ComponentKey = typeof COMPONENTS[keyof typeof COMPONENTS]

/**
 * Sentinel values: reserved constants for special cases
 *
 * Used for type-safe representation of undefined/null states.
 * Avoids magic strings throughout the codebase.
 *
 * @example
 * ```ts
 * const value = someValue ?? SENTINELS.UNDEFINED_STRING
 * ```
 */
export const SENTINELS = {
    /** Sentinel value for undefined string state */
    UNDEFINED_STRING: 'undefined'
} as const

/**
 * Event types: const object for component event classification
 *
 * Used to categorize what happened to a component:
 * - ADD: Component was added to an entity for the first time
 * - UPDATE: Component was modified on an existing entity
 * - REMOVE: Component was removed from an entity
 *
 * Follows the same pattern as COMPONENTS for consistency.
 *
 * @example
 * ```ts
 * world.onComponentEvent((event) => {
 *   if (event.type === EVENT_TYPES.ADD) {
 *     // New component added
 *   } else if (event.type === EVENT_TYPES.UPDATE) {
 *     // Component modified
 *   } else if (event.type === EVENT_TYPES.REMOVE) {
 *     // Component removed
 *   }
 * })
 * ```
 */
export const EVENT_TYPES = {
    /** Component was added to an entity */
    ADD: 'add',
    /** Component was updated on an entity */
    UPDATE: 'update',
    /** Component was removed from an entity */
    REMOVE: 'remove'
} as const satisfies Record<string, string>

/**
 * EventType type: union of all event types
 *
 * Auto-generated from EVENT_TYPES object values.
 * Use this for type-safe event filtering and handling.
 *
 * @example
 * ```ts
 * type Type = EventType
 * // Expands to: 'add' | 'update' | 'remove'
 *
 * const isAddEvent = (type: EventType): boolean => type === EVENT_TYPES.ADD
 * ```
 */
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES]
