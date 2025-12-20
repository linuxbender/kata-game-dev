/**
 * Equipment System
 *
 * Manages equipped gear and equipment slots.
 * Handles equipping, unequipping, and applying bonuses from equipment.
 *
 * @example
 * ```ts
 * const equipment = new EquipmentSystem()
 *
 * // Equip item
 * equipment.equip(sword, 'mainHand')
 *
 * // Get equipped bonuses
 * const bonuses = equipment.getAllBonuses()
 * ```
 */

import { getItemBonuses, getActiveEffects, hasActiveEffects, type Item, type ItemBonus, type ItemEffect } from '@components/Item'

/**
 * Equipment slot type.
 */
export type EquipmentSlot = 'mainHand' | 'offHand' | 'head' | 'chest' | 'legs' | 'feet' | 'hands' | 'back' | 'neck' | 'ring1' | 'ring2'

/**
 * Equipped item with metadata.
 */
export interface EquippedItem {
  item: Item
  slot: EquipmentSlot
  equippedAt: number
}

/**
 * Equipment System
 *
 * Manages character equipment and bonuses.
 */
export class EquipmentSystem {
  private equipment = new Map<EquipmentSlot, EquippedItem>()

  private readonly slotValidation = new Map<EquipmentSlot, Item['type'][]>([
    ['mainHand', ['weapon']],
    ['offHand', ['weapon', 'armor', 'accessory']],
    ['head', ['armor', 'accessory']],
    ['chest', ['armor']],
    ['legs', ['armor']],
    ['feet', ['armor', 'accessory']],
    ['hands', ['armor', 'accessory']],
    ['back', ['armor', 'accessory']],
    ['neck', ['accessory']],
    ['ring1', ['accessory']],
    ['ring2', ['accessory']],
  ])

  /**
   * Equip an item.
   *
   * @param item - Item to equip
   * @param slot - Equipment slot
   * @returns true if successfully equipped
   *
   * @example
   * ```ts
   * if (equipment.equip(sword, 'mainHand')) {
   *   applyBonuses()
   * }
   * ```
   */
  equip(item: Item, slot: EquipmentSlot): boolean {
    // Validate slot compatibility
    const validTypes = this.slotValidation.get(slot)
    if (!validTypes || !validTypes.includes(item.type)) {
      return false
    }

    // Equip item
    this.equipment.set(slot, {
      item,
      slot,
      equippedAt: Date.now(),
    })

    return true
  }

  /**
   * Unequip item from slot.
   *
   * @param slot - Equipment slot
   * @returns Unequipped item or undefined
   *
   * @example
   * ```ts
   * const removed = equipment.unequip('mainHand')
   * ```
   */
  unequip(slot: EquipmentSlot): Item | undefined {
    const equipped = this.equipment.get(slot)
    if (!equipped) return undefined

    this.equipment.delete(slot)
    return equipped.item
  }

  /**
   * Get equipped item in slot.
   *
   * @param slot - Equipment slot
   * @returns Equipped item or undefined
   *
   * @example
   * ```ts
   * const sword = equipment.getEquipped('mainHand')
   * ```
   */
  getEquipped(slot: EquipmentSlot): Item | undefined {
    return this.equipment.get(slot)?.item
  }

  /**
   * Check if slot is occupied.
   *
   * @param slot - Equipment slot
   * @returns true if equipped
   *
   * @example
   * ```ts
   * if (equipment.isEquipped('mainHand')) {
   *   unequipFirst()
   * }
   * ```
   */
  isEquipped(slot: EquipmentSlot): boolean {
    return this.equipment.has(slot)
  }

  /**
   * Get all equipped items.
   *
   * @returns Array of equipped items
   *
   * @example
   * ```ts
   * const all = equipment.getAllEquipped()
   * ```
   */
  getAllEquipped(): EquippedItem[] {
    return Array.from(this.equipment.values())
  }

  /**
   * Get all stat bonuses from equipped items.
   *
   * @returns Combined bonuses
   *
   * @example
   * ```ts
   * const bonuses = equipment.getAllBonuses()
   * applyBonuses(character, bonuses)
   * ```
   */
  getAllBonuses(): ItemBonus[] {
    const bonuses: ItemBonus[] = []

    this.equipment.forEach(equipped => {
      const itemBonuses = getItemBonuses(equipped.item)
      bonuses.push(...itemBonuses)
    })

    return bonuses
  }

