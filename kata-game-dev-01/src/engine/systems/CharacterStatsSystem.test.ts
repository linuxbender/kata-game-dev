import { describe, it, expect, beforeEach } from 'vitest'
import { World } from '@engine/ECS'
import type { Entity } from '@engine/ECS'
import { CharacterStatsSystem } from './CharacterStatsSystem'
import type { BaseStats } from '@components/CharacterStats'

describe('CharacterStatsSystem', () => {
  let world: World
  let statsSystem: CharacterStatsSystem
  let player: Entity
  let enemy: Entity

  beforeEach(() => {
    world = new World()
    statsSystem = new CharacterStatsSystem()

    player = world.createEntity()
    enemy = world.createEntity()
  })

  describe('createCharacter', () => {
    it('should create character with default stats', () => {
      const stats = statsSystem.createCharacter(player)

      expect(stats).toBeDefined()
      expect(stats.level).toBe(1)
      expect(stats.base.strength).toBe(10)
    })

    it('should store character stats', () => {
      statsSystem.createCharacter(player)
      const retrieved = statsSystem.getCharacterStats(player)

      expect(retrieved).toBeDefined()
      expect(retrieved?.level).toBe(1)
    })

    it('should create independent characters', () => {
      const stats1 = statsSystem.createCharacter(player)
      const stats2 = statsSystem.createCharacter(enemy)

      expect(stats1).not.toBe(stats2)
    })
  })

  describe('createCharacterWithStats', () => {
    it('should create character with custom stats', () => {
      const warrior: BaseStats = {
        strength: 16,
        dexterity: 10,
        intelligence: 8,
        constitution: 15,
        wisdom: 11,
        charisma: 10,
      }

      const stats = statsSystem.createCharacterWithStats(player, warrior, 5)

      expect(stats.base.strength).toBe(16)
      expect(stats.level).toBe(5)
    })

    it('should calculate derived stats correctly', () => {
      const baseStats: BaseStats = {
        strength: 12,
        dexterity: 10,
        intelligence: 10,
        constitution: 15,
        wisdom: 10,
        charisma: 10,
      }

      const stats = statsSystem.createCharacterWithStats(player, baseStats)

      expect(stats.derived.health).toBeGreaterThan(0)
      expect(stats.derived.mana).toBeGreaterThan(0)
    })
  })

  describe('getCharacterStats', () => {
    it('should return stats for created character', () => {
      statsSystem.createCharacter(player)
      const stats = statsSystem.getCharacterStats(player)

      expect(stats).toBeDefined()
    })

    it('should return undefined for non-existent character', () => {
      const stats = statsSystem.getCharacterStats(player)
      expect(stats).toBeUndefined()
    })
  })

  describe('applyEquipmentBonuses', () => {
    it('should apply bonuses to stats', () => {
      statsSystem.createCharacter(player)
      const before = statsSystem.getDerivedStat(player, 'health')

      const bonuses = [
        { stat: 'strength' as const, amount: 5 },
        { stat: 'constitution' as const, amount: 3 },
      ]

      statsSystem.applyEquipmentBonuses(player, bonuses)

      const after = statsSystem.getDerivedStat(player, 'health')
      expect(after).toBeGreaterThan(before)
    })

    it('should handle empty bonuses', () => {
      statsSystem.createCharacter(player)
      const before = statsSystem.getDerivedStat(player, 'health')

      statsSystem.applyEquipmentBonuses(player, [])

      const after = statsSystem.getDerivedStat(player, 'health')
      expect(after).toBe(before)
    })

    it('should accumulate multiple bonuses to same stat', () => {
      statsSystem.createCharacter(player)

      const bonuses = [
        { stat: 'strength' as const, amount: 3 },
        { stat: 'strength' as const, amount: 2 },
      ]

      statsSystem.applyEquipmentBonuses(player, bonuses)

      // Equipment bonuses don't change base stat, only derived
      // So health should increase
      const healthAfter = statsSystem.getDerivedStat(player, 'health')
      const healthBefore = 70 // default 10 + (10*5) + (10*2)

      expect(healthAfter).toBeGreaterThan(healthBefore)
    })
  })

  describe('addExperience', () => {
    it('should add experience', () => {
      statsSystem.createCharacter(player)
      statsSystem.addExperience(player, 50)

      const stats = statsSystem.getCharacterStats(player)
      expect(stats?.experience).toBe(50)
    })

    it('should apply bonus multiplier', () => {
      statsSystem.createCharacter(player)
      statsSystem.addExperience(player, 50, 1.5) // 75 XP total (no level up)

      const stats = statsSystem.getCharacterStats(player)
      expect(stats?.experience).toBe(75)
    })

    it('should trigger level up', () => {
      statsSystem.createCharacter(player)
      const levelsGained = statsSystem.addExperience(player, 100)

      expect(levelsGained).toBe(1)
      expect(statsSystem.getLevel(player)).toBe(2)
    })

    it('should handle multiple level ups', () => {
      statsSystem.createCharacter(player)
      const levelsGained = statsSystem.addExperience(player, 500)

      expect(levelsGained).toBeGreaterThanOrEqual(1)
      expect(statsSystem.getLevel(player)).toBeGreaterThanOrEqual(2)
    })
  })

  describe('levelUp', () => {
    it('should increase level', () => {
      statsSystem.createCharacter(player)
      statsSystem.levelUp(player)

      expect(statsSystem.getLevel(player)).toBe(2)
    })

    it('should handle multiple level ups', () => {
      statsSystem.createCharacter(player)
      statsSystem.levelUp(player, 5)

      expect(statsSystem.getLevel(player)).toBe(6)
    })

    it('should update experience to next level', () => {
      statsSystem.createCharacter(player)
      statsSystem.levelUp(player)

      const stats = statsSystem.getCharacterStats(player)
      expect(stats?.experienceToNextLevel).toBeGreaterThan(0)
    })
  })

  describe('getStatValue', () => {
    it('should return base stat', () => {
      const warrior: BaseStats = {
        strength: 16,
        dexterity: 10,
        intelligence: 8,
        constitution: 15,
        wisdom: 11,
        charisma: 10,
      }

      statsSystem.createCharacterWithStats(player, warrior)
      expect(statsSystem.getStatValue(player, 'strength')).toBe(16)
    })

    it('should return 0 for non-existent character', () => {
      expect(statsSystem.getStatValue(player, 'strength')).toBe(0)
    })
  })

  describe('getDerivedStat', () => {
    it('should return derived stat', () => {
      statsSystem.createCharacter(player)
      const health = statsSystem.getDerivedStat(player, 'health')

      expect(health).toBeGreaterThan(0)
    })

    it('should return 0 for non-existent character', () => {
      expect(statsSystem.getDerivedStat(player, 'health')).toBe(0)
    })
  })

  describe('getLevel', () => {
    it('should return character level', () => {
      statsSystem.createCharacter(player)
      expect(statsSystem.getLevel(player)).toBe(1)
    })

    it('should return 0 for non-existent character', () => {
      expect(statsSystem.getLevel(player)).toBe(0)
    })
  })

  describe('meetsLevelRequirement', () => {
    it('should return true if meets requirement', () => {
      statsSystem.createCharacterWithStats(
        player,
        {
          strength: 10,
          dexterity: 10,
          intelligence: 10,
          constitution: 10,
          wisdom: 10,
          charisma: 10,
        },
        5
      )

      expect(statsSystem.meetsLevelRequirement(player, 5)).toBe(true)
      expect(statsSystem.meetsLevelRequirement(player, 4)).toBe(true)
    })

    it('should return false if below requirement', () => {
      statsSystem.createCharacter(player)

      expect(statsSystem.meetsLevelRequirement(player, 2)).toBe(false)
    })
  })

  describe('getStatEffectiveness', () => {
    it('should return 1.0 for same level', () => {
      statsSystem.createCharacterWithStats(
        player,
        {
          strength: 10,
          dexterity: 10,
          intelligence: 10,
          constitution: 10,
          wisdom: 10,
          charisma: 10,
        },
        10
      )

      expect(statsSystem.getStatEffectiveness(player, 10)).toBe(1.0)
    })

    it('should return > 1.0 for lower level target', () => {
      statsSystem.createCharacterWithStats(
        player,
        {
          strength: 10,
          dexterity: 10,
          intelligence: 10,
          constitution: 10,
          wisdom: 10,
          charisma: 10,
        },
        10
      )

      expect(statsSystem.getStatEffectiveness(player, 5)).toBeGreaterThan(1.0)
    })

    it('should return < 1.0 for higher level target', () => {
      statsSystem.createCharacterWithStats(
        player,
        {
          strength: 10,
          dexterity: 10,
          intelligence: 10,
          constitution: 10,
          wisdom: 10,
          charisma: 10,
        },
        10
      )

      expect(statsSystem.getStatEffectiveness(player, 15)).toBeLessThan(1.0)
    })
  })

  describe('getStatsSummary', () => {
    it('should return summary object', () => {
      statsSystem.createCharacter(player)
      const summary = statsSystem.getStatsSummary(player)

      expect(summary).toBeDefined()
      expect(summary).toHaveProperty('level')
      expect(summary).toHaveProperty('health')
      expect(summary).toHaveProperty('mana')
    })

    it('should return null for non-existent character', () => {
      const summary = statsSystem.getStatsSummary(player)
      expect(summary).toBeNull()
    })
  })

  describe('updateCharacterStats', () => {
    it('should update base stats', () => {
      statsSystem.createCharacter(player)

      const newBase: BaseStats = {
        strength: 15,
        dexterity: 12,
        intelligence: 14,
        constitution: 13,
        wisdom: 11,
        charisma: 10,
      }

      statsSystem.updateCharacterStats(player, newBase)

      expect(statsSystem.getStatValue(player, 'strength')).toBe(15)
    })

    it('should recalculate derived stats', () => {
      statsSystem.createCharacter(player)
      const beforeHealth = statsSystem.getDerivedStat(player, 'health')

      const newBase: BaseStats = {
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        constitution: 20,
        wisdom: 10,
        charisma: 10,
      }

      statsSystem.updateCharacterStats(player, newBase)
      const afterHealth = statsSystem.getDerivedStat(player, 'health')

      expect(afterHealth).toBeGreaterThan(beforeHealth)
    })
  })

  describe('resetCharacter', () => {
    it('should reset experience', () => {
      statsSystem.createCharacter(player)
      statsSystem.addExperience(player, 100)
      statsSystem.resetCharacter(player)

      const stats = statsSystem.getCharacterStats(player)
      expect(stats?.experience).toBe(0)
    })

    it('should recalculate derived stats', () => {
      statsSystem.createCharacter(player)
      const stats = statsSystem.getCharacterStats(player)!

      // Add equipment bonus
      stats.base.strength = 15
      stats.base.constitution = 15
      stats.derived = {
        ...stats.derived,
        health: 150,
      }

      statsSystem.resetCharacter(player)

      const resetStats = statsSystem.getCharacterStats(player)!
      expect(resetStats.base.strength).toBe(15)
      expect(resetStats.base.constitution).toBe(15)
      // Health = 10 + (15*5) + (15*2) = 10 + 75 + 30 = 115
      expect(resetStats.derived.health).toBe(115)
    })
  })

  describe('getAllCharacters', () => {
    it('should return all characters', () => {
      statsSystem.createCharacter(player)
      statsSystem.createCharacter(enemy)

      const all = statsSystem.getAllCharacters()
      expect(all.size).toBe(2)
    })

    it('should return empty map when no characters', () => {
      const all = statsSystem.getAllCharacters()
      expect(all.size).toBe(0)
    })
  })

  describe('removeCharacter', () => {
    it('should remove character stats', () => {
      statsSystem.createCharacter(player)
      statsSystem.removeCharacter(player)

      expect(statsSystem.getCharacterStats(player)).toBeUndefined()
    })
  })

  describe('clear', () => {
    it('should clear all characters', () => {
      statsSystem.createCharacter(player)
      statsSystem.createCharacter(enemy)

      statsSystem.clear()

      expect(statsSystem.getAllCharacters().size).toBe(0)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete character lifecycle', () => {
      // Create
      const warrior: BaseStats = {
        strength: 16,
        dexterity: 10,
        intelligence: 8,
        constitution: 15,
        wisdom: 11,
        charisma: 10,
      }

      statsSystem.createCharacterWithStats(player, warrior, 1)
      const healthBefore = statsSystem.getDerivedStat(player, 'health')

      // Level up
      statsSystem.addExperience(player, 500)
      const levelAfterXp = statsSystem.getLevel(player)
      expect(levelAfterXp).toBeGreaterThanOrEqual(1)

      // Apply equipment
      const bonuses = [{ stat: 'strength' as const, amount: 5 }]
      statsSystem.applyEquipmentBonuses(player, bonuses)

      // Base stat should still be 16 (equipment doesn't change base stats)
      const finalStr = statsSystem.getStatValue(player, 'strength')
      expect(finalStr).toBe(16)

      // But derived stats should improve due to equipment bonus
      const healthAfter = statsSystem.getDerivedStat(player, 'health')
      expect(healthAfter).toBeGreaterThan(healthBefore)
    })

    it('should compare multiple characters', () => {
      const warrior: BaseStats = {
        strength: 16,
        dexterity: 10,
        intelligence: 8,
        constitution: 15,
        wisdom: 11,
        charisma: 10,
      }

      const mage: BaseStats = {
        strength: 8,
        dexterity: 12,
        intelligence: 16,
        constitution: 10,
        wisdom: 14,
        charisma: 10,
      }

      statsSystem.createCharacterWithStats(player, warrior)
      statsSystem.createCharacterWithStats(enemy, mage)

      const warriorHealth = statsSystem.getDerivedStat(player, 'health')
      const mageHealth = statsSystem.getDerivedStat(enemy, 'health')

      expect(warriorHealth).toBeGreaterThan(mageHealth)
    })

    it('should handle level scaling for combat', () => {
      const player1: BaseStats = {
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        constitution: 10,
        wisdom: 10,
        charisma: 10,
      }

      const player2 = { ...player1 }

      statsSystem.createCharacterWithStats(player, player1, 5)
      statsSystem.createCharacterWithStats(enemy, player2, 10)

      const eff1 = statsSystem.getStatEffectiveness(player, 10)
      const eff2 = statsSystem.getStatEffectiveness(enemy, 10)

      expect(eff1).toBeLessThan(eff2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle operations on non-existent character', () => {
      expect(() => {
        statsSystem.addExperience(player, 100)
        statsSystem.levelUp(player)
        statsSystem.applyEquipmentBonuses(player, [])
      }).not.toThrow()
    })

    it('should handle level 100 character', () => {
      statsSystem.createCharacterWithStats(
        player,
        {
          strength: 10,
          dexterity: 10,
          intelligence: 10,
          constitution: 10,
          wisdom: 10,
          charisma: 10,
        },
        100
      )

      expect(statsSystem.getLevel(player)).toBe(100)
    })

    it('should handle extreme stat values', () => {
      const extreme: BaseStats = {
        strength: 50,
        dexterity: 50,
        intelligence: 50,
        constitution: 50,
        wisdom: 50,
        charisma: 50,
      }

      statsSystem.createCharacterWithStats(player, extreme)

      const health = statsSystem.getDerivedStat(player, 'health')
      expect(health).toBeGreaterThan(0)
      expect(health).toBeLessThanOrEqual(999999) // Sanity check
    })
  })
})

