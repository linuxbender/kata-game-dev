import type { World } from '@engine/ECS'
import { COMPONENTS } from '@engine/constants'
import type { InventoryItem } from './configs/ItemConfig'
import { getItemDefinition } from './configs/ItemConfig'
import EquipmentSystem from '@engine/systems/EquipmentSystem'
import { WeaponSystem } from '@engine/systems/WeaponSystem'

/**
 * Pickup item: add to player's inventory, respecting stack rules.
 * If inventory component doesn't exist, create it as InventoryItem[].
 */
export const pickupItem = (world: World, player: number, item: InventoryItem) => {
  // defensive read of inventory component
  const raw = world.getComponent(player, COMPONENTS.INVENTORY) as any
  let inv: InventoryItem[] = []
  if (Array.isArray(raw)) inv = raw
  else if (raw && typeof raw === 'object') {
    inv = [raw as InventoryItem]
  } else {
    inv = []
  }

  const def = getItemDefinition(item.id)
  if (!def) return false

  if (def.stackable) {
    const existingIndex = inv.findIndex(i => i.id === item.id)
    if (existingIndex !== -1) {
      // existing stack present — update quantity and write new array
      const existing = { ...inv[existingIndex] }
      const max = def.maxStack ?? 99
      const space = Math.max(0, max - existing.quantity)
      const toAdd = Math.min(space, item.quantity)
      if (toAdd > 0) {
        existing.quantity += toAdd
        item.quantity -= toAdd
        const newInv = inv.slice()
        newInv[existingIndex] = existing
        world.addComponent(player, COMPONENTS.INVENTORY, newInv)
      }
      if (item.quantity > 0) {
        const toPush = { ...item }
        const newInv = [...inv, toPush]
        world.addComponent(player, COMPONENTS.INVENTORY, newInv)
      }
    } else {
      // no existing stack — create new array with the item
      const newInv = [...inv, { ...item }]
      world.addComponent(player, COMPONENTS.INVENTORY, newInv)
    }
  } else {
    // non-stackable: always append a new instance
    const newInv = [...inv, { ...item }]
    world.addComponent(player, COMPONENTS.INVENTORY, newInv)
  }

  return true
}

/**
 * Drop item: remove quantity or the instance from player's inventory
 */
export const dropItem = (world: World, player: number, uid: string, qty = 1) => {
  let invRaw = world.getComponent(player, COMPONENTS.INVENTORY) as any
  // Defensive: ensure inventory is an array
  let inv: InventoryItem[] = []
  if (Array.isArray(invRaw)) inv = invRaw
  else if (invRaw && typeof invRaw === 'object') {
    // If a single object was stored erroneously, coerce to array
    inv = [invRaw as InventoryItem]
  } else {
    return false
  }

  const idx = inv.findIndex(i => i.uid === uid)
  if (idx === -1) return false
  const entry = inv[idx]
  if (entry.quantity > qty) {
    entry.quantity -= qty
    // write back a new array reference to ensure reactive systems notice change
    world.addComponent(player, COMPONENTS.INVENTORY, [...inv])
  } else {
    const newInv = inv.slice()
    newInv.splice(idx, 1)
    world.addComponent(player, COMPONENTS.INVENTORY, newInv)
  }
  return true
}

/**
 * Consume item: apply effects of a consumable (e.g., healing) and decrement quantity
 */
export const consumeItem = (world: World, player: number, uid: string) => {
  const inv = world.getComponent(player, COMPONENTS.INVENTORY) as InventoryItem[] | undefined
  if (!inv) return false
  const idx = inv.findIndex(i => i.uid === uid)
  if (idx === -1) return false
  const entry = inv[idx]
  const def = getItemDefinition(entry.id)
  if (!def || def.type !== 'consumable' || !def.stats) return false

  // Example: apply healing if present
  const healing = def.stats.healing ?? 0
  if (healing > 0) {
    const hp = world.getComponent(player, COMPONENTS.HEALTH) as any
    if (hp) {
      hp.current = Math.min(hp.max, hp.current + healing)
      world.addComponent(player, COMPONENTS.HEALTH, hp)
    }
  }

  // Decrement quantity or remove
  if (entry.quantity > 1) {
    entry.quantity -= 1
    world.addComponent(player, COMPONENTS.INVENTORY, inv)
  } else {
    inv.splice(idx, 1)
    world.addComponent(player, COMPONENTS.INVENTORY, inv)
  }
  return true
}

