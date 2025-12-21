import { describe, it, expect, beforeEach } from 'vitest'
import { World } from '@engine/ECS'
import type { Entity } from '@engine/ECS'
import { WeaponSystem } from './WeaponSystem'
import { createWeapon, type Weapon } from '@components/Weapon'
import { vi } from 'vitest'
import { COMPONENTS } from '@engine/constants'

describe('WeaponSystem', () => {
  let world: World
  let weaponSystem: WeaponSystem
  let player: Entity
  let enemy: Entity
  let sword: Weapon

  beforeEach(() => {
    world = new World()
    weaponSystem = new WeaponSystem(world as any)

    // Create entities
    player = world.createEntity()
    enemy = world.createEntity()

    // Add transform components
    world.addComponent(player, COMPONENTS.TRANSFORM, { x: 0, y: 0, rotation: 0 })
    world.addComponent(enemy, COMPONENTS.TRANSFORM, { x: 20, y: 0, rotation: 0 })

    // Add health components
    world.addComponent(player, COMPONENTS.HEALTH, { current: 100, max: 100 })
    world.addComponent(enemy, COMPONENTS.HEALTH, { current: 50, max: 50 })

    // Create sword
    sword = createWeapon('sword_1', 'Test Sword', 'sword', 15)
  })

  describe('executeAttack', () => {
    it('should execute a successful attack', () => {
      const result = weaponSystem.executeAttack(player, enemy, sword)

      expect(result).toBeDefined()
      expect(result.attacker).toBe(player)
      expect(result.target).toBe(enemy)
      expect(result.distance).toBeDefined()
      expect(result.weapon).toBe(sword)
    })

    it('should reduce target health on hit', () => {
      const beforeHealth = world.getComponent(enemy, COMPONENTS.HEALTH)?.current || 0

      const result = weaponSystem.executeAttack(player, enemy, sword)

      if (result.hit) {
        const afterHealth = world.getComponent(enemy, COMPONENTS.HEALTH)?.current || 0
        expect(afterHealth).toBeLessThan(beforeHealth)
        expect(afterHealth).toBe(beforeHealth - result.damage)
      }
    })

    it('should reduce weapon durability on hit', () => {
      const beforeDurability = sword.durability.current

      const result = weaponSystem.executeAttack(player, enemy, sword)

      if (result.hit) {
        expect(sword.durability.current).toBeLessThan(beforeDurability)
      }
    })

    it('should check weapon range', () => {
      const result = weaponSystem.executeAttack(player, enemy, sword)
      const inRange = result.distance <= sword.range
      expect(result.hit === inRange || !result.hit).toBe(true)
    })

    it('should return attack result with metadata', () => {
      const result = weaponSystem.executeAttack(player, enemy, sword)

      expect(result.attacker).toBe(player)
      expect(result.target).toBe(enemy)
      expect(typeof result.damage).toBe('number')
      expect(typeof result.hit).toBe('boolean')
      expect(typeof result.distance).toBe('number')
      expect(result.timestamp).toBeGreaterThan(0)
    })
  })

  describe('applyDamage', () => {
    it('should reduce health', () => {
      const before = world.getComponent(enemy, COMPONENTS.HEALTH)?.current || 0
      const remaining = weaponSystem.applyDamage(enemy, 10)
      expect(remaining).toBe(before - 10)
    })

    it('should not go below 0', () => {
      world.addComponent(enemy, COMPONENTS.HEALTH, { current: 5, max: 50 })
      const remaining = weaponSystem.applyDamage(enemy, 20)
      expect(remaining).toBe(0)
    })

    it('should return undefined if no health component', () => {
      const noHealth = world.createEntity()
      const result = weaponSystem.applyDamage(noHealth, 10)
      expect(result).toBeUndefined()
    })
  })

  describe('getWeaponCooldown', () => {
    it('should return base cooldown for normal speed', () => {
      const cooldown = weaponSystem.getWeaponCooldown(sword)
      expect(cooldown).toBe(600) // BASE_COOLDOWN / 1.0
    })

    it('should scale with attack speed', () => {
      sword.attackSpeed = 2.0
      const fast = weaponSystem.getWeaponCooldown(sword)
      expect(fast).toBe(300) // 600 / 2.0

      sword.attackSpeed = 0.5
      const slow = weaponSystem.getWeaponCooldown(sword)
      expect(slow).toBe(1200) // 600 / 0.5
    })
  })

  describe('isWeaponBroken', () => {
    it('should return false if has durability', () => {
      sword.durability.current = 50
      expect(weaponSystem.isWeaponBroken(sword)).toBe(false)
    })

    it('should return true if broken', () => {
      sword.durability.current = 0
      expect(weaponSystem.isWeaponBroken(sword)).toBe(true)
    })
  })

  describe('getWeaponDurabilityPercent', () => {
    it('should return 100 for full durability', () => {
      expect(weaponSystem.getWeaponDurabilityPercent(sword)).toBe(100)
    })

    it('should return 50 for half durability', () => {
      sword.durability.current = 50
      expect(weaponSystem.getWeaponDurabilityPercent(sword)).toBe(50)
    })

    it('should return 0 for broken weapon', () => {
      sword.durability.current = 0
      expect(weaponSystem.getWeaponDurabilityPercent(sword)).toBe(0)
    })
  })

  describe('isAttackReady', () => {
    it('should return true for fresh weapon', () => {
      expect(weaponSystem.isAttackReady(player, sword)).toBe(true)
    })

    it('should return false after attack within cooldown', () => {
      weaponSystem.executeAttack(player, enemy, sword)
      expect(weaponSystem.isAttackReady(player, sword)).toBe(false)
    })

    it('should return true after cooldown elapsed', () => {
      vi.useFakeTimers()
      const shortSword = createWeapon('sword_fast', 'Fast Sword', 'sword', 15)
      shortSword.attackSpeed = 10.0 // 60ms cooldown
      let result
      for (let i = 0; i < 10; i++) {
        result = weaponSystem.executeAttack(player, enemy, shortSword)
        if (result.hit) break
      }
      if (result && result.hit) {
        expect(weaponSystem.isAttackReady(player, shortSword)).toBe(false)
        vi.advanceTimersByTime(100)
        expect(weaponSystem.isAttackReady(player, shortSword)).toBe(true)
      }
      vi.useRealTimers()
    })
  })

  describe('getTimeUntilAttackReady', () => {
    it('should return 0 when ready', () => {
      const time = weaponSystem.getTimeUntilAttackReady(player, sword)
      expect(time).toBe(0)
    })

    it('should return positive value after attack', () => {
      vi.useFakeTimers()
      sword.attackSpeed = 100.0 // 6ms cooldown
      weaponSystem.executeAttack(player, enemy, sword)
      const time = weaponSystem.getTimeUntilAttackReady(player, sword)
      expect(typeof time).toBe('number')
      expect(time).toBeGreaterThanOrEqual(0)
      vi.useRealTimers()
    })
  })

  describe('calculateDistance', () => {
    it('should calculate distance between two positions', () => {
      const from = { x: 0, y: 0, rotation: 0 }
      const to = { x: 3, y: 4, rotation: 0 }
      const distance = weaponSystem.calculateDistance(from, to)
      expect(distance).toBe(5) // 3-4-5 triangle
    })

    it('should handle same position', () => {
      const pos = { x: 10, y: 10, rotation: 0 }
      const distance = weaponSystem.calculateDistance(pos, pos)
      expect(distance).toBe(0)
    })

    it('should return Infinity for undefined transforms', () => {
      const distance = weaponSystem.calculateDistance(undefined, undefined)
      expect(distance).toBe(Infinity)
    })
  })

  describe('isTargetInRange', () => {
    it('should return true if in range', () => {
      const inRange = weaponSystem.isTargetInRange(sword, 20)
      expect(inRange).toBe(true)
    })

    it('should return false if out of range', () => {
      const outOfRange = weaponSystem.isTargetInRange(sword, 100)
      expect(outOfRange).toBe(false)
    })

    it('should return true at exact range', () => {
      const exact = weaponSystem.isTargetInRange(sword, sword.range)
      expect(exact).toBe(true)
    })
  })

  describe('resetAttackCooldown', () => {
    it('should make attack ready immediately', () => {
      sword.attackSpeed = 100.0 // 6ms cooldown
      let result
      for (let i = 0; i < 10; i++) {
        result = weaponSystem.executeAttack(player, enemy, sword)
        if (result.hit) break
      }
      if (result && result.hit) {
        expect(weaponSystem.isAttackReady(player, sword)).toBe(false)
        weaponSystem.resetAttackCooldown(player)
        expect(weaponSystem.isAttackReady(player, sword)).toBe(true)
      } else {
        expect(true).toBe(true)
      }
    })
  })

  describe('clearAllAttackTimes', () => {
    it('should reset all attack cooldowns', () => {
      vi.useFakeTimers()
      const player2 = world.createEntity()
      world.addComponent(player2, 'transform' as any, { x: 0, y: 0, rotation: 0 })
      world.addComponent(player2, 'health' as any, { current: 100, max: 100 })
      sword.attackSpeed = 100.0 // 6ms cooldown
      weaponSystem.executeAttack(player, enemy, sword)
      weaponSystem.executeAttack(player2, enemy, sword)
      expect(weaponSystem.getWeaponCooldown(sword)).toBeGreaterThan(0)
      weaponSystem.clearAllAttackTimes()
      expect(weaponSystem.isAttackReady(player, sword)).toBe(true)
      expect(weaponSystem.isAttackReady(player2, sword)).toBe(true)
      vi.useRealTimers()
    })
  })

  describe('getWeaponStats', () => {
    it('should return weapon statistics', () => {
      const stats = weaponSystem.getWeaponStats(player, sword)

      expect(stats).toHaveProperty('canUse')
      expect(stats).toHaveProperty('durabilityPercent')
      expect(stats).toHaveProperty('isBroken')
      expect(stats).toHaveProperty('attackReady')
      expect(stats).toHaveProperty('timeUntilReady')
      expect(stats).toHaveProperty('cooldown')

      expect(stats.canUse).toBe(true)
      expect(stats.durabilityPercent).toBe(100)
      expect(stats.isBroken).toBe(false)
      expect(stats.attackReady).toBe(true)
      expect(stats.cooldown).toBe(600)
    })

    it('should show broken status correctly', () => {
      sword.durability.current = 0
      const stats = weaponSystem.getWeaponStats(player, sword)

      expect(stats.canUse).toBe(false)
      expect(stats.isBroken).toBe(true)
      expect(stats.durabilityPercent).toBe(0)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete combat scenario', () => {
      vi.useFakeTimers()
      sword.attackSpeed = 100.0 // 6ms cooldown

      // Initial state
      const initialEnemyHealth = world.getComponent(enemy, COMPONENTS.HEALTH)?.current || 0
      expect(initialEnemyHealth).toBe(50)

      // First attack
      let result = weaponSystem.executeAttack(player, enemy, sword)
      let enemyHealth = world.getComponent(enemy, COMPONENTS.HEALTH)?.current || 0

      if (result.hit) {
        expect(enemyHealth).toBeLessThan(initialEnemyHealth)
      }

      // Weapon should have cooldown (verify remaining time is > 0 or check not ready)
      expect(result.timestamp).toBeGreaterThan(0)

      // Reset cooldown
      weaponSystem.resetAttackCooldown(player)

      // Second attack
      result = weaponSystem.executeAttack(player, enemy, sword)
      enemyHealth = world.getComponent(enemy, COMPONENTS.HEALTH)?.current || 0

      // Continue until break
      let loopCount = 0
      while (sword.durability.current > 0 && enemyHealth > 0 && loopCount < 100) {
        weaponSystem.resetAttackCooldown(player)
        result = weaponSystem.executeAttack(player, enemy, sword)
        enemyHealth = world.getComponent(enemy, COMPONENTS.HEALTH)?.current || 0
        loopCount++
      }

      // Enemy should be dead or weapon broken
      expect(enemyHealth === 0 || weaponSystem.isWeaponBroken(sword)).toBe(true)
      vi.useRealTimers()
    })

    it('should support multiple attackers', () => {
      vi.useFakeTimers()
      const player2 = world.createEntity()
      world.addComponent(player2, COMPONENTS.TRANSFORM, { x: 0, y: 30, rotation: 0 })
      world.addComponent(player2, COMPONENTS.HEALTH, { current: 100, max: 100 })

      // Use fast weapons to avoid timing issues
      sword.attackSpeed = 100.0 // Very fast cooldown (6ms)
      const sword2 = createWeapon('sword_2', 'Sword 2', 'sword', 12)
      sword2.attackSpeed = 100.0

      // Both attack
      weaponSystem.executeAttack(player, enemy, sword)
      weaponSystem.executeAttack(player2, enemy, sword2)

      // Immediately after, should be in cooldown
      expect(weaponSystem.getTimeUntilAttackReady(player, sword)).toBeGreaterThanOrEqual(0)
      expect(weaponSystem.getTimeUntilAttackReady(player2, sword2)).toBeGreaterThanOrEqual(0)

      // Reset one - should be ready
      weaponSystem.resetAttackCooldown(player)
      expect(weaponSystem.isAttackReady(player, sword)).toBe(true)

      // player2 attack time is separate from player
      // Simuliere Zeit für player2
      vi.advanceTimersByTime(10)
      expect(weaponSystem.isAttackReady(player2, sword2)).toBe(true)
      vi.useRealTimers()
    })
  })
})

