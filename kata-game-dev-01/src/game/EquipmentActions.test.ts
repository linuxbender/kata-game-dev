import { describe, it, expect } from 'vitest'
import { World } from '@engine/ECS'
import { createItemInstance } from './configs/ItemConfig'
import { equipItem, unequipItem, swapEquipment } from './GameActions'
import { COMPONENTS } from '@engine/constants'

// Helper to create a player with inventory and equipment
const setupPlayer = () => {
  const world = new World()
  const player = world.createEntity()
  world.addComponent(player, COMPONENTS.INVENTORY, [])
  world.addComponent(player, COMPONENTS.EQUIPMENT, { slots: {} })
  world.addComponent(player, COMPONENTS.CHARACTER_STATS, { bonus: {} })
  return { world, player }
}

describe('GameActions - Equipment', () => {
  it('equipItem puts item in slot and updates stats', () => {
    const { world, player } = setupPlayer()
    const sword = createItemInstance('sword_iron', 1)
    // Add to inventory
    world.addComponent(player, COMPONENTS.INVENTORY, [sword])
    expect(equipItem(world, player, 'mainHand', sword)).toBe(true)
    const eq = world.getComponent(player, COMPONENTS.EQUIPMENT)
    expect(eq.slots.mainHand).toBe(sword.uid)
  })

  it('unequipItem removes item from slot', () => {
    const { world, player } = setupPlayer()
    const sword = createItemInstance('sword_iron', 1)
    world.addComponent(player, COMPONENTS.INVENTORY, [sword])
    equipItem(world, player, 'mainHand', sword)
    const removedUid = unequipItem(world, player, 'mainHand')
    expect(removedUid).toBe(sword.uid)
    const eq = world.getComponent(player, COMPONENTS.EQUIPMENT)
    expect(eq.slots.mainHand).toBeUndefined()
  })

  it('swapEquipment swaps two slots', () => {
    const { world, player } = setupPlayer()
    const sword1 = createItemInstance('sword_iron', 1)
    const sword2 = createItemInstance('sword_iron', 1)
    world.addComponent(player, COMPONENTS.INVENTORY, [sword1, sword2])
    equipItem(world, player, 'mainHand', sword1)
    equipItem(world, player, 'offHand', sword2)
    expect(swapEquipment(world, player, 'mainHand', 'offHand')).toBe(true)
    const eq = world.getComponent(player, COMPONENTS.EQUIPMENT)
    expect(eq.slots.mainHand).toBe(sword2.uid)
    expect(eq.slots.offHand).toBe(sword1.uid)
  })
})
