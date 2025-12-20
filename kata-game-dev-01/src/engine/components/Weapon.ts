/**
 * Weapon Component
 *
 * Defines weapon properties and mechanics.
 * A weapon can be equipped by a character and used for combat.
 *
 * @example
 * ```ts
 * const sword: Weapon = {
 *   id: 'sword_iron',
 *   name: 'Iron Sword',
 *   type: 'sword',
 *   damage: { baseValue: 15, variance: 3 },
 *   attackSpeed: 1.0,
 *   range: 30,
 *   weight: 5.0,
 *   durability: { current: 100, max: 100 },
 *   effects: []
 * }
 * ```
 */

/**
 * Weapon damage configuration.
 * Defines how much damage a weapon deals.
 */
export interface WeaponDamage {
  /** Base damage value */
  baseValue: number
  /** Variance in damage (±) */
  variance: number
  /** Damage type (physical, fire, cold, etc.) */
  type?: 'physical' | 'fire' | 'cold' | 'lightning' | 'magic'
}

/**
 * Weapon durability.
 * Weapons degrade with use and can be repaired.
 */
export interface WeaponDurability {
  /** Current durability */
  current: number
  /** Maximum durability */
  max: number
}

/**
 * Weapon effect - special abilities or modifications.
 * Effects can add status, damage, or other special properties.
 */
export interface WeaponEffect {
  /** Effect ID */
  id: string
  /** Effect name */
  name: string
  /** Effect type (buff, debuff, damage, healing, etc.) */
  type: 'buff' | 'debuff' | 'damage' | 'healing' | 'status' | 'utility'
  /** Effect duration in milliseconds (0 = permanent) */
  duration: number
  /** Effect potency (0-100) */
  potency: number
}

/**
 * Weapon component.
 *
 * Complete weapon definition with damage, durability, and effects.
 * Can be equipped in equipment slots.
 *
 * @example
 * ```ts
 * const weapon: Weapon = {
 *   id: 'sword_iron',
 *   name: 'Iron Sword',
 *   type: 'sword',
 *   damage: { baseValue: 15, variance: 3, type: 'physical' },
 *   attackSpeed: 1.0,
 *   range: 30,
 *   weight: 5.0,
 *   durability: { current: 100, max: 100 },
 *   effects: [],
 *   rarity: 'common',
 *   level: 1
 * }
 * ```
 */
export interface Weapon {
  /** Unique weapon ID */
  id: string
  /** Display name */
  name: string
  /** Weapon type (sword, axe, bow, staff, etc.) */
  type: 'sword' | 'axe' | 'bow' | 'staff' | 'dagger' | 'hammer' | 'spear' | 'custom'
  /** Damage configuration */
  damage: WeaponDamage
  /** Attack speed multiplier (1.0 = normal) */
  attackSpeed: number
  /** Attack range in pixels */
  range: number
  /** Weapon weight (affects movement speed) */
  weight: number
  /** Durability */
  durability: WeaponDurability
  /** Special effects */
  effects: WeaponEffect[]
  /** Weapon rarity */
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  /** Required level to equip */
  level?: number
  /** Optional description */
  description?: string
}

/**
 * Type guard: Check if component is Weapon.
 *
 * @example
 * ```ts
 * if (isWeapon(comp)) {
 *   applyWeaponDamage(comp.damage.baseValue)
 * }
 * ```
 */
export function isWeapon(component: unknown): component is Weapon {
  if (typeof component !== 'object' || component === null) return false
  const obj = component as any
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.damage === 'object' &&
    typeof obj.attackSpeed === 'number' &&
    typeof obj.range === 'number' &&
    typeof obj.weight === 'number' &&
    typeof obj.durability === 'object' &&
    Array.isArray(obj.effects)
  )
}

/**
 * Extract Weapon component if valid.
 *
 * @example
 * ```ts
 * const weapon = extractWeapon(comp)
 * if (weapon) {
 *   console.log(`Wielding ${weapon.name}`)
 * }
 * ```
 */
export function extractWeapon(component: unknown): Weapon | undefined {
  return isWeapon(component) ? component : undefined
}

/**
 * Create a default weapon with sensible defaults.
 *
 * @param id - Unique weapon ID
 * @param name - Display name
 * @param type - Weapon type
 * @param baseValue - Base damage value
 * @returns New weapon
 *
 * @example
 * ```ts
 * const sword = createWeapon('sword_1', 'Iron Sword', 'sword', 15)
 * const bow = createWeapon('bow_1', 'Wooden Bow', 'bow', 12)
 * ```
 */
