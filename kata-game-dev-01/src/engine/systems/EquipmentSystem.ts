import type { World } from '../ECS'
import { COMPONENTS } from '@engine/constants'
import { getItemDefinition } from '@game/configs/ItemConfig'
import type { InventoryItem } from '@game/configs/ItemConfig'
import { createDefaultStats } from '@engine/components/CharacterStats'

/** Allowed equipment slots */
export const EQUIPMENT_SLOTS = [
  'mainHand',
  'offHand',
  'head',
  'chest',
  'legs',
  'feet'
] as const
export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number]

/**
 * Apply numeric item stats onto a stats object.
 * Uses a multiplier (1 to add, -1 to remove).
 *
 * @example
 * const stats = { attack: 5 }
 * const sword = { stats: { attack: 8 } }
 * applyItemStatsTo(stats, sword, 1) // stats.attack === 13
 */
const applyItemStatsTo = (stats: { bonus: Record<string, number> }, itemDef: any, mult = 1) => {
  if (!itemDef || !itemDef.stats) return
  for (const [k, v] of Object.entries(itemDef.stats)) {
    if (typeof v === 'number') {
      stats.bonus[k] = (stats.bonus[k] ?? 0) + v * mult
    }
  }
}

/**
 * EquipmentSystem: provides helper operations to equip/unequip items for entities.
 *
 * Example usage:
 * ```ts
 * const eq = new EquipmentSystem(world)
 * eq.equip(playerId, 'mainHand', itemInstance)
 * eq.unequip(playerId, 'mainHand')
 * ```
 */
export class EquipmentSystem {
  world: World
  constructor(world: World) {
    this.world = world
  }

  /** Check whether a slot name is valid */
  isValidSlot = (slot: string): slot is EquipmentSlot => {
    return EQUIPMENT_SLOTS.includes(slot as EquipmentSlot)
  }

  /**
   * Equip an item instance (from inventory) into a given slot.
   * Returns true if successful.
   *
   * @example
   * ```ts
   * // assume `item` is an InventoryItem from player's inventory
   * equipmentSystem.equip(playerId, 'mainHand', item)
   * ```
   */
  equip = (entity: number, slot: string, item: InventoryItem): boolean => {
    if (!this.isValidSlot(slot)) return false
    const def = getItemDefinition(item.id)
    if (!def) return false

    // Only allow weapons in mainHand/offHand, armor in armor slots
    if (def.type === 'weapon' && !['mainHand', 'offHand'].includes(slot)) return false
    if (def.type === 'armor' && ['mainHand', 'offHand'].includes(slot)) return false

    // read current equipment
    const equipment = this.world.getComponent(entity, COMPONENTS.EQUIPMENT) || { slots: {} }

    // place item uid into slot (unique instance reference)
    equipment.slots = { ...(equipment.slots || {}), [slot]: item.uid }
    this.world.addComponent(entity, COMPONENTS.EQUIPMENT, equipment)

    // Update CharacterStats bonuses (create stats if missing)
    const stats = this.world.getComponent(entity, COMPONENTS.CHARACTER_STATS) || createDefaultStats()
    applyItemStatsTo(stats, def, +1)
    this.world.addComponent(entity, COMPONENTS.CHARACTER_STATS, stats)

    return true
  }

  /**
   * Unequip an item from a slot; returns the uid of removed item or undefined.
   *
   * @example
   * ```ts
   * const removedUid = equipmentSystem.unequip(playerId, 'mainHand')
   * ```
   */
  unequip = (entity: number, slot: string): string | undefined => {
    if (!this.isValidSlot(slot)) return undefined
    const equipment = this.world.getComponent(entity, COMPONENTS.EQUIPMENT)
    if (!equipment || !equipment.slots) return undefined
    const uid = equipment.slots[slot as EquipmentSlot]
    if (!uid) return undefined

    // Clear slot
    const newSlots = { ...(equipment.slots || {}) }
    delete newSlots[slot as EquipmentSlot]
    this.world.addComponent(entity, COMPONENTS.EQUIPMENT, { slots: newSlots })

    // Reverse stats using item definition by uid->id
    const inv = this.world.getComponent(entity, COMPONENTS.INVENTORY) as InventoryItem[] | undefined
    const entry = inv?.find(i => i.uid === uid)
    const def = entry ? getItemDefinition(entry.id) : undefined
    if (def) {
      const stats = this.world.getComponent(entity, COMPONENTS.CHARACTER_STATS) || createDefaultStats()
      applyItemStatsTo(stats, def, -1)
      this.world.addComponent(entity, COMPONENTS.CHARACTER_STATS, stats)
    }

    return uid
  }

  /**
   * Swap two equipment slots (e.g., mainHand <-> offHand).
   * Returns true if swapped.
   *
   * @example
   * ```ts
   * equipmentSystem.swapSlots(playerId, 'mainHand', 'offHand')
   * ```
   */
  swapSlots = (entity: number, slotA: string, slotB: string): boolean => {
    if (!this.isValidSlot(slotA) || !this.isValidSlot(slotB)) return false
    const equipment = this.world.getComponent(entity, COMPONENTS.EQUIPMENT) || { slots: {} }
    const a = equipment.slots?.[slotA]
    const b = equipment.slots?.[slotB]
    equipment.slots = { ...(equipment.slots || {}), [slotA]: b, [slotB]: a }
    this.world.addComponent(entity, COMPONENTS.EQUIPMENT, equipment)
    return true
  }
}

export default EquipmentSystem
