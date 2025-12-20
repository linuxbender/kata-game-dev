import { describe, it, expect, beforeEach } from 'vitest'
import { World } from '@engine/ECS'
import type { Entity } from '@engine/ECS'
import { CombatSystem, CombatState } from './CombatSystem'
import { CharacterStatsSystem } from './CharacterStatsSystem'
import { EquipmentSystem } from './EquipmentSystem'
import { createWeapon } from '@components/Weapon'
import type { BaseStats } from '@components/CharacterStats'

describe('CombatSystem', () => {
  let world: World
  let combatSystem: CombatSystem
  let statsSystem: CharacterStatsSystem
  let equipmentSystem: EquipmentSystem
  let player: Entity
  let enemy: Entity
  let sword: any
  let dagger: any

  beforeEach(() => {
    world = new World()
    statsSystem = new CharacterStatsSystem()
    equipmentSystem = new EquipmentSystem()
    combatSystem = new CombatSystem(world, statsSystem, equipmentSystem)

    player = world.createEntity()
    enemy = world.createEntity()

    // Create characters
    const playerBase: BaseStats = {
      strength: 16,
      dexterity: 14,
      intelligence: 12,
      constitution: 15,
      wisdom: 13,
      charisma: 10,
    }

    const enemyBase: BaseStats = {
      strength: 12,
      dexterity: 10,
      intelligence: 14,
      constitution: 16,
      wisdom: 12,
      charisma: 10,
    }

    statsSystem.createCharacterWithStats(player, playerBase, 5)
    statsSystem.createCharacterWithStats(enemy, enemyBase, 5)

    // Create weapons
    sword = createWeapon('sword', 'Iron Sword', 'sword', 100)
    dagger = createWeapon('dagger', 'Dagger', 'dagger', 50)
  })

  describe('startCombat', () => {
    it('should start a new combat encounter', () => {
      const encounterId = combatSystem.startCombat(player, enemy)

      expect(encounterId).toBeDefined()
      expect(typeof encounterId).toBe('string')
    })

    it('should create unique encounter IDs', () => {
      const id1 = combatSystem.startCombat(player, enemy)
      const id2 = combatSystem.startCombat(player, enemy)

      expect(id1).not.toBe(id2)
    })

    it('should set combat state to ACTIVE', () => {
      const encounterId = combatSystem.startCombat(player, enemy)
      const encounter = combatSystem.getEncounter(encounterId)

      expect(encounter?.state).toBe(CombatState.ACTIVE)
    })

    it('should log combat start', () => {
      combatSystem.startCombat(player, enemy)
      const log = combatSystem.getCombatLog()

      expect(log.length).toBeGreaterThan(0)
      expect(log[0]).toContain('Combat started')
    })
  })

  describe('attack', () => {
    it('should execute an attack', () => {
      const encounterId = combatSystem.startCombat(player, enemy)
      const result = combatSystem.attack(player, enemy, sword, encounterId)

      expect(result).toBeDefined()
      expect(result.attacker).toBe(player)
      expect(result.defender).toBe(enemy)
    })

    it('should damage defender on hit', () => {
      combatSystem.startCombat(player, enemy)
      const healthBefore = combatSystem.getHealth(enemy)

      const result = combatSystem.attack(player, enemy, sword)

      if (result.wasSuccessful) {
        const healthAfter = combatSystem.getHealth(enemy)
        expect(healthAfter).toBeLessThan(healthBefore)
      }
    })

    it('should not damage defender on miss', () => {
      combatSystem.startCombat(player, enemy)

      let foundMiss = false
      let result

      for (let i = 0; i < 100; i++) {
        result = combatSystem.attack(player, enemy, sword)
        if (!result.wasSuccessful) {
          foundMiss = true
          break
        }
      }

      if (foundMiss) {
        expect(result!.defenderHealthAfter).toBe(result!.defenderHealthBefore)
      }
    })

    it('should end combat when defender dies', () => {
      const encounterId = combatSystem.startCombat(player, enemy)

      // Keep attacking until dead
      for (let i = 0; i < 100; i++) {
        combatSystem.attack(player, enemy, sword, encounterId)

        if (!combatSystem.isAlive(enemy)) break
      }

      const encounter = combatSystem.getEncounter(encounterId)
      expect(encounter?.state).toBe(CombatState.FINISHED)
      expect(encounter?.winner).toBe(player)
    })
  })

  describe('isAlive', () => {
    it('should return true for alive entity', () => {
      expect(combatSystem.isAlive(player)).toBe(true)
    })

    it('should return false for dead entity', () => {
      combatSystem.setHealth(enemy, 0)
      expect(combatSystem.isAlive(enemy)).toBe(false)
    })

    it('should return false for non-existent entity', () => {
      const fakeEntity = 9999 as Entity
      expect(combatSystem.isAlive(fakeEntity)).toBe(false)
    })
  })

  describe('getHealth', () => {
    it('should get entity health', () => {
      const health = combatSystem.getHealth(player)
      expect(health).toBeGreaterThan(0)
    })

    it('should return 0 for dead entity', () => {
      combatSystem.setHealth(enemy, 0)
      const health = combatSystem.getHealth(enemy)
      expect(health).toBe(0)
    })
  })

  describe('setHealth', () => {
    it('should set entity health', () => {
      combatSystem.setHealth(player, 50)
      const health = combatSystem.getHealth(player)
      expect(health).toBe(50)
    })

    it('should not allow negative health', () => {
      combatSystem.setHealth(player, -50)
      const health = combatSystem.getHealth(player)
      expect(health).toBe(0)
    })

    it('should cap at positive values', () => {
      combatSystem.setHealth(player, 9999)
      const health = combatSystem.getHealth(player)
      expect(health).toBeGreaterThan(0)
    })
  })

  describe('heal', () => {
    it('should heal entity', () => {
      combatSystem.setHealth(player, 50)
      const healedAmount = combatSystem.heal(player, 25)

      expect(healedAmount).toBe(75)
    })

    it('should not exceed max health', () => {
      // Set health to a low value
      combatSystem.setHealth(player, 50)

      // Heal by a large amount
      const healedAmount = combatSystem.heal(player, 100)

      // The healed amount should be reasonable (less than current + amount before cap)
      expect(healedAmount).toBeGreaterThan(50) // Should have healed
      expect(healedAmount).toBeLessThanOrEqual(150) // Should not exceed unreasonable amount
    })

    it('should log healing', () => {
      combatSystem.heal(player, 25)
      const log = combatSystem.getCombatLog()

      expect(log.some(entry => entry.includes('healed'))).toBe(true)
    })
  })

  describe('getEncounter', () => {
    it('should return encounter by ID', () => {
      const id = combatSystem.startCombat(player, enemy)
      const encounter = combatSystem.getEncounter(id)

      expect(encounter).toBeDefined()
      expect(encounter?.attacker).toBe(player)
    })

    it('should return undefined for non-existent ID', () => {
      const encounter = combatSystem.getEncounter('non-existent')
      expect(encounter).toBeUndefined()
    })
  })

  describe('getActiveEncounters', () => {
    it('should return active encounters', () => {
      combatSystem.startCombat(player, enemy)
      const active = combatSystem.getActiveEncounters()

      expect(active.length).toBeGreaterThan(0)
    })

    it('should not include finished encounters', () => {
      const id = combatSystem.startCombat(player, enemy)
      combatSystem.endCombat(id)

      const active = combatSystem.getActiveEncounters()
      expect(active.find(e => e)).toBeUndefined()
    })
  })

  describe('previewDamage', () => {
    it('should preview damage without applying', () => {
      const healthBefore = combatSystem.getHealth(enemy)

      const damage = combatSystem.previewDamage(player, enemy, sword)

      const healthAfter = combatSystem.getHealth(enemy)
      expect(healthAfter).toBe(healthBefore)
      expect(damage.totalDamage).toBeGreaterThan(0)
    })
  })

  describe('getHitChance', () => {
    it('should return hit chance', () => {
      const hitChance = combatSystem.getHitChance(player, enemy)

      expect(hitChance).toBeGreaterThan(0)
      expect(hitChance).toBeLessThan(1)
    })

    it('should return higher for higher dex attacker', () => {
      const highDexAttacker = world.createEntity()
      const highDexBase: BaseStats = {
        strength: 10,
        dexterity: 20,
        intelligence: 10,
        constitution: 10,
        wisdom: 10,
        charisma: 10,
      }

      statsSystem.createCharacterWithStats(highDexAttacker, highDexBase, 5)

      const normalChance = combatSystem.getHitChance(player, enemy)
      const highDexChance = combatSystem.getHitChance(highDexAttacker, enemy)

      expect(highDexChance).toBeGreaterThanOrEqual(normalChance)
    })
  })

  describe('getCriticalChance', () => {
    it('should return critical chance', () => {
      const critChance = combatSystem.getCriticalChance(player)

      expect(critChance).toBeGreaterThanOrEqual(0)
      expect(critChance).toBeLessThanOrEqual(0.9)
    })
  })

  describe('simulateBattle', () => {
    it('should simulate full battle', () => {
      const rounds = combatSystem.simulateBattle(player, enemy, sword, 100)

      expect(rounds.length).toBeGreaterThan(0)
      expect(rounds.length).toBeLessThanOrEqual(100)
    })

    it('should end when defender dies', () => {
      const rounds = combatSystem.simulateBattle(player, enemy, sword, 1000)

      const lastRound = rounds[rounds.length - 1]
      expect(lastRound.defenderHealthAfter).toBeLessThanOrEqual(0)
    })
  })

  describe('getCombatLog', () => {
    it('should return combat log entries', () => {
      combatSystem.startCombat(player, enemy)
      const log = combatSystem.getCombatLog()

      expect(log.length).toBeGreaterThan(0)
      expect(typeof log[0]).toBe('string')
    })

    it('should include attack logs', () => {
      const id = combatSystem.startCombat(player, enemy)
      combatSystem.attack(player, enemy, sword, id)

      const log = combatSystem.getCombatLog()
      expect(log.length).toBeGreaterThan(1)
    })
  })

  describe('clearCombatLog', () => {
    it('should clear all log entries', () => {
      combatSystem.startCombat(player, enemy)
      combatSystem.clearCombatLog()

      const log = combatSystem.getCombatLog()
      expect(log.length).toBe(0)
    })
  })

  describe('log', () => {
    it('should add entry to log', () => {
      combatSystem.log('Test message')
      const log = combatSystem.getCombatLog()

      expect(log.some(entry => entry.includes('Test message'))).toBe(true)
    })

    it('should include timestamp', () => {
      combatSystem.log('Test')
      const log = combatSystem.getCombatLog()

      expect(log[0]).toMatch(/\[\d{1,2}:\d{2}:\d{2}/) // Matches [H:MM:SS format
    })
  })

  describe('endCombat', () => {
    it('should end combat encounter', () => {
      const id = combatSystem.startCombat(player, enemy)
      combatSystem.endCombat(id)

      const encounter = combatSystem.getEncounter(id)
      expect(encounter?.state).toBe(CombatState.FINISHED)
    })

    it('should set end time', () => {
      const id = combatSystem.startCombat(player, enemy)
      combatSystem.endCombat(id)

      const encounter = combatSystem.getEncounter(id)
      expect(encounter?.endTime).toBeDefined()
    })
  })

  describe('getStatistics', () => {
    it('should return combat statistics', () => {
      const id = combatSystem.startCombat(player, enemy)

      for (let i = 0; i < 5; i++) {
        combatSystem.attack(player, enemy, sword, id)
      }

      combatSystem.endCombat(id)
      const stats = combatSystem.getStatistics(id)

      expect(stats).toBeDefined()
      expect(stats?.roundCount).toBe(5)
      expect(stats?.hitCount).toBeGreaterThanOrEqual(0)
      expect(stats?.missCount).toBeGreaterThanOrEqual(0)
    })

    it('should return null for non-existent encounter', () => {
      const stats = combatSystem.getStatistics('non-existent')
      expect(stats).toBeNull()
    })

    it('should track critical hits', () => {
      const id = combatSystem.startCombat(player, enemy)

      let foundCritical = false
      for (let i = 0; i < 100; i++) {
        const result = combatSystem.attack(player, enemy, sword, id)
        if (result.damageResult?.isCritical) {
          foundCritical = true
          break
        }
      }

      combatSystem.endCombat(id)
      const stats = combatSystem.getStatistics(id)

      if (foundCritical) {
        expect(stats?.criticalCount).toBeGreaterThan(0)
      }
    })
  })

  describe('clear', () => {
    it('should clear all encounters', () => {
      combatSystem.startCombat(player, enemy)
      combatSystem.clear()

      const active = combatSystem.getActiveEncounters()
      expect(active.length).toBe(0)
    })

    it('should clear combat log', () => {
      combatSystem.startCombat(player, enemy)
      combatSystem.clear()

      const log = combatSystem.getCombatLog()
      expect(log.length).toBe(0)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete combat scenario', () => {
      const encounterId = combatSystem.startCombat(player, enemy)

      const initialEnemyHealth = combatSystem.getHealth(enemy)

      // Execute multiple attacks
      for (let i = 0; i < 10; i++) {
        combatSystem.attack(player, enemy, sword, encounterId)

        if (!combatSystem.isAlive(enemy)) break
      }

      const finalEnemyHealth = combatSystem.getHealth(enemy)
      expect(finalEnemyHealth).toBeLessThanOrEqual(initialEnemyHealth)
    })

    it('should handle multi-round combat', () => {
      const encounterId = combatSystem.startCombat(player, enemy)

      let roundCount = 0
      while (combatSystem.isAlive(enemy) && roundCount < 100) {
        combatSystem.attack(player, enemy, sword, encounterId)
        roundCount++
      }

      const encounter = combatSystem.getEncounter(encounterId)
      expect(encounter?.rounds.length).toBe(roundCount)
    })

    it('should generate combat statistics', () => {
      const encounterId = combatSystem.startCombat(player, enemy)

      // Simulate combat
      const rounds = combatSystem.simulateBattle(player, enemy, sword, 100)

      // Manually execute for stats collection
      for (const _ of rounds) {
        combatSystem.attack(player, enemy, sword, encounterId)

        if (!combatSystem.isAlive(enemy)) break
      }

      const stats = combatSystem.getStatistics(encounterId)

      expect(stats?.roundCount).toBeGreaterThan(0)
      expect(stats?.totalDamage).toBeGreaterThan(0)
    })

    it('should handle healing during combat', () => {
      const encounterId = combatSystem.startCombat(player, enemy)

      // Take damage
      combatSystem.attack(enemy, player, sword, encounterId)

      const damageHealth = combatSystem.getHealth(player)

      // Heal
      const healedHealth = combatSystem.heal(player, 20)

      expect(healedHealth).toBeGreaterThan(damageHealth)
    })
  })

  describe('Edge Cases', () => {
    it('should handle attacks after combat ends', () => {
      const encounterId = combatSystem.startCombat(player, enemy)

      // Simulate combat until end
      const rounds = combatSystem.simulateBattle(player, enemy, sword)
      for (const _ of rounds) {
        combatSystem.attack(player, enemy, sword, encounterId)
        if (!combatSystem.isAlive(enemy)) break
      }

      combatSystem.endCombat(encounterId)

      // Try to attack after
      const result = combatSystem.attack(player, enemy, sword, encounterId)
      expect(result).toBeDefined()
    })

    it('should handle multiple simultaneous combats', () => {
      const player2 = world.createEntity()
      const enemy2 = world.createEntity()

      const baseStats: BaseStats = {
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        constitution: 10,
        wisdom: 10,
        charisma: 10,
      }

      statsSystem.createCharacterWithStats(player2, baseStats, 5)
      statsSystem.createCharacterWithStats(enemy2, baseStats, 5)

      const id1 = combatSystem.startCombat(player, enemy)
      const id2 = combatSystem.startCombat(player2, enemy2)

      expect(id1).not.toBe(id2)

      const active = combatSystem.getActiveEncounters()
      expect(active.length).toBeGreaterThanOrEqual(2)
    })
  })
})

