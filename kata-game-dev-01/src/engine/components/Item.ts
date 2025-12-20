/**
 * Item Component
 *
 * Defines items that can be stored in inventory.
 * Items can have effects, bonuses, and rarity levels.
 *
 * @example
 * ```ts
 * const potion: Item = {
 *   id: 'potion_health',
 *   name: 'Health Potion',
 *   type: 'consumable',
 *   rarity: 'common',
 *   stackable: true,
 *   effect: {
 *     id: 'heal_50',
 *     name: 'Heal 50 HP',
 *     type: 'healing',
 *     potency: 50
 *   },
 *   weight: 0.5,
 *   value: 25
 * }
 * ```
 */

/**
 * Item stat bonus.
 * Temporary or permanent stat modifications.
 */
export interface ItemBonus {
  /** Stat type to modify */
  stat: 'strength' | 'dexterity' | 'intelligence' | 'constitution' | 'wisdom' | 'charisma'
  /** Bonus amount */
  amount: number
}

/**
 * Item effect.
 * Special properties or abilities the item provides.
 */
export interface ItemEffect {
  /** Effect ID */
  id: string
  /** Effect name */
  name: string
  /** Effect type */
  type: 'healing' | 'damage' | 'buff' | 'debuff' | 'stat_bonus' | 'utility'
  /** Effect potency (0-100) */
  potency: number
  /** Is effect active while equipped */
  activeWhenEquipped?: boolean
}

/**
 * Item component.
 *
 * Complete item definition with properties and effects.
 *
 * @example
 * ```ts
 * const sword: Item = {
 *   id: 'sword_iron',
 *   name: 'Iron Sword',
 *   type: 'weapon',
 *   rarity: 'common',
 *   stackable: false,
 *   weight: 5.0,
 *   value: 100,
 *   bonuses: [{ stat: 'strength', amount: 2 }],
 *   effects: []
 * }
 * ```
 */
export interface Item {
  /** Unique item ID */
  id: string
  /** Display name */
  name: string
  /** Item type (weapon, armor, consumable, quest, misc) */
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'quest' | 'misc'
  /** Item rarity */
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  /** Can this item stack in inventory */
  stackable: boolean
  /** Item weight in kg */
  weight: number
  /** Item value in gold */
  value: number
  /** Stat bonuses */
  bonuses?: ItemBonus[]
  /** Special effects */
  effects?: ItemEffect[]
  /** Item description */
  description?: string
  /** Required level */
  level?: number
}

/**
 * Inventory item entry.
 * An item instance with quantity.
 */
export interface InventoryEntry {
  /** Item definition */
  item: Item
  /** Quantity of this item */
  quantity: number
  /** Unique instance ID (for tracking) */
  instanceId: string
}

/**
 * Type guard: Check if object is an Item.
 *
 * @example
 * ```ts
 * if (isItem(obj)) {
 *   addToInventory(obj)
 * }
 * ```
 */
export function isItem(obj: unknown): obj is Item {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as any
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.type === 'string' &&
    typeof o.rarity === 'string' &&
    typeof o.stackable === 'boolean' &&
    typeof o.weight === 'number' &&
    typeof o.value === 'number'
  )
}

/**
 * Extract Item if valid.
 *
 * @example
 * ```ts
 * const item = extractItem(obj)
 * if (item) {
 *   useItem(item)
 * }
 * ```
 */
export function extractItem(obj: unknown): Item | undefined {
  return isItem(obj) ? obj : undefined
}

/**
 * Create an item with sensible defaults.
 *
 * @param id - Unique item ID
 * @param name - Display name
 * @param type - Item type
 * @param value - Item value in gold
 * @returns New item
 *
 * @example
 * ```ts
 * const potion = createItem('potion', 'Health Potion', 'consumable', 25)
 * const sword = createItem('sword', 'Iron Sword', 'weapon', 100)
 * ```
 */
export function createItem(
  id: string,
  name: string,
  type: Item['type'],
  value: number
): Item {
  return {
    id,
    name,
    type,
    rarity: 'common',
    stackable: type === 'consumable' || type === 'misc',
    weight: type === 'weapon' ? 5.0 : type === 'armor' ? 10.0 : 0.5,
    value,
    bonuses: [],
    effects: [],
    level: 1,
  }
}

/**
 * Create item with full customization.
 *
 * @example
 * ```ts
 * const flameSword = createItemAdvanced({
 *   id: 'sword_flame',
 *   name: 'Flaming Sword',
 *   type: 'weapon',
 *   rarity: 'rare',
 *   stackable: false,
 *   weight: 5.5,
 *   value: 500,
 *   bonuses: [{ stat: 'strength', amount: 5 }],
 *   effects: [{
 *     id: 'fire_dmg',
 *     name: 'Fire Damage',
 *     type: 'damage',
 *     potency: 30,
 *     activeWhenEquipped: true
 *   }],
 *   level: 10
 * })
 * ```
 */
