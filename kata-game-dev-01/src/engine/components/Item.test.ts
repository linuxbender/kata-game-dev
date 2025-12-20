import { describe, it, expect } from 'vitest'
import {
  isItem,
  extractItem,
  createItem,
  createItemAdvanced,
  getItemStackWeight,
  getItemStackValue,
  getItemBonuses,
  getItemEffects,
  canEquipItem,
  canConsumeItem,
  hasActiveEffects,
  getActiveEffects,
  createInventoryEntry,
  calculateInventoryWeight,
  calculateInventoryValue,
  findItemInInventory,
  type Item,
} from '@components/Item'

describe('Item Component', () => {
  describe('isItem Type Guard', () => {
    it('should identify valid item', () => {
      const item: Item = {
        id: 'sword',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        stackable: false,
        weight: 5.0,
        value: 100,
      }
      expect(isItem(item)).toBe(true)
    })

    it('should reject invalid items', () => {
      expect(isItem({ id: 'item' })).toBe(false)
      expect(isItem(null)).toBe(false)
      expect(isItem('item')).toBe(false)
    })
  })

  describe('extractItem', () => {
    it('should extract valid item', () => {
      const item = createItem('potion', 'Health Potion', 'consumable', 25)
      const extracted = extractItem(item)
      expect(extracted).toBeDefined()
      expect(extracted?.name).toBe('Health Potion')
    })

    it('should return undefined for invalid item', () => {
      expect(extractItem({ id: 'item' })).toBeUndefined()
    })
  })

  describe('createItem Factory', () => {
    it('should create consumable with stackable', () => {
      const potion = createItem('potion', 'Health Potion', 'consumable', 25)
      expect(potion.type).toBe('consumable')
      expect(potion.stackable).toBe(true)
      expect(potion.weight).toBe(0.5)
    })

    it('should create weapon with correct weight', () => {
      const sword = createItem('sword', 'Iron Sword', 'weapon', 100)
      expect(sword.type).toBe('weapon')
      expect(sword.stackable).toBe(false)
      expect(sword.weight).toBe(5.0)
    })

    it('should create armor with correct weight', () => {
      const armor = createItem('armor', 'Plate Armor', 'armor', 500)
      expect(armor.type).toBe('armor')
      expect(armor.stackable).toBe(false)
      expect(armor.weight).toBe(10.0)
    })
  })

  describe('createItemAdvanced', () => {
    it('should create item with full customization', () => {
      const flameSword: Item = {
        id: 'sword_flame',
        name: 'Flaming Sword',
        type: 'weapon',
        rarity: 'rare',
        stackable: false,
        weight: 5.5,
        value: 500,
        bonuses: [{ stat: 'strength', amount: 5 }],
        effects: [{
          id: 'fire',
          name: 'Fire Damage',
          type: 'damage',
          potency: 30,
          activeWhenEquipped: true,
        }],
        level: 10,
      }

      const item = createItemAdvanced(flameSword)
      expect(item.bonuses).toHaveLength(1)
      expect(item.effects).toHaveLength(1)
      expect(item.rarity).toBe('rare')
    })
  })

  describe('getItemStackWeight', () => {
    it('should calculate stack weight', () => {
      const potion = createItem('potion', 'Health Potion', 'consumable', 25)
      const weight = getItemStackWeight(potion, 10)
      expect(weight).toBe(5.0) // 0.5 * 10
    })

    it('should handle quantity of 1', () => {
      const potion = createItem('potion', 'Health Potion', 'consumable', 25)
      const weight = getItemStackWeight(potion, 1)
      expect(weight).toBe(0.5)
    })
  })

  describe('getItemStackValue', () => {
    it('should calculate stack value', () => {
      const potion = createItem('potion', 'Health Potion', 'consumable', 25)
      const value = getItemStackValue(potion, 10)
      expect(value).toBe(250) // 25 * 10
    })
  })

  describe('getItemBonuses', () => {
    it('should return bonuses array', () => {
      const item = createItem('sword', 'Sword', 'weapon', 100)
      const bonuses = getItemBonuses(item)
      expect(Array.isArray(bonuses)).toBe(true)
    })

    it('should return item bonuses', () => {
      const item = createItemAdvanced({
        ...createItem('sword', 'Sword', 'weapon', 100),
        bonuses: [{ stat: 'strength', amount: 3 }],
      })
      const bonuses = getItemBonuses(item)
      expect(bonuses.length).toBe(1)
      expect(bonuses[0].amount).toBe(3)
    })
  })

  describe('getItemEffects', () => {
    it('should return effects array', () => {
      const item = createItem('potion', 'Potion', 'consumable', 25)
      const effects = getItemEffects(item)
      expect(Array.isArray(effects)).toBe(true)
    })
  })

  describe('canEquipItem', () => {
    it('should allow equipping weapons', () => {
      const sword = createItem('sword', 'Sword', 'weapon', 100)
      expect(canEquipItem(sword)).toBe(true)
    })

    it('should allow equipping armor', () => {
      const armor = createItem('armor', 'Armor', 'armor', 200)
      expect(canEquipItem(armor)).toBe(true)
    })

    it('should allow equipping accessories', () => {
      const ring = createItem('ring', 'Ring', 'accessory', 50)
      expect(canEquipItem(ring)).toBe(true)
    })

    it('should not allow equipping consumables', () => {
      const potion = createItem('potion', 'Potion', 'consumable', 25)
      expect(canEquipItem(potion)).toBe(false)
    })
  })

  describe('canConsumeItem', () => {
    it('should allow consuming consumables', () => {
      const potion = createItem('potion', 'Potion', 'consumable', 25)
      expect(canConsumeItem(potion)).toBe(true)
    })

    it('should not allow consuming weapons', () => {
      const sword = createItem('sword', 'Sword', 'weapon', 100)
      expect(canConsumeItem(sword)).toBe(false)
    })
  })

  describe('hasActiveEffects', () => {
    it('should return false for item without effects', () => {
      const item = createItem('sword', 'Sword', 'weapon', 100)
      expect(hasActiveEffects(item)).toBe(false)
    })

    it('should return true if has active effects', () => {
      const item = createItemAdvanced({
        ...createItem('sword', 'Sword', 'weapon', 100),
        effects: [{
          id: 'fire',
          name: 'Fire',
          type: 'damage',
          potency: 30,
          activeWhenEquipped: true,
        }],
      })
      expect(hasActiveEffects(item)).toBe(true)
    })
  })

  describe('getActiveEffects', () => {
    it('should return active effects only', () => {
      const item = createItemAdvanced({
        ...createItem('sword', 'Sword', 'weapon', 100),
        effects: [
          {
            id: 'fire',
            name: 'Fire',
            type: 'damage',
            potency: 30,
            activeWhenEquipped: true,
          },
          {
            id: 'cold',
            name: 'Cold',
            type: 'damage',
            potency: 20,
            activeWhenEquipped: false,
          },
        ],
      })
      const active = getActiveEffects(item)
      expect(active.length).toBe(1)
      expect(active[0].id).toBe('fire')
    })
  })

  describe('createInventoryEntry', () => {
    it('should create entry with defaults', () => {
      const item = createItem('sword', 'Sword', 'weapon', 100)
      const entry = createInventoryEntry(item)
      expect(entry.quantity).toBe(1)
      expect(entry.item).toBe(item)
      expect(entry.instanceId).toBeDefined()
    })

    it('should create entry with quantity', () => {
      const item = createItem('potion', 'Potion', 'consumable', 25)
      const entry = createInventoryEntry(item, 5)
      expect(entry.quantity).toBe(5)
    })

    it('should create unique instance IDs', () => {
      const item = createItem('sword', 'Sword', 'weapon', 100)
      const entry1 = createInventoryEntry(item)
      const entry2 = createInventoryEntry(item)
      expect(entry1.instanceId).not.toBe(entry2.instanceId)
    })
  })

  describe('calculateInventoryWeight', () => {
    it('should calculate total weight', () => {
      const sword = createItem('sword', 'Sword', 'weapon', 100)
      const potion = createItem('potion', 'Potion', 'consumable', 25)

      const entries = [
        createInventoryEntry(sword, 1),
        createInventoryEntry(potion, 10),
      ]

      const weight = calculateInventoryWeight(entries)
      expect(weight).toBe(10.0) // 5.0 + (0.5 * 10)
    })

    it('should handle empty inventory', () => {
      expect(calculateInventoryWeight([])).toBe(0)
    })
  })

  describe('calculateInventoryValue', () => {
    it('should calculate total value', () => {
      const sword = createItem('sword', 'Sword', 'weapon', 100)
      const potion = createItem('potion', 'Potion', 'consumable', 25)

      const entries = [
        createInventoryEntry(sword, 1),
        createInventoryEntry(potion, 10),
      ]

      const value = calculateInventoryValue(entries)
      expect(value).toBe(350) // 100 + (25 * 10)
    })
  })

  describe('findItemInInventory', () => {
    it('should find item by ID', () => {
      const sword = createItem('sword', 'Sword', 'weapon', 100)
      const potion = createItem('potion', 'Potion', 'consumable', 25)

      const entries = [
        createInventoryEntry(sword),
        createInventoryEntry(potion, 5),
      ]

      const found = findItemInInventory(entries, 'potion')
      expect(found).toBeDefined()
      expect(found?.quantity).toBe(5)
    })

    it('should return undefined if not found', () => {
      const entries = [createInventoryEntry(createItem('sword', 'Sword', 'weapon', 100))]
      const found = findItemInInventory(entries, 'nonexistent')
      expect(found).toBeUndefined()
    })
  })

  describe('Item Integration', () => {
    it('should handle complete item workflow', () => {
      const sword = createItem('sword', 'Iron Sword', 'weapon', 100)

      expect(isItem(sword)).toBe(true)
      expect(canEquipItem(sword)).toBe(true)
      expect(canConsumeItem(sword)).toBe(false)

      const entry = createInventoryEntry(sword)
      const weight = getItemStackWeight(sword, 1)
      const value = getItemStackValue(sword, 1)

      expect(weight).toBe(5.0)
      expect(value).toBe(100)
    })
  })

  describe('Edge Cases', () => {
    it('should handle all item types', () => {
      const types = ['weapon', 'armor', 'accessory', 'consumable', 'quest', 'misc'] as const

      types.forEach(type => {
        const item = createItem(`item_${type}`, `Item ${type}`, type, 50)
        expect(isItem(item)).toBe(true)
        expect(item.type).toBe(type)
      })
    })

    it('should handle all rarity levels', () => {
      const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const

      rarities.forEach(rarity => {
        const item = createItemAdvanced({
          ...createItem('item', 'Item', 'weapon', 100),
          rarity,
        })
        expect(item.rarity).toBe(rarity)
      })
    })
  })
})