/**
 * Move item within inventory ordering (fromIndex to toIndex)
 */
export const moveItem = (world: World, player: number, fromIndex: number, toIndex: number) => {
  const inv = world.getComponent(player, COMPONENTS.INVENTORY) as InventoryItem[] | undefined
  if (!inv) return false
  if (fromIndex < 0 || fromIndex >= inv.length) return false
  if (toIndex < 0) toIndex = 0
  if (toIndex >= inv.length) toIndex = inv.length - 1
  const [item] = inv.splice(fromIndex, 1)
  inv.splice(toIndex, 0, item)
  world.addComponent(player, COMPONENTS.INVENTORY, inv)
  return true
}

/**
 * Equip an item from inventory into a given equipment slot.
 * Uses EquipmentSystem for slot validation and stat updates.
 * @example
 * equipItem(world, player, 'mainHand', item)
 */
export const equipItem = (world: World, player: number, slot: string, item: InventoryItem): boolean => {
  const eq = new EquipmentSystem(world)
  return eq.equip(player, slot, item)
}

/**
 * Unequip an item from a given slot. Returns the uid of the removed item or undefined.
 * Uses EquipmentSystem for slot validation and stat updates.
 * @example
 * unequipItem(world, player, 'mainHand')
 */
export const unequipItem = (world: World, player: number, slot: string): string | undefined => {
  const eq = new EquipmentSystem(world)
  return eq.unequip(player, slot)
}

/**
 * Swap two equipment slots (e.g., mainHand <-> offHand). Returns true if swapped.
 * Uses EquipmentSystem for slot validation.
 * @example
 * swapEquipment(world, player, 'mainHand', 'offHand')
 */
export const swapEquipment = (world: World, player: number, slotA: string, slotB: string): boolean => {
  const eq = new EquipmentSystem(world)
  return eq.swapSlots(player, slotA, slotB)
}

/**
 * Attack another entity using a weapon from inventory.
 * Handles cooldown, damage calculation, and effect triggering.
 * @param world - The game world
 * @param attacker - Attacking entity
 * @param target - Target entity
 * @param weaponUid - UID of weapon in attacker's inventory
 * @returns true if attack was executed (hit or miss), false if not possible
 * @example
 * attackEntity(world, player, enemy, sword.uid)
 */
export const attackEntity = (world: World, attacker: number, target: number, weaponUid: string): boolean => {
  const inv = world.getComponent(attacker, COMPONENTS.INVENTORY) as InventoryItem[] | undefined
  if (!inv) return false
  const weapon = inv.find(i => i.uid === weaponUid)
  if (!weapon) return false
  // Get weapon definition (must be type weapon)
  const def = getItemDefinition(weapon.id)
  if (!def || def.type !== 'weapon') return false
  // Compose weapon instance for WeaponSystem
  const weaponInstance = { ...weapon, ...def } as any // Type: Weapon
  const ws = new WeaponSystem(world)
  // Check cooldown
  if (!ws.isAttackReady(attacker, weaponInstance)) return false
  // Execute attack
  const result = ws.executeAttack(attacker, target, weaponInstance)
  // (Optional) handle effects here (e.g. onHit, onCrit, etc.)
  // ...
  return true
}

export default {
  pickupItem,
  dropItem,
  consumeItem,
  moveItem,
  equipItem,
  unequipItem,
  swapEquipment,
  attackEntity
}