  /**
   * Get bonus for specific stat.
   *
   * @param stat - Stat type
   * @returns Total bonus amount
   *
   * @example
   * ```ts
   * const strengthBonus = equipment.getStatBonus('strength')
   * ```
   */
  getStatBonus(stat: ItemBonus['stat']): number {
    return this.getAllBonuses()
      .filter(b => b.stat === stat)
      .reduce((total, b) => total + b.amount, 0)
  }

  /**
   * Get all active effects from equipment.
   *
   * @returns Array of active effects
   *
   * @example
   * ```ts
   * const effects = equipment.getActiveEffects()
   * ```
   */
  getActiveEffects(): ItemEffect[] {
    const effects: ItemEffect[] = []

    this.equipment.forEach(equipped => {
      if (hasActiveEffects(equipped.item)) {
        const active = getActiveEffects(equipped.item)
        effects.push(...active)
      }
    })

    return effects
  }

  /**
   * Get total equipment weight.
   *
   * @returns Total weight
   *
   * @example
   * ```ts
   * const weight = equipment.getTotalWeight()
   * ```
   */
  getTotalWeight(): number {
    return Array.from(this.equipment.values()).reduce((total, e) => total + e.item.weight, 0)
  }

  /**
   * Get total equipment value.
   *
   * @returns Total value
   *
   * @example
   * ```ts
   * const worth = equipment.getTotalValue()
   * ```
   */
  getTotalValue(): number {
    return Array.from(this.equipment.values()).reduce((total, e) => total + e.item.value, 0)
  }

  /**
   * Get equipment status.
   *
   * @returns Status information
   *
   * @example
   * ```ts
   * const status = equipment.getStatus()
   * console.log(`${status.equipped}/${status.maxSlots} slots used`)
   * ```
   */
  getStatus() {
    return {
      equipped: this.equipment.size,
      maxSlots: this.slotValidation.size,
      weight: this.getTotalWeight(),
      value: this.getTotalValue(),
      bonusCount: this.getAllBonuses().length,
      activeEffectCount: this.getActiveEffects().length,
    }
  }

  /**
   * Swap equipment between slots.
   *
   * @param slot1 - First slot
   * @param slot2 - Second slot
   * @returns true if successfully swapped
   *
   * @example
   * ```ts
   * equipment.swap('mainHand', 'offHand')
   * ```
   */
  swap(slot1: EquipmentSlot, slot2: EquipmentSlot): boolean {
    const item1 = this.equipment.get(slot1)
    const item2 = this.equipment.get(slot2)

    if (!item1 || !item2) return false

    const validTypes1 = this.slotValidation.get(slot2)
    const validTypes2 = this.slotValidation.get(slot1)

    if (!validTypes1 || !validTypes1.includes(item1.item.type)) return false
    if (!validTypes2 || !validTypes2.includes(item2.item.type)) return false

    this.equipment.set(slot1, { ...item2, slot: slot1 })
    this.equipment.set(slot2, { ...item1, slot: slot2 })

    return true
  }

  /**
   * Clear all equipment.
   *
   * @returns Array of unequipped items
   *
   * @example
   * ```ts
   * const items = equipment.clear()
   * items.forEach(item => inventory.addItem(item))
   * ```
   */
  clear(): Item[] {
    const items = Array.from(this.equipment.values()).map(e => e.item)
    this.equipment.clear()
    return items
  }

  /**
   * Get equipment by type.
   *
   * @param type - Item type
   * @returns Matching equipped items
   *
   * @example
   * ```ts
   * const armor = equipment.getByType('armor')
   * ```
   */
  getByType(type: Item['type']): EquippedItem[] {
    return Array.from(this.equipment.values()).filter(e => e.item.type === type)
  }

  /**
   * Get available slots.
   *
   * @returns Array of empty slot names
   *
   * @example
   * ```ts
   * const available = equipment.getAvailableSlots()
   * ```
   */
  getAvailableSlots(): EquipmentSlot[] {
    const slots = Array.from(this.slotValidation.keys())
    return slots.filter(slot => !this.equipment.has(slot)) as EquipmentSlot[]
  }
}

