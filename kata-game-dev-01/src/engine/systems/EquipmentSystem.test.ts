import { describe, it, expect, beforeEach } from 'vitest'
import { EquipmentSystem } from '@engine/systems/EquipmentSystem'
import { createItem, createItemAdvanced } from '@components/Item'

describe('EquipmentSystem', () => {
  let equipment: EquipmentSystem
  let sword: any
  let shield: any
  let armor: any
  let helmet: any

  beforeEach(() => {
    equipment = new EquipmentSystem()
    sword = createItem('sword', 'Iron Sword', 'weapon', 100)
    shield = createItem('shield', 'Wooden Shield', 'weapon', 50)
    armor = createItem('armor', 'Plate Armor', 'armor', 500)
    helmet = createItem('helmet', 'Iron Helmet', 'armor', 200)
  })

  describe('equip', () => {
    it('should equip weapon in mainHand', () => {
      expect(equipment.equip(sword, 'mainHand')).toBe(true)
      expect(equipment.getEquipped('mainHand')).toBe(sword)
    })

    it('should equip armor in chest slot', () => {
      expect(equipment.equip(armor, 'chest')).toBe(true)
      expect(equipment.getEquipped('chest')).toBe(armor)
    })

    it('should reject invalid slot combination', () => {
      expect(equipment.equip(armor, 'mainHand')).toBe(false)
    })

    it('should allow replacing equipped item', () => {
      equipment.equip(sword, 'mainHand')
      const shield2 = createItem('shield2', 'Shield', 'weapon', 50)
      expect(equipment.equip(shield2, 'mainHand')).toBe(true)
      expect(equipment.getEquipped('mainHand')?.id).toBe('shield2')
    })
  })

  describe('unequip', () => {
    it('should unequip item', () => {
      equipment.equip(sword, 'mainHand')
      const unequipped = equipment.unequip('mainHand')
      expect(unequipped).toBe(sword)
      expect(equipment.getEquipped('mainHand')).toBeUndefined()
    })

    it('should return undefined for empty slot', () => {
      expect(equipment.unequip('mainHand')).toBeUndefined()
    })
  })

  describe('getEquipped', () => {
    it('should return equipped item', () => {
      equipment.equip(sword, 'mainHand')
      expect(equipment.getEquipped('mainHand')).toBe(sword)
    })

    it('should return undefined for empty slot', () => {
      expect(equipment.getEquipped('mainHand')).toBeUndefined()
    })
  })

  describe('isEquipped', () => {
    it('should return true for equipped slot', () => {
      equipment.equip(sword, 'mainHand')
      expect(equipment.isEquipped('mainHand')).toBe(true)
    })

    it('should return false for empty slot', () => {
      expect(equipment.isEquipped('mainHand')).toBe(false)
    })
  })

  describe('getAllEquipped', () => {
    it('should return all equipped items', () => {
      equipment.equip(sword, 'mainHand')
      equipment.equip(armor, 'chest')
      equipment.equip(helmet, 'head')

      const equipped = equipment.getAllEquipped()
      expect(equipped.length).toBe(3)
    })

    it('should return empty for unequipped', () => {
      expect(equipment.getAllEquipped().length).toBe(0)
    })
  })

  describe('getAllBonuses', () => {
    it('should return all bonuses from equipment', () => {
      const bonusSword = createItemAdvanced({
        ...sword,
        bonuses: [{ stat: 'strength', amount: 5 }],
      })
      const bonusArmor = createItemAdvanced({
        ...armor,
        bonuses: [{ stat: 'constitution', amount: 3 }],
      })

      equipment.equip(bonusSword, 'mainHand')
      equipment.equip(bonusArmor, 'chest')

      const bonuses = equipment.getAllBonuses()
      expect(bonuses.length).toBe(2)
    })

    it('should return empty for no bonuses', () => {
      equipment.equip(sword, 'mainHand')
      expect(equipment.getAllBonuses().length).toBe(0)
    })
  })

  describe('getStatBonus', () => {
    it('should calculate stat bonus', () => {
      const bonusSword = createItemAdvanced({
        ...sword,
        bonuses: [{ stat: 'strength', amount: 5 }],
      })
      const bonusArmor = createItemAdvanced({
        ...armor,
        bonuses: [{ stat: 'strength', amount: 3 }],
      })

      equipment.equip(bonusSword, 'mainHand')
      equipment.equip(bonusArmor, 'chest')

      expect(equipment.getStatBonus('strength')).toBe(8)
      expect(equipment.getStatBonus('dexterity')).toBe(0)
    })
  })

  describe('getActiveEffects', () => {
    it('should return active effects from equipment', () => {
      const effectSword = createItemAdvanced({
        ...sword,
        effects: [{
          id: 'fire',
          name: 'Fire Damage',
          type: 'damage',
          potency: 30,
          activeWhenEquipped: true,
        }],
      })

      equipment.equip(effectSword, 'mainHand')
      const effects = equipment.getActiveEffects()

      expect(effects.length).toBe(1)
      expect(effects[0].id).toBe('fire')
    })

    it('should not return inactive effects', () => {
      const effectSword = createItemAdvanced({
        ...sword,
        effects: [{
          id: 'fire',
          name: 'Fire Damage',
          type: 'damage',
          potency: 30,
          activeWhenEquipped: false,
        }],
      })

      equipment.equip(effectSword, 'mainHand')
      expect(equipment.getActiveEffects().length).toBe(0)
    })
  })

  describe('getTotalWeight', () => {
    it('should calculate equipment weight', () => {
      equipment.equip(sword, 'mainHand') // 5kg
      equipment.equip(armor, 'chest') // 10kg
      expect(equipment.getTotalWeight()).toBe(15)
    })

    it('should return 0 for no equipment', () => {
      expect(equipment.getTotalWeight()).toBe(0)
    })
  })

  describe('getTotalValue', () => {
    it('should calculate equipment value', () => {
      equipment.equip(sword, 'mainHand') // 100g
      equipment.equip(armor, 'chest') // 500g
      expect(equipment.getTotalValue()).toBe(600)
    })
  })

  describe('getStatus', () => {
    it('should return equipment status', () => {
      equipment.equip(sword, 'mainHand')
      equipment.equip(armor, 'chest')

      const status = equipment.getStatus()
      expect(status.equipped).toBe(2)
      expect(status.weight).toBeGreaterThan(0)
      expect(status.value).toBeGreaterThan(0)
    })
  })

  describe('swap', () => {
    it('should swap equipment between slots', () => {
      equipment.equip(sword, 'mainHand')
      equipment.equip(shield, 'offHand')

      expect(equipment.swap('mainHand', 'offHand')).toBe(true)
      expect(equipment.getEquipped('mainHand')?.id).toBe('shield')
      expect(equipment.getEquipped('offHand')?.id).toBe('sword')
    })

    it('should reject swap with empty slot', () => {
      equipment.equip(sword, 'mainHand')
      expect(equipment.swap('mainHand', 'offHand')).toBe(false)
    })

    it('should reject invalid swap', () => {
      equipment.equip(armor, 'chest')
      equipment.equip(sword, 'mainHand')
      expect(equipment.swap('chest', 'mainHand')).toBe(false) // Can't put armor in mainHand
    })
  })

  describe('clear', () => {
    it('should clear all equipment', () => {
      equipment.equip(sword, 'mainHand')
      equipment.equip(armor, 'chest')
      equipment.equip(helmet, 'head')

      const items = equipment.clear()
      expect(items.length).toBe(3)
      expect(equipment.getAllEquipped().length).toBe(0)
    })

    it('should return unequipped items', () => {
      equipment.equip(sword, 'mainHand')
      const items = equipment.clear()
      expect(items[0]).toBe(sword)
    })
  })

  describe('getByType', () => {
    it('should filter by type', () => {
      equipment.equip(sword, 'mainHand')
      equipment.equip(armor, 'chest')
      equipment.equip(helmet, 'head')

      const armor_items = equipment.getByType('armor')
      expect(armor_items.length).toBe(2)
      expect(armor_items.every(e => e.item.type === 'armor')).toBe(true)
    })
  })

  describe('getAvailableSlots', () => {
    it('should return available slots', () => {
      equipment.equip(sword, 'mainHand')
      equipment.equip(armor, 'chest')

      const available = equipment.getAvailableSlots()
      expect(available.includes('mainHand')).toBe(false)
      expect(available.includes('chest')).toBe(false)
      expect(available.includes('head')).toBe(true)
    })

    it('should return all slots when empty', () => {
      const available = equipment.getAvailableSlots()
      expect(available.length).toBeGreaterThan(0)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete equipment workflow', () => {
      // Equip items
      expect(equipment.equip(sword, 'mainHand')).toBe(true)
      expect(equipment.equip(armor, 'chest')).toBe(true)
      expect(equipment.equip(helmet, 'head')).toBe(true)

      // Check equipped
      expect(equipment.isEquipped('mainHand')).toBe(true)
      expect(equipment.isEquipped('chest')).toBe(true)

      // Get status
      const status = equipment.getStatus()
      expect(status.equipped).toBe(3)

      // Unequip
      equipment.unequip('head')
      expect(equipment.isEquipped('head')).toBe(false)

      // Clear
      const items = equipment.clear()
      expect(items.length).toBe(2)
    })

    it('should handle equipment with bonuses and effects', () => {
      const bonusItem = createItemAdvanced({
        ...sword,
        bonuses: [{ stat: 'strength', amount: 5 }],
      })
      const effectItem = createItemAdvanced({
        ...armor,
        effects: [{
          id: 'protection',
          name: 'Protection',
          type: 'buff',
          potency: 20,
          activeWhenEquipped: true,
        }],
      })

      equipment.equip(bonusItem, 'mainHand')
      equipment.equip(effectItem, 'chest')

      expect(equipment.getStatBonus('strength')).toBe(5)
      expect(equipment.getActiveEffects().length).toBe(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle all equipment slots', () => {
      // Test each slot individually with correct item type
      equipment.equip(sword, 'mainHand')
      equipment.equip(shield, 'offHand')
      equipment.equip(helmet, 'head')
      equipment.equip(armor, 'chest')

      const leg = createItem('leg', 'Leg Armor', 'armor', 300)
      const boot = createItem('boot', 'Boots', 'armor', 150)
      const glove = createItem('glove', 'Gloves', 'armor', 100)
      const cloak = createItem('cloak', 'Cloak', 'armor', 200)
      const necklace = createItem('necklace', 'Necklace', 'accessory', 50)
      const ring1 = createItem('ring1', 'Ring', 'accessory', 30)
      const ring2 = createItem('ring2', 'Ring 2', 'accessory', 30)

      expect(equipment.equip(leg, 'legs')).toBe(true)
      expect(equipment.equip(boot, 'feet')).toBe(true)
      expect(equipment.equip(glove, 'hands')).toBe(true)
      expect(equipment.equip(cloak, 'back')).toBe(true)
      expect(equipment.equip(necklace, 'neck')).toBe(true)
      expect(equipment.equip(ring1, 'ring1')).toBe(true)
      expect(equipment.equip(ring2, 'ring2')).toBe(true)

      expect(equipment.getAllEquipped().length).toBe(11)
    })

    it('should handle multiple bonuses per stat', () => {
      const item1 = createItemAdvanced({
        ...sword,
        bonuses: [{ stat: 'strength', amount: 3 }],
      })
      const item2 = createItemAdvanced({
        ...shield,
        bonuses: [{ stat: 'strength', amount: 2 }],
      })

      equipment.equip(item1, 'mainHand')
      equipment.equip(item2, 'offHand')

      expect(equipment.getStatBonus('strength')).toBe(5)
    })
  })
})

