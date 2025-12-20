/**
 * Component Categories Module
 *
 * Provides a system for organizing and categorizing game components
 * by their function and role in the game system.
 *
 * This allows efficient querying and management of related components
 * without needing to know all specific component types.
 *
 * @example
 * ```ts
 * // Get all movement-related components
 * const movementComps = getComponentsInCategory('movement')
 * // Returns: ['transform', 'velocity']
 *
 * // Get all combat-related components
 * const combatComps = getComponentsInCategory('combat')
 * // Returns: ['health', 'damage', 'ai']
 *
 * // Query component by category
 * const renderableComps = getComponentsInCategory('rendering')
 * // Returns: ['renderable']
 * ```
 */

/**
 * Component category enumeration.
 *
 * Defines logical groupings of components by their function.
 *
 * Categories:
 * - **spatial**: Position and orientation in world space
 * - **movement**: Velocity and acceleration
 * - **rendering**: Visual representation on screen
 * - **collision**: Collision detection and response
 * - **physics**: Physics simulation (reserved)
 * - **combat**: Health, damage, stats
 * - **ai**: Artificial intelligence behavior
 * - **inventory**: Item storage and management
 * - **equipment**: Worn items and loadouts
 * - **metadata**: Entity classification and tagging
 *
 * @example
 * ```ts
 * const spatialCategory = ComponentCategory.SPATIAL
 * // 'spatial'
 *
 * const combatCategory = ComponentCategory.COMBAT
 * // 'combat'
 * ```
 */
export enum ComponentCategory {
  /** Position and rotation in world space */
  SPATIAL = 'spatial',

  /** Velocity and movement vectors */
  MOVEMENT = 'movement',

  /** Visual representation */
  RENDERING = 'rendering',

  /** Collision detection */
  COLLISION = 'collision',

  /** Physics simulation (reserved for future) */
  PHYSICS = 'physics',

  /** Health, damage, combat stats */
  COMBAT = 'combat',

  /** AI behavior and decision-making */
  AI = 'ai',

  /** Item storage and inventory */
  INVENTORY = 'inventory',

  /** Equipped items and gear */
  EQUIPMENT = 'equipment',

  /** Entity metadata and tagging */
  METADATA = 'metadata',
}

/**
 * Component type name.
 * Maps directly to component keys used in the ECS.
 */
export type ComponentName =
  | 'transform'
  | 'velocity'
  | 'renderable'
  | 'collider'
  | 'health'
  | 'damage'
  | 'ai'
  | 'inventory'
  | 'equipment'
  | 'stats'
  | 'metadata'
  | 'enemy'
  | 'particleEmitter'

/**
 * Component categories mapping.
 *
 * Maps each component to its category.
 * Used for querying and organizing components by function.
 *
 * @example
 * ```ts
 * COMPONENT_CATEGORIES['transform']
 * // ComponentCategory.SPATIAL
 *
 * COMPONENT_CATEGORIES['health']
 * // ComponentCategory.COMBAT
 * ```
 */
export const COMPONENT_CATEGORIES: Record<ComponentName, ComponentCategory> = {
  // Spatial category: position and orientation
  transform: ComponentCategory.SPATIAL,

  // Movement category: velocity and acceleration
  velocity: ComponentCategory.MOVEMENT,

  // Rendering category: visual representation
  renderable: ComponentCategory.RENDERING,

  // Collision category: collision detection
  collider: ComponentCategory.COLLISION,

  // Combat category: health and combat stats
  health: ComponentCategory.COMBAT,
  damage: ComponentCategory.COMBAT,

  // AI category: behavior and decision-making
  ai: ComponentCategory.AI,

  // Inventory category: item storage
  inventory: ComponentCategory.INVENTORY,

  // Equipment category: equipped items
  equipment: ComponentCategory.EQUIPMENT,

  // Metadata category: tagging and classification
  stats: ComponentCategory.METADATA,
  metadata: ComponentCategory.METADATA,
  enemy: ComponentCategory.METADATA,

  // Rendering category (extended)
  particleEmitter: ComponentCategory.RENDERING,
}

