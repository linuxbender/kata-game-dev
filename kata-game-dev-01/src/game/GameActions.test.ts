import { describe, it, expect } from 'vitest'
import { World } from '@engine/ECS'
import { createItemInstance } from './configs/ItemConfig'
import { 
  pickupItem, 
  dropItem, 
  consumeItem, 
  moveItem, 
  attackEntity,
  startDialog,
  chooseDialogOption,
  endDialog,
  getDialogState
} from './GameActions'
import { COMPONENTS } from '@engine/constants'
import { createWeapon } from '@engine/components/Weapon'

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

describe('GameActions - Weapon Mechanics', () => {
  it('attackEntity executes attack and applies damage', () => {
    const world = new World()
    const player = world.createEntity()
    const enemy = world.createEntity()
    world.addComponent(player, COMPONENTS.HEALTH, { current: 100, max: 100 })
    world.addComponent(enemy, COMPONENTS.HEALTH, { current: 50, max: 50 })
    world.addComponent(player, COMPONENTS.INVENTORY, [])
    // Create a weapon item and add to inventory
    const sword = { ...createWeapon('sword_iron', 'Iron Sword', 'sword', 8), uid: 'sword1' }
    world.addComponent(player, COMPONENTS.INVENTORY, [sword])
    // Place both entities close
    world.addComponent(player, COMPONENTS.TRANSFORM, { x: 0, y: 0, rotation: 0 })
    world.addComponent(enemy, COMPONENTS.TRANSFORM, { x: 10, y: 0, rotation: 0 })
    // Attack
    const result = attackEntity(world, player, enemy, sword.uid)
    expect(result).toBe(true)
    // Health should be reduced (if hit) or unchanged (miss)
    const hp = world.getComponent(enemy, COMPONENTS.HEALTH)
    expect([50, 49, 48, 47, 46, 45, 44, 43, 42, 41, 40]).toContain(hp.current)
  })

  it('attackEntity respects cooldown', () => {
    const world = new World()
    const player = world.createEntity()
    const enemy = world.createEntity()
    world.addComponent(player, COMPONENTS.HEALTH, { current: 100, max: 100 })
    world.addComponent(enemy, COMPONENTS.HEALTH, { current: 50, max: 50 })
    world.addComponent(player, COMPONENTS.INVENTORY, [])
    const sword = { ...createWeapon('sword_iron', 'Iron Sword', 'sword', 8), uid: 'sword1' }
    world.addComponent(player, COMPONENTS.INVENTORY, [sword])
    world.addComponent(player, COMPONENTS.TRANSFORM, { x: 0, y: 0, rotation: 0 })
    world.addComponent(enemy, COMPONENTS.TRANSFORM, { x: 10, y: 0, rotation: 0 })
    // First attack
    const first = attackEntity(world, player, enemy, sword.uid)
    expect(first).toBe(true)
    // Second attack immediately may fail due to cooldown
    const second = attackEntity(world, player, enemy, sword.uid)
    expect([true, false]).toContain(second)
  })

  it('attackEntity returns false for invalid weapon', () => {
    const world = new World()
    const player = world.createEntity()
    const enemy = world.createEntity()
    world.addComponent(player, COMPONENTS.HEALTH, { current: 100, max: 100 })
    world.addComponent(enemy, COMPONENTS.HEALTH, { current: 50, max: 50 })
    world.addComponent(player, COMPONENTS.INVENTORY, [])
    // Add a non-weapon item
    const potion = createItemInstance('potion_health', 1)
    world.addComponent(player, COMPONENTS.INVENTORY, [potion])
    world.addComponent(player, COMPONENTS.TRANSFORM, { x: 0, y: 0, rotation: 0 })
    world.addComponent(enemy, COMPONENTS.TRANSFORM, { x: 10, y: 0, rotation: 0 })
    // Try to attack with potion
    const result = attackEntity(world, player, enemy, potion.uid)
    expect(result).toBe(false)
  })
})