export function createItemAdvanced(config: Item): Item {
  return config
}

/**
 * Calculate total weight of item stack.
 *
 * @param item - The item
 * @param quantity - Quantity
 * @returns Total weight
 *
 * @example
 * ```ts
 * const totalWeight = getItemStackWeight(potion, 10)
 * ```
 */
export function getItemStackWeight(item: Item, quantity: number): number {
  return item.weight * quantity
}

/**
 * Calculate total value of item stack.
 *
 * @param item - The item
 * @param quantity - Quantity
 * @returns Total value
 *
 * @example
 * ```ts
 * const totalGold = getItemStackValue(potion, 10)
 * ```
 */
export function getItemStackValue(item: Item, quantity: number): number {
  return item.value * quantity
}

/**
 * Get all bonuses from an item.
 *
 * @param item - The item
 * @returns Array of bonuses
 *
 * @example
 * ```ts
 * const bonuses = getItemBonuses(sword)
 * applyBonuses(character, bonuses)
 * ```
 */
export function getItemBonuses(item: Item): ItemBonus[] {
  return item.bonuses || []
}

/**
 * Get all effects from an item.
 *
 * @param item - The item
 * @returns Array of effects
 *
 * @example
 * ```ts
 * const effects = getItemEffects(potion)
 * applyEffects(character, effects)
 * ```
 */
export function getItemEffects(item: Item): ItemEffect[] {
  return item.effects || []
}

/**
 * Check if item can be equipped.
 *
 * @param item - The item
 * @returns true if equippable
 *
 * @example
 * ```ts
 * if (canEquipItem(sword)) {
 *   equipItem(sword)
 * }
 * ```
 */
export function canEquipItem(item: Item): boolean {
  return item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory'
}

/**
 * Check if item can be consumed.
 *
 * @param item - The item
 * @returns true if consumable
 *
 * @example
 * ```ts
 * if (canConsumeItem(potion)) {
 *   consumeItem(potion)
 * }
 * ```
 */
export function canConsumeItem(item: Item): boolean {
  return item.type === 'consumable'
}

/**
 * Check if item has active effects when equipped.
 *
 * @param item - The item
 * @returns true if has active effects
 *
 * @example
 * ```ts
 * if (hasActiveEffects(sword)) {
 *   applyEquipmentEffects(sword)
 * }
 * ```
 */
export function hasActiveEffects(item: Item): boolean {
  return (item.effects || []).some(e => e.activeWhenEquipped)
}

/**
 * Get active effects from equipped item.
 *
 * @param item - The item
 * @returns Array of active effects
 *
 * @example
 * ```ts
 * const active = getActiveEffects(sword)
 * ```
 */
export function getActiveEffects(item: Item): ItemEffect[] {
  return (item.effects || []).filter(e => e.activeWhenEquipped)
}

/**
 * Create inventory entry for item.
 *
 * @param item - The item
 * @param quantity - Starting quantity
 * @returns Inventory entry
 *
 * @example
 * ```ts
 * const entry = createInventoryEntry(potion, 5)
 * ```
 */
export function createInventoryEntry(item: Item, quantity: number = 1): InventoryEntry {
  return {
    item,
    quantity,
    instanceId: `${item.id}_${Date.now()}_${Math.random()}`,
  }
}

/**
 * Calculate total weight of inventory entries.
 *
 * @param entries - Array of entries
 * @returns Total weight
 *
 * @example
 * ```ts
 * const totalWeight = calculateInventoryWeight(entries)
 * ```
 */
export function calculateInventoryWeight(entries: InventoryEntry[]): number {
  return entries.reduce((total, entry) => total + getItemStackWeight(entry.item, entry.quantity), 0)
}

/**
 * Calculate total value of inventory entries.
 *
 * @param entries - Array of entries
 * @returns Total value
 *
 * @example
 * ```ts
 * const totalValue = calculateInventoryValue(entries)
 * ```
 */
export function calculateInventoryValue(entries: InventoryEntry[]): number {
  return entries.reduce((total, entry) => total + getItemStackValue(entry.item, entry.quantity), 0)
}

/**
 * Find item by ID in entries.
 *
 * @param entries - Array of entries
 * @param itemId - Item ID to find
 * @returns Entry or undefined
 *
 * @example
 * ```ts
 * const potion = findItemInInventory(entries, 'potion_health')
 * ```
 */
export function findItemInInventory(
  entries: InventoryEntry[],
  itemId: string
): InventoryEntry | undefined {
  return entries.find(e => e.item.id === itemId)
}