/**
 * Gets all component names in a specific category.
 *
 * Useful for querying related components or implementing
 * systems that operate on multiple component types.
 *
 * @param category - The category to query
 * @returns Array of component names in the category
 *
 * @example
 * ```ts
 * const spatialComps = getComponentsInCategory(ComponentCategory.SPATIAL)
 * // ['transform']
 *
 * const movementComps = getComponentsInCategory(ComponentCategory.MOVEMENT)
 * // ['velocity']
 *
 * const combatComps = getComponentsInCategory(ComponentCategory.COMBAT)
 * // ['health', 'damage']
 *
 * const renderingComps = getComponentsInCategory(ComponentCategory.RENDERING)
 * // ['renderable', 'particleEmitter']
 * ```
 */
export function getComponentsInCategory(
  category: ComponentCategory
): ComponentName[] {
  return Object.entries(COMPONENT_CATEGORIES)
    .filter(([, comp]) => comp === category)
    .map(([name]) => name as ComponentName)
}

/**
 * Gets the category for a specific component.
 *
 * Useful for determining component role without knowing
 * the enum directly.
 *
 * @param componentName - The component to query
 * @returns The category for this component, or undefined if not found
 *
 * @example
 * ```ts
 * const category = getCategoryForComponent('transform')
 * // ComponentCategory.SPATIAL
 *
 * const combatCategory = getCategoryForComponent('health')
 * // ComponentCategory.COMBAT
 * ```
 */
export function getCategoryForComponent(
  componentName: ComponentName
): ComponentCategory | undefined {
  return COMPONENT_CATEGORIES[componentName]
}

/**
 * Checks if a component belongs to a category.
 *
 * Useful for conditional logic based on component category.
 *
 * @param componentName - The component to check
 * @param category - The category to check against
 * @returns true if component is in category, false otherwise
 *
 * @example
 * ```ts
 * const isSpatial = isComponentInCategory('transform', ComponentCategory.SPATIAL)
 * // true
 *
 * const isCombat = isComponentInCategory('velocity', ComponentCategory.COMBAT)
 * // false
 * ```
 */
export function isComponentInCategory(
  componentName: ComponentName,
  category: ComponentCategory
): boolean {
  return COMPONENT_CATEGORIES[componentName] === category
}

/**
 * Gets all categories that have at least one component.
 *
 * Useful for iterating over all used categories.
 *
 * @returns Array of all categories in use
 *
 * @example
 * ```ts
 * const categories = getAllCategories()
 * // [
 * //   ComponentCategory.SPATIAL,
 * //   ComponentCategory.MOVEMENT,
 * //   ComponentCategory.RENDERING,
 * //   ComponentCategory.COLLISION,
 * //   ComponentCategory.COMBAT,
 * //   ComponentCategory.AI,
 * //   ComponentCategory.INVENTORY,
 * //   ComponentCategory.EQUIPMENT,
 * //   ComponentCategory.METADATA
 * // ]
 * ```
 */
export function getAllCategories(): ComponentCategory[] {
  const uniqueCategories = new Set(Object.values(COMPONENT_CATEGORIES))
  return Array.from(uniqueCategories)
}

/**
 * Gets a summary of all components organized by category.
 *
 * Useful for debugging and understanding system composition.
 *
 * @returns Object mapping each category to its components
 *
 * @example
 * ```ts
 * const summary = getComponentCategorySummary()
 * // {
 * //   'spatial': ['transform'],
 * //   'movement': ['velocity'],
 * //   'rendering': ['renderable', 'particleEmitter'],
 * //   'collision': ['collider'],
 * //   'combat': ['health', 'damage'],
 * //   'ai': ['ai'],
 * //   'inventory': ['inventory'],
 * //   'equipment': ['equipment'],
 * //   'metadata': ['stats', 'metadata', 'enemy']
 * // }
 * ```
 */
export function getComponentCategorySummary(): Record<
  ComponentCategory,
  ComponentName[]
> {
  const summary: Record<ComponentCategory, ComponentName[]> = {} as any

  // Initialize all categories
  Object.values(ComponentCategory).forEach(category => {
    summary[category] = []
  })

  // Populate with components
  Object.entries(COMPONENT_CATEGORIES).forEach(([name, category]) => {
    summary[category].push(name as ComponentName)
  })

  return summary
}