export function createWeapon(
  id: string,
  name: string,
  type: Weapon['type'],
  baseValue: number
): Weapon {
  return {
    id,
    name,
    type,
    damage: {
      baseValue,
      variance: Math.ceil(baseValue * 0.2), // 20% variance
      type: 'physical',
    },
    attackSpeed: 1.0,
    range: 30,
    weight: 5.0,
    durability: {
      current: 100,
      max: 100,
    },
    effects: [],
    rarity: 'common',
    level: 1,
  }
}

/**
 * Create a weapon with full customization.
 *
 * @example
 * ```ts
 * const flamesSword = createWeaponAdvanced({
 *   id: 'sword_flames',
 *   name: 'Flaming Sword',
 *   type: 'sword',
 *   damage: { baseValue: 20, variance: 4, type: 'fire' },
 *   attackSpeed: 0.9,
 *   range: 35,
 *   weight: 6.0,
 *   effects: [
 *     { id: 'fire_dmg', name: 'Flame Damage', type: 'damage', duration: 0, potency: 30 }
 *   ],
 *   rarity: 'rare',
 *   level: 10
 * })
 * ```
 */
export function createWeaponAdvanced(config: Weapon): Weapon {
  return {
    ...config,
    durability: {
      ...config.durability,
      current: config.durability.max, // Always start at max durability
    },
  }
}

/**
 * Calculate actual damage dealt by a weapon.
 *
 * Takes into account base value, variance, and random factor.
 *
 * @param weapon - The weapon
 * @returns Actual damage value
 *
 * @example
 * ```ts
 * const damage = calculateWeaponDamage(sword)
 * // Returns value between baseValue - variance and baseValue + variance
 * ```
 */
export function calculateWeaponDamage(weapon: Weapon): number {
  const { baseValue, variance } = weapon.damage
  const variance_amount = Math.floor(Math.random() * (variance * 2 + 1)) - variance
  return Math.max(1, baseValue + variance_amount)
}

/**
 * Check if weapon can be used (has durability).
 *
 * @param weapon - The weapon
 * @returns true if weapon has durability > 0
 *
 * @example
 * ```ts
 * if (canUseWeapon(sword)) {
 *   executeAttack(sword)
 * } else {
 *   repairWeapon(sword)
 * }
 * ```
 */
export function canUseWeapon(weapon: Weapon): boolean {
  return weapon.durability.current > 0
}

/**
 * Reduce weapon durability after use.
 *
 * @param weapon - The weapon
 * @param amount - Durability loss
 *
 * @example
 * ```ts
 * damageDurability(sword, 1)
 * if (sword.durability.current === 0) {
 *   showMessage('Your sword broke!')
 * }
 * ```
 */
export function damageDurability(weapon: Weapon, amount: number = 1): void {
  weapon.durability.current = Math.max(0, weapon.durability.current - amount)
}

/**
 * Repair weapon back to full durability.
 *
 * @param weapon - The weapon
 * @param amount - Durability restored (default: full repair)
 *
 * @example
 * ```ts
 * repairWeapon(sword) // Full repair
 * repairWeapon(sword, 25) // Partial repair
 * ```
 */
export function repairWeapon(weapon: Weapon, amount?: number): void {
  if (amount === undefined) {
    weapon.durability.current = weapon.durability.max
  } else {
    weapon.durability.current = Math.min(
      weapon.durability.max,
      weapon.durability.current + amount
    )
  }
}

/**
 * Get actual attack range considering all modifiers.
 *
 * @param weapon - The weapon
 * @param rangeModifier - Optional range modifier (0-2, where 1.0 = no change)
 * @returns Actual range in pixels
 *
 * @example
 * ```ts
 * const range = getWeaponRange(sword)
 * const boostedRange = getWeaponRange(sword, 1.5) // 50% more range
 * ```
 */
export function getWeaponRange(weapon: Weapon, rangeModifier: number = 1.0): number {
  return Math.round(weapon.range * rangeModifier)
}

/**
 * Calculate attack cooldown in milliseconds.
 *
 * Based on attack speed (1.0 = 600ms base cooldown).
 *
 * @param weapon - The weapon
 * @returns Cooldown in milliseconds
 *
 * @example
 * ```ts
 * const cooldown = getAttackCooldown(sword) // Returns 600 / attackSpeed
 * ```
 */
export function getAttackCooldown(weapon: Weapon): number {
  const BASE_COOLDOWN = 600 // milliseconds
  return BASE_COOLDOWN / weapon.attackSpeed
}

