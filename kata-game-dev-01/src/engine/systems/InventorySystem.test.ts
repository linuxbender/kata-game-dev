import { describe, it, expect, beforeEach } from 'vitest'
import { InventorySystem } from '@engine/systems/InventorySystem'
import { createItem } from '@components/Item'

describe('InventorySystem', () => {
  let inventory: InventorySystem
  let sword: any
  let potion: any
  let armor: any

  beforeEach(() => {
    inventory = new InventorySystem(20, 100) // 20 slots, 100kg max
    sword = createItem('sword', 'Iron Sword', 'weapon', 100)
    potion = createItem('potion', 'Health Potion', 'consumable', 25)
    armor = createItem('armor', 'Plate Armor', 'armor', 500)
  })

  describe('addItem', () => {
    it('should add item to inventory', () => {
      expect(inventory.addItem(sword)).toBe(true)
      expect(inventory.getItemQuantity('sword')).toBe(1)
    })

    it('should stack consumables', () => {
      inventory.addItem(potion, 5)
      inventory.addItem(potion, 3)
      expect(inventory.getItemQuantity('potion')).toBe(8)
    })

    it('should not stack weapons', () => {
      // Weapons are non-stackable
      const sword1: any = {
        id: 'sword_1',
        name: 'Sword 1',
        type: 'weapon',
        rarity: 'common',
        stackable: false,
        weight: 5.0,
        value: 100,
      }

      const sword2: any = {
        id: 'sword_2',
        name: 'Sword 2',
        type: 'weapon',
        rarity: 'common',
        stackable: false,
        weight: 5.0,
        value: 120,
      }

      // Both should add (different items)
      expect(inventory.addItem(sword1)).toBe(true)
      expect(inventory.addItem(sword2)).toBe(true)

      // But they occupy 2 slots (non-stackable)
      expect(inventory.getAllItems().length).toBe(2)
    })

    it('should reject if inventory full', () => {
      for (let i = 0; i < 20; i++) {
        const item = createItem(`item${i}`, `Item ${i}`, 'misc', 10)
        inventory.addItem(item)
      }
      expect(inventory.addItem(sword)).toBe(false)
    })

    it('should reject if overweight', () => {
      // Create inventory with smaller max weight
      const smallInv = new InventorySystem(20, 20) // Only 20kg max
      const heavyArmor = createItem('heavy', 'Heavy Armor', 'armor', 100)
      heavyArmor.weight = 15.0 // 15kg per piece

      // Add 2 pieces = 30kg (over 20kg limit)
      expect(smallInv.addItem(heavyArmor, 2)).toBe(false)
    })

    it('should reject zero quantity', () => {
      expect(inventory.addItem(sword, 0)).toBe(false)
    })

    it('should reject negative quantity', () => {
      expect(inventory.addItem(sword, -5)).toBe(false)
    })
  })

  describe('removeItem', () => {
    it('should remove item', () => {
      inventory.addItem(potion, 5)
      expect(inventory.removeItem('potion', 2)).toBe(true)
      expect(inventory.getItemQuantity('potion')).toBe(3)
    })

    it('should remove entire stack', () => {
      inventory.addItem(potion, 5)
      expect(inventory.removeItem('potion', 5)).toBe(true)
      expect(inventory.getItemQuantity('potion')).toBe(0)
    })

    it('should reject if not enough quantity', () => {
      inventory.addItem(potion, 5)
      expect(inventory.removeItem('potion', 10)).toBe(false)
    })

    it('should reject if item not found', () => {
      expect(inventory.removeItem('nonexistent')).toBe(false)
    })
  })

  describe('hasItem', () => {
    it('should return true if has item', () => {
      inventory.addItem(potion, 5)
      expect(inventory.hasItem('potion')).toBe(true)
    })

    it('should check minimum quantity', () => {
      inventory.addItem(potion, 5)
      expect(inventory.hasItem('potion', 5)).toBe(true)
      expect(inventory.hasItem('potion', 6)).toBe(false)
    })

    it('should return false if no item', () => {
      expect(inventory.hasItem('potion')).toBe(false)
    })
  })

  describe('getItemQuantity', () => {
    it('should return quantity', () => {
      inventory.addItem(potion, 10)
      expect(inventory.getItemQuantity('potion')).toBe(10)
    })

    it('should return 0 if not found', () => {
      expect(inventory.getItemQuantity('nonexistent')).toBe(0)
    })
  })

  describe('getAllItems', () => {
    it('should return all items', () => {
      inventory.addItem(sword)
      inventory.addItem(potion, 5)
      const items = inventory.getAllItems()
      expect(items.length).toBe(2)
    })

    it('should return copy', () => {
      inventory.addItem(sword)
      const items = inventory.getAllItems()
      items.pop() // Modify copy
      expect(inventory.getAllItems().length).toBe(1)
    })
  })

  describe('getState', () => {
    it('should return state info', () => {
      inventory.addItem(sword)
      inventory.addItem(potion, 3)

      const state = inventory.getState()
      expect(state.items).toBe(2)
      expect(state.maxSlots).toBe(20)
      expect(state.isFull).toBe(false)
      expect(state.isOverweight).toBe(false)
    })

    it('should detect full inventory', () => {
      for (let i = 0; i < 20; i++) {
        const item = createItem(`item${i}`, `Item ${i}`, 'misc', 10)
        inventory.addItem(item)
      }
      expect(inventory.getState().isFull).toBe(true)
    })

    it('should detect overweight', () => {
      const smallInv = new InventorySystem(50, 20) // 20kg max
      const heavyItem = createItem('heavy', 'Heavy', 'misc', 10)
      heavyItem.weight = 12.0 // 12kg per piece

      // Try to add 2 items = 24kg (over 20kg limit) - should fail
      const result = smallInv.addItem(heavyItem, 2)
      expect(result).toBe(false) // Should reject
      expect(smallInv.getState().isOverweight).toBe(false) // Nothing was added
    })
  })

  describe('getTotalWeight', () => {
    it('should calculate total weight', () => {
      inventory.addItem(sword) // 5kg
      inventory.addItem(potion, 10) // 5kg
      expect(inventory.getTotalWeight()).toBe(10)
    })

    it('should return 0 for empty inventory', () => {
      expect(inventory.getTotalWeight()).toBe(0)
    })
  })

  describe('getTotalValue', () => {
    it('should calculate total value', () => {
      inventory.addItem(sword) // 100g
      inventory.addItem(potion, 5) // 125g
      expect(inventory.getTotalValue()).toBe(225)
    })
  })

  describe('getRemainingWeight', () => {
    it('should return remaining capacity', () => {
      inventory.addItem(sword) // 5kg used
      expect(inventory.getRemainingWeight()).toBe(95)
    })

    it('should not go negative', () => {
      // Fill inventory to max weight
      const smallInv = new InventorySystem(50, 20) // 20kg max
      // Add items that total exactly 20kg
      const sword = createItem('s', 'Sword', 'weapon', 100) // 5kg
      const armor = createItem('a', 'Armor', 'armor', 300) // 10kg
      const potion = createItem('p', 'Potion', 'consumable', 25) // 0.5kg each x10 = 5kg

      smallInv.addItem(sword, 1) // 5kg
      smallInv.addItem(armor, 1) // 10kg
      smallInv.addItem(potion, 10) // 5kg
      // Total = 20kg
      expect(smallInv.getRemainingWeight()).toBe(0)
    })
  })

  describe('getRemainingSlots', () => {
    it('should return remaining slots', () => {
      inventory.addItem(sword)
      expect(inventory.getRemainingSlots()).toBe(19)
    })
  })

  describe('isFull', () => {
    it('should return true when full', () => {
      for (let i = 0; i < 20; i++) {
        const item = createItem(`item${i}`, `Item ${i}`, 'misc', 10)
        inventory.addItem(item)
      }
      expect(inventory.isFull()).toBe(true)
    })

    it('should return false when not full', () => {
      inventory.addItem(sword)
      expect(inventory.isFull()).toBe(false)
    })
  })

  describe('isOverweight', () => {
    it('should return false if not overweight', () => {
      const smallInv = new InventorySystem(50, 30) // 30kg max
      const normalItem = createItem('normal', 'Normal', 'misc', 10)
      normalItem.weight = 20.0 // 20kg

      smallInv.addItem(normalItem) // 20kg < 30kg limit
      expect(smallInv.isOverweight()).toBe(false)
    })

    it('should return false if not overweight', () => {
      inventory.addItem(sword)
      expect(inventory.isOverweight()).toBe(false)
    })
  })

  describe('clear', () => {
    it('should clear inventory', () => {
      inventory.addItem(sword)
      inventory.addItem(potion, 5)
      inventory.clear()
      expect(inventory.getAllItems().length).toBe(0)
    })
  })

  describe('getItemsByType', () => {
    it('should filter by type', () => {
      inventory.addItem(sword)
      inventory.addItem(armor)
      inventory.addItem(potion, 5)

      const weapons = inventory.getItemsByType('weapon')
      expect(weapons.length).toBe(1)
      expect(weapons[0].item.type).toBe('weapon')
    })

    it('should return empty for no matches', () => {
      inventory.addItem(sword)
      const consumables = inventory.getItemsByType('consumable')
      expect(consumables.length).toBe(0)
    })
  })

  describe('sort', () => {
    it('should sort by name', () => {
      const apple = createItem('apple', 'Apple', 'misc', 10)
      const banana = createItem('banana', 'Banana', 'misc', 10)
      const carrot = createItem('carrot', 'Carrot', 'misc', 10)

      inventory.addItem(carrot)
      inventory.addItem(apple)
      inventory.addItem(banana)

      inventory.sort('name')
      const items = inventory.getAllItems()

      expect(items[0].item.name).toBe('Apple')
      expect(items[1].item.name).toBe('Banana')
      expect(items[2].item.name).toBe('Carrot')
    })

    it('should sort by value', () => {
      const cheap = createItem('cheap', 'Cheap', 'misc', 10)
      const expensive = createItem('expensive', 'Expensive', 'misc', 100)
      const medium = createItem('medium', 'Medium', 'misc', 50)

      inventory.addItem(expensive)
      inventory.addItem(cheap)
      inventory.addItem(medium)

      inventory.sort('value')
      const items = inventory.getAllItems()

      expect(items[0].item.value).toBe(10)
      expect(items[1].item.value).toBe(50)
      expect(items[2].item.value).toBe(100)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete inventory workflow', () => {
      // Add items
      expect(inventory.addItem(sword)).toBe(true)
      expect(inventory.addItem(potion, 10)).toBe(true)

      // Check state
      expect(inventory.getItemQuantity('sword')).toBe(1)
      expect(inventory.hasItem('potion', 5)).toBe(true)

      // Use item
      expect(inventory.removeItem('potion', 2)).toBe(true)
      expect(inventory.getItemQuantity('potion')).toBe(8)

      // Get stats
      const state = inventory.getState()
      expect(state.items).toBe(2)
      expect(state.value).toBeGreaterThan(0)
    })

    it('should manage weight constraints', () => {
      const inv = new InventorySystem(50, 20) // 20kg max
      const heavy = createItem('heavy', 'Heavy', 'misc', 10) // 0.5kg each
      heavy.weight = 5.0

      // Add 4 items = 20kg (full)
      expect(inv.addItem(heavy, 4)).toBe(true)
      expect(inv.isOverweight()).toBe(false)

      // 5th item should fail
      expect(inv.addItem(heavy)).toBe(false)
    })
  })
})

