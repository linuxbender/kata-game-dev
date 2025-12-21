import { describe, it, expect, beforeEach } from 'vitest'
import { ReactiveWorld } from '@engine/ReactiveWorld'
import EquipmentSystem from './EquipmentSystem'
import { createItemInstance } from '@game/configs/ItemConfig'
import { COMPONENTS } from '@engine/constants'

describe('EquipmentSystem', () => {
  let world: ReactiveWorld
  let eq: EquipmentSystem
  let player: number

  beforeEach(() => {
    world = new ReactiveWorld()
    eq = new EquipmentSystem(world as any)
    // create a simple player entity
    player = world.createEntity()
    // give player an inventory with a sword and armor
    const sword = createItemInstance('sword_iron', 1)
    const armor = createItemInstance('armor_leather', 1)
    world.addComponent(player, COMPONENTS.INVENTORY, [sword, armor])
  })

  it('validates allowed slots', () => {
    expect(eq.isValidSlot('mainHand')).toBe(true)
    expect(eq.isValidSlot('head')).toBe(true)
    expect(eq.isValidSlot('unknown' as any)).toBe(false)
  })

  it('equips weapon to mainHand and updates stats', () => {
    const inv = world.getComponent(player, COMPONENTS.INVENTORY) as any[]
    const sword = inv.find(i => i.id === 'sword_iron')
    const ok = eq.equip(player, 'mainHand', sword)
    expect(ok).toBe(true)
    const equipment = world.getComponent(player, COMPONENTS.EQUIPMENT)
    expect(equipment.slots.mainHand).toBe(sword.uid)
    const stats = world.getComponent(player, COMPONENTS.CHARACTER_STATS)
    // iron sword gives attack +8
    expect(stats.bonus.attack).toBeGreaterThanOrEqual(8)
  })

  it('does not equip armor into mainHand', () => {
    const inv = world.getComponent(player, COMPONENTS.INVENTORY) as any[]
    const armor = inv.find(i => i.id === 'armor_leather')
    const ok = eq.equip(player, 'mainHand', armor)
    expect(ok).toBe(false)
  })

  it('unequips item and reverses stats', () => {
    const inv = world.getComponent(player, COMPONENTS.INVENTORY) as any[]
    const sword = inv.find(i => i.id === 'sword_iron')
    expect(eq.equip(player, 'mainHand', sword)).toBe(true)
    const beforeStats = world.getComponent(player, COMPONENTS.CHARACTER_STATS)
    expect(beforeStats.bonus.attack).toBeGreaterThanOrEqual(8)

    const removedUid = eq.unequip(player, 'mainHand')
    expect(removedUid).toBe(sword.uid)
    const afterStats = world.getComponent(player, COMPONENTS.CHARACTER_STATS)
    const attackBefore = beforeStats.bonus.attack
    expect(afterStats.bonus.attack).toBe(0)
  })
})
