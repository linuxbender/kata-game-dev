import { describe, it, expect, beforeEach } from 'vitest'
import {
  isWeapon,
  extractWeapon,
  createWeapon,
  createWeaponAdvanced,
  calculateWeaponDamage,
  canUseWeapon,
  damageDurability,
  repairWeapon,
  getWeaponRange,
  getAttackCooldown,
  type Weapon,
  type WeaponDamage,
} from './Weapon'

describe('Weapon Component', () => {
  describe('isWeapon Type Guard', () => {
    it('should identify valid weapon', () => {
      const weapon: Weapon = {
        id: 'sword_1',
        name: 'Iron Sword',
        type: 'sword',
        damage: { baseValue: 15, variance: 3, type: 'physical' },
        attackSpeed: 1.0,
        range: 30,
        weight: 5.0,
        durability: { current: 100, max: 100 },
        effects: [],
      }
      expect(isWeapon(weapon)).toBe(true)
    })

    it('should reject invalid weapons', () => {
      expect(isWeapon({ id: 'sword_1' })).toBe(false)
      expect(isWeapon({ id: 'sword_1', name: 'Sword' })).toBe(false)
      expect(isWeapon(null)).toBe(false)
      expect(isWeapon(undefined)).toBe(false)
      expect(isWeapon('weapon')).toBe(false)
    })

    it('should require all necessary properties', () => {
      const incomplete = {
        id: 'sword_1',
        name: 'Sword',
        type: 'sword',
        damage: { baseValue: 15, variance: 3 },
        attackSpeed: 1.0,
        range: 30,
        weight: 5.0,
        // Missing durability and effects
      }
      expect(isWeapon(incomplete)).toBe(false)
    })
  })

  describe('extractWeapon', () => {
    it('should extract valid weapon', () => {
      const weapon = createWeapon('sword_1', 'Iron Sword', 'sword', 15)
      const extracted = extractWeapon(weapon)
      expect(extracted).toBeDefined()
      expect(extracted?.name).toBe('Iron Sword')
    })

    it('should return undefined for invalid weapon', () => {
      expect(extractWeapon({ id: 'sword_1' })).toBeUndefined()
      expect(extractWeapon(null)).toBeUndefined()
    })
  })

  describe('createWeapon Factory', () => {
    it('should create basic weapon with defaults', () => {
      const sword = createWeapon('sword_1', 'Iron Sword', 'sword', 15)

      expect(sword.id).toBe('sword_1')
      expect(sword.name).toBe('Iron Sword')
      expect(sword.type).toBe('sword')
      expect(sword.damage.baseValue).toBe(15)
      expect(sword.damage.type).toBe('physical')
      expect(sword.attackSpeed).toBe(1.0)
      expect(sword.range).toBe(30)
      expect(sword.weight).toBe(5.0)
      expect(sword.durability.current).toBe(100)
      expect(sword.durability.max).toBe(100)
      expect(sword.effects).toEqual([])
      expect(sword.rarity).toBe('common')
      expect(sword.level).toBe(1)
    })

    it('should calculate variance based on base damage', () => {
      const lightDagger = createWeapon('dagger_1', 'Dagger', 'dagger', 10)
      const heavyAxe = createWeapon('axe_1', 'Battle Axe', 'axe', 25)

      // Variance should be ~20% of base value
      expect(lightDagger.damage.variance).toBe(2) // 10 * 0.2
      expect(heavyAxe.damage.variance).toBe(5) // 25 * 0.2
    })

    it('should create different weapon types', () => {
      const sword = createWeapon('s1', 'Sword', 'sword', 15)
      const bow = createWeapon('b1', 'Bow', 'bow', 12)
      const staff = createWeapon('st1', 'Staff', 'staff', 18)
      const dagger = createWeapon('d1', 'Dagger', 'dagger', 8)

      expect(sword.type).toBe('sword')
      expect(bow.type).toBe('bow')
      expect(staff.type).toBe('staff')
      expect(dagger.type).toBe('dagger')
    })
  })

  describe('createWeaponAdvanced', () => {
    it('should create weapon with custom properties', () => {
      const flamesSword: Weapon = {
        id: 'sword_flames',
        name: 'Flaming Sword',
        type: 'sword',
        damage: { baseValue: 20, variance: 4, type: 'fire' },
        attackSpeed: 0.9,
        range: 35,
        weight: 6.0,
        durability: { current: 50, max: 100 },
        effects: [
          { id: 'fire', name: 'Fire Damage', type: 'damage', duration: 0, potency: 30 },
        ],
        rarity: 'rare',
        level: 10,
      }

      const weapon = createWeaponAdvanced(flamesSword)

      expect(weapon.damage.type).toBe('fire')
      expect(weapon.attackSpeed).toBe(0.9)
      expect(weapon.rarity).toBe('rare')
      expect(weapon.level).toBe(10)
      expect(weapon.effects.length).toBe(1)
    })

    it('should reset durability to max', () => {
      const damaged: Weapon = {
        id: 'sword_1',
        name: 'Sword',
        type: 'sword',
        damage: { baseValue: 15, variance: 3 },
        attackSpeed: 1.0,
        range: 30,
        weight: 5.0,
        durability: { current: 20, max: 100 },
        effects: [],
      }

      const weapon = createWeaponAdvanced(damaged)
      expect(weapon.durability.current).toBe(100)
    })
  })

  describe('calculateWeaponDamage', () => {
    it('should return damage within variance range', () => {
      const sword = createWeapon('sword_1', 'Sword', 'sword', 15)
      // Variance is 3, so damage should be between 12 and 18

      const damages = Array.from({ length: 100 }, () => calculateWeaponDamage(sword))

      damages.forEach(dmg => {
        expect(dmg).toBeGreaterThanOrEqual(12) // baseValue - variance
        expect(dmg).toBeLessThanOrEqual(18) // baseValue + variance
      })
    })

    it('should have minimum damage of 1', () => {
      const weakDagger = createWeapon('dagger_1', 'Weak Dagger', 'dagger', 1)

      const damages = Array.from({ length: 50 }, () => calculateWeaponDamage(weakDagger))
      damages.forEach(dmg => {
        expect(dmg).toBeGreaterThanOrEqual(1)
      })
    })

    it('should vary damage across multiple calls', () => {
      const sword = createWeapon('sword_1', 'Sword', 'sword', 15)

      const damages = Array.from({ length: 10 }, () => calculateWeaponDamage(sword))
      const uniqueDamages = new Set(damages)

      // Should have variation (unlikely all same)
      expect(uniqueDamages.size).toBeGreaterThan(1)
    })
  })

  describe('canUseWeapon', () => {
    it('should return true if durability > 0', () => {
      const sword = createWeapon('sword_1', 'Sword', 'sword', 15)
      expect(canUseWeapon(sword)).toBe(true)

      sword.durability.current = 50
      expect(canUseWeapon(sword)).toBe(true)

      sword.durability.current = 1
      expect(canUseWeapon(sword)).toBe(true)
    })

    it('should return false if durability is 0', () => {
      const sword = createWeapon('sword_1', 'Sword', 'sword', 15)
      sword.durability.current = 0
      expect(canUseWeapon(sword)).toBe(false)
    })
  })

  describe('damageDurability', () => {
    let sword: Weapon

    beforeEach(() => {
      sword = createWeapon('sword_1', 'Sword', 'sword', 15)
    })

    it('should reduce durability by default amount', () => {
      const before = sword.durability.current
      damageDurability(sword)
      expect(sword.durability.current).toBe(before - 1)
    })

    it('should reduce durability by specified amount', () => {
      const before = sword.durability.current
      damageDurability(sword, 10)
      expect(sword.durability.current).toBe(before - 10)
    })

    it('should not go below 0', () => {
      sword.durability.current = 5
      damageDurability(sword, 10)
      expect(sword.durability.current).toBe(0)
    })

    it('should break after multiple uses', () => {
      for (let i = 0; i < 100; i++) {
        damageDurability(sword)
      }
      expect(sword.durability.current).toBe(0)
      expect(canUseWeapon(sword)).toBe(false)
    })
  })

  describe('repairWeapon', () => {
    let sword: Weapon

    beforeEach(() => {
      sword = createWeapon('sword_1', 'Sword', 'sword', 15)
      sword.durability.current = 50
    })

    it('should fully repair with no amount', () => {
      repairWeapon(sword)
      expect(sword.durability.current).toBe(sword.durability.max)
    })

    it('should partially repair with amount', () => {
      repairWeapon(sword, 25)
      expect(sword.durability.current).toBe(75)
    })

    it('should not exceed max durability', () => {
      sword.durability.current = 90
      repairWeapon(sword, 50)
      expect(sword.durability.current).toBe(100)
    })

    it('should allow broken weapon repair', () => {
      sword.durability.current = 0
      repairWeapon(sword)
      expect(sword.durability.current).toBe(100)
      expect(canUseWeapon(sword)).toBe(true)
    })
  })

  describe('getWeaponRange', () => {
    it('should return base range without modifier', () => {
      const sword = createWeapon('sword_1', 'Sword', 'sword', 15)
      expect(getWeaponRange(sword)).toBe(30)
    })

    it('should apply range modifier', () => {
      const sword = createWeapon('sword_1', 'Sword', 'sword', 15)
      expect(getWeaponRange(sword, 1.5)).toBe(45) // 30 * 1.5
      expect(getWeaponRange(sword, 0.5)).toBe(15) // 30 * 0.5
    })

    it('should return integer range', () => {
      const sword = createWeapon('sword_1', 'Sword', 'sword', 15)
      const range = getWeaponRange(sword, 1.33)
      expect(Number.isInteger(range)).toBe(true)
    })
  })

  describe('getAttackCooldown', () => {
    it('should calculate cooldown based on attack speed', () => {
      const normal = createWeapon('sword_1', 'Sword', 'sword', 15)
      expect(getAttackCooldown(normal)).toBe(600) // 600 / 1.0

      normal.attackSpeed = 0.5
      expect(getAttackCooldown(normal)).toBe(1200) // 600 / 0.5

      normal.attackSpeed = 2.0
      expect(getAttackCooldown(normal)).toBe(300) // 600 / 2.0
    })

    it('should scale cooldown with attack speed', () => {
      const slow = createWeapon('hammer_1', 'Hammer', 'hammer', 25)
      slow.attackSpeed = 0.7

      const fast = createWeapon('dagger_1', 'Dagger', 'dagger', 10)
      fast.attackSpeed = 1.5

      const slowCooldown = getAttackCooldown(slow)
      const fastCooldown = getAttackCooldown(fast)

      expect(slowCooldown).toBeGreaterThan(fastCooldown)
    })
  })

  describe('Weapon Integration', () => {
    it('should create, use, damage, and repair weapon', () => {
      const sword = createWeapon('sword_1', 'Sword', 'sword', 15)

      // Use weapon
      expect(canUseWeapon(sword)).toBe(true)

      // Damage after attacks
      for (let i = 0; i < 50; i++) {
        damageDurability(sword)
      }
      expect(sword.durability.current).toBe(50)

      // Repair
      repairWeapon(sword, 25)
      expect(sword.durability.current).toBe(75)

      // Continue using
      damageDurability(sword, 10)
      expect(sword.durability.current).toBe(65)
    })

    it('should handle weapon damage calculation and cooldown', () => {
      const sword = createWeapon('sword_1', 'Sword', 'sword', 15)

      const damage = calculateWeaponDamage(sword)
      const cooldown = getAttackCooldown(sword)
      const range = getWeaponRange(sword)

      expect(damage).toBeGreaterThanOrEqual(12)
      expect(damage).toBeLessThanOrEqual(18)
      expect(cooldown).toBe(600)
      expect(range).toBe(30)
    })

    it('should support weapon progression', () => {
      // Low level weapon
      const ironSword = createWeapon('sword_iron', 'Iron Sword', 'sword', 10)

      // High level weapon
      const steelSword = createWeapon('sword_steel', 'Steel Sword', 'sword', 20)

      const ironDamage = calculateWeaponDamage(ironSword)
      const steelDamage = calculateWeaponDamage(steelSword)

      // Steel sword should deal more damage on average
      expect(steelDamage).toBeGreaterThanOrEqual(ironDamage)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero base damage', () => {
      const weapon = createWeapon('weak', 'Weak', 'sword', 0)
      const damage = calculateWeaponDamage(weapon)
      expect(damage).toBeGreaterThanOrEqual(0)
    })

    it('should handle very high attack speed', () => {
      const sword = createWeapon('sword_1', 'Sword', 'sword', 15)
      sword.attackSpeed = 10.0
      expect(getAttackCooldown(sword)).toBe(60) // 600 / 10
    })

    it('should handle very low attack speed', () => {
      const sword = createWeapon('sword_1', 'Sword', 'sword', 15)
      sword.attackSpeed = 0.1
      expect(getAttackCooldown(sword)).toBe(6000) // 600 / 0.1
    })

    it('should handle multiple weapon types', () => {
      const types: Weapon['type'][] = [
        'sword',
        'axe',
        'bow',
        'staff',
        'dagger',
        'hammer',
        'spear',
      ]

      types.forEach(type => {
        const weapon = createWeapon(`weapon_${type}`, `Test ${type}`, type, 15)
        expect(weapon.type).toBe(type)
        expect(canUseWeapon(weapon)).toBe(true)
      })
    })
  })
})

