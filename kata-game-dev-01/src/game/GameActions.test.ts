import { describe, it, expect } from 'vitest'
import { World } from '@engine/ECS'
import { createItemInstance, ITEM_CATALOG } from './configs/ItemConfig'
import { pickupItem, dropItem, consumeItem, moveItem } from './GameActions'
import { COMPONENTS } from '@engine/constants'

describe('GameActions - Inventory', () => {
  it('pickup stackable item and stack correctly', () => {
    const world = new World()
    const player = world.createEntity()
    // initial health component
    world.addComponent(player, COMPONENTS.HEALTH, { current: 50, max: 100 })

    const potion = createItemInstance('potion_health', 3)
    expect(pickupItem(world as any, player, potion)).toBe(true)

    const inv = world.getComponent(player, COMPONENTS.INVENTORY) as any[]
    expect(inv).toBeDefined()
    expect(inv.length).toBeGreaterThan(0)
    expect(inv[0].id).toBe('potion_health')
    expect(inv[0].quantity).toBeGreaterThanOrEqual(3)
  })

  it('consume a potion heals the player and decrements quantity', () => {
    const world = new World()
    const player = world.createEntity()
    world.addComponent(player, COMPONENTS.HEALTH, { current: 50, max: 100 })

    const potion = createItemInstance('potion_health', 2)
    pickupItem(world as any, player, potion)

    const invBefore = world.getComponent(player, COMPONENTS.INVENTORY) as any[]
    const uid = invBefore[0].uid

    expect(consumeItem(world as any, player, uid)).toBe(true)
    const hp = world.getComponent(player, COMPONENTS.HEALTH) as any
    expect(hp.current).toBeGreaterThan(50)
  })

  it('drop item reduces quantity or removes entry', () => {
    const world = new World()
    const player = world.createEntity()
    const potion = createItemInstance('potion_health', 2)
    pickupItem(world as any, player, potion)
    const invBefore = world.getComponent(player, COMPONENTS.INVENTORY) as any[]
    const uid = invBefore[0].uid
    expect(dropItem(world as any, player, uid, 1)).toBe(true)
    const invAfter = world.getComponent(player, COMPONENTS.INVENTORY) as any[]
    expect(invAfter[0].quantity).toBe(1)
    expect(dropItem(world as any, player, uid, 1)).toBe(true)
    const invFinal = world.getComponent(player, COMPONENTS.INVENTORY) as any[]
    expect(invFinal.length).toBe(0)
  })

  it('moveItem reorders inventory', () => {
    const world = new World()
    const player = world.createEntity()
    const a = createItemInstance('iron_ingot', 1)
    const b = createItemInstance('potion_health', 1)
    pickupItem(world as any, player, a)
    pickupItem(world as any, player, b)
    const inv = world.getComponent(player, COMPONENTS.INVENTORY) as any[]
    expect(inv[0].id).toBe(a.id)
    expect(inv[1].id).toBe(b.id)
    expect(moveItem(world as any, player, 0, 1)).toBe(true)
    const inv2 = world.getComponent(player, COMPONENTS.INVENTORY) as any[]
    expect(inv2[0].id).toBe(b.id)
    expect(inv2[1].id).toBe(a.id)
  })
})