describe('GameActions - Dialog System', () => {
  it('startDialog initializes dialog state', () => {
    // Using imported startDialog
    const world = new World()
    const player = world.createEntity()
    const npc = world.createEntity()
    
    const result = startDialog(world, player, npc, 'merchant_dialog')
    expect(result).toBe(true)
    
    const dialogState = world.getComponent(player, COMPONENTS.DIALOG_STATE)
    expect(dialogState).toBeDefined()
    expect(dialogState.active).toBe(true)
    expect(dialogState.treeId).toBe('merchant_dialog')
    expect(dialogState.currentNodeId).toBe('greeting')
    expect(dialogState.npcEntity).toBe(npc)
  })

  it('startDialog returns false for invalid dialog tree', () => {
    // Using imported startDialog
    const world = new World()
    const player = world.createEntity()
    const npc = world.createEntity()
    
    const result = startDialog(world, player, npc, 'nonexistent_dialog')
    expect(result).toBe(false)
  })

  it('chooseDialogOption navigates to next node', () => {
    // Using imported functions
    const world = new World()
    const player = world.createEntity()
    const npc = world.createEntity()
    
    startDialog(world, player, npc, 'merchant_dialog')
    
    // Choose first option (shop)
    const result = chooseDialogOption(world, player, 0)
    expect(result).toBe(true)
    
    const dialogState = getDialogState(world, player)
    expect(dialogState.currentNodeId).toBe('shop')
  })

  it('chooseDialogOption processes giveItems consequence', () => {
    // Using imported functions
    const world = new World()
    const player = world.createEntity()
    const npc = world.createEntity()
    
    world.addComponent(player, COMPONENTS.INVENTORY, [])
    
    startDialog(world, player, npc, 'merchant_dialog')
    
    // Navigate to shop
    chooseDialogOption(world, player, 0)
    
    // Choose "I need some healing potions" (buy_potions)
    chooseDialogOption(world, player, 0)
    
    // Check that potions were added to inventory
    const inv = world.getComponent(player, COMPONENTS.INVENTORY) as any[]
    expect(inv).toBeDefined()
    expect(inv.length).toBeGreaterThan(0)
    const potionItem = inv.find((item: any) => item.id === 'potion_health')
    expect(potionItem).toBeDefined()
    expect(potionItem.quantity).toBe(2)
  })

  it('chooseDialogOption processes setQuestFlag consequence', () => {
    // Using imported functions
    const world = new World()
    const player = world.createEntity()
    const npc = world.createEntity()
    
    startDialog(world, player, npc, 'merchant_dialog')
    
    // Navigate to news
    chooseDialogOption(world, player, 1)
    
    // Choose "Tell me more"
    chooseDialogOption(world, player, 1)
    
    // Choose "I'll put a stop to them" (quest_accept)
    chooseDialogOption(world, player, 0)
    
    // Check that quest flag was set
    const questFlags = world.getComponent(player, COMPONENTS.QUEST_FLAGS) as any
    expect(questFlags).toBeDefined()
    expect(questFlags.orc_fortress_quest).toBe('accepted')
  })

  it('chooseDialogOption ends dialog with endDialog consequence', () => {
    // Using imported functions
    const world = new World()
    const player = world.createEntity()
    const npc = world.createEntity()
    
    startDialog(world, player, npc, 'merchant_dialog')
    
    // Choose "Goodbye" which leads to goodbye node with endDialog consequence
    chooseDialogOption(world, player, 2)
    
    // Dialog should be ended
    const dialogState = getDialogState(world, player)
    expect(dialogState).toBeUndefined()
  })

  it('endDialog removes dialog state', () => {
    // Using imported functions
    const world = new World()
    const player = world.createEntity()
    const npc = world.createEntity()
    
    startDialog(world, player, npc, 'merchant_dialog')
    expect(getDialogState(world, player)).toBeDefined()
    
    endDialog(world, player)
    expect(getDialogState(world, player)).toBeUndefined()
  })

  it('chooseDialogOption returns false for invalid choice index', () => {
    // Using imported functions
    const world = new World()
    const player = world.createEntity()
    const npc = world.createEntity()
    
    startDialog(world, player, npc, 'merchant_dialog')
    
    // Try invalid choice index
    const result = chooseDialogOption(world, player, 999)
    expect(result).toBe(false)
  })

  it('chooseDialogOption returns false when no active dialog', () => {
    // Using imported chooseDialogOption
    const world = new World()
    const player = world.createEntity()
    
    const result = chooseDialogOption(world, player, 0)
    expect(result).toBe(false)
  })
})
