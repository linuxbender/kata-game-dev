import { describe, it, expect, beforeEach } from 'vitest'
import {
  isCharacterStats,
  extractCharacterStats,
  createDefaultStats,
  createCharacterStats,
  calculateDerivedStats,
  calculateExperienceForLevel,
  addExperience,
  getExperienceProgress,
  getStatPointValue,
  meetsLevelRequirement,
  calculateStatEffectiveness,
  getStatsSummary,
  type CharacterStats,
  type BaseStats,
} from './CharacterStats'

describe('Character Stats Component', () => {
  describe('isCharacterStats Type Guard', () => {
    it('should identify valid character stats', () => {
      const stats = createDefaultStats()
      expect(isCharacterStats(stats)).toBe(true)
    })

    it('should reject invalid stats', () => {
      expect(isCharacterStats({ base: {} })).toBe(false)
      expect(isCharacterStats(null)).toBe(false)
      expect(isCharacterStats('stats')).toBe(false)
    })
  })

  describe('extractCharacterStats', () => {
    it('should extract valid stats', () => {
      const stats = createDefaultStats()
      const extracted = extractCharacterStats(stats)
      expect(extracted).toBeDefined()
      expect(extracted?.level).toBe(1)
    })

    it('should return undefined for invalid', () => {
      expect(extractCharacterStats({ base: {} })).toBeUndefined()
    })
  })

  describe('createDefaultStats', () => {
    it('should create level 1 character', () => {
      const stats = createDefaultStats()

      expect(stats.level).toBe(1)
      expect(stats.experience).toBe(0)
      expect(stats.experienceToNextLevel).toBe(100)
    })

    it('should have balanced base stats', () => {
      const stats = createDefaultStats()

      expect(stats.base.strength).toBe(10)
      expect(stats.base.dexterity).toBe(10)
      expect(stats.base.intelligence).toBe(10)
      expect(stats.base.constitution).toBe(10)
      expect(stats.base.wisdom).toBe(10)
      expect(stats.base.charisma).toBe(10)
    })

    it('should calculate initial derived stats', () => {
      const stats = createDefaultStats()

      expect(stats.derived.health).toBeGreaterThan(0)
      expect(stats.derived.mana).toBeGreaterThan(0)
      expect(stats.derived.armor).toBeGreaterThan(0)
    })
  })

  describe('createCharacterStats', () => {
    it('should create custom character', () => {
      const baseStats: BaseStats = {
        strength: 15,
        dexterity: 12,
        intelligence: 14,
        constitution: 13,
        wisdom: 11,
        charisma: 10,
      }

      const stats = createCharacterStats(baseStats, 5)

      expect(stats.level).toBe(5)
      expect(stats.base.strength).toBe(15)
    })

    it('should calculate different derived stats for different builds', () => {
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

      const warriorStats = createCharacterStats(warrior)
      const mageStats = createCharacterStats(mage)

      // Warrior should have more health
      expect(warriorStats.derived.health).toBeGreaterThan(mageStats.derived.health)

      // Mage should have more mana
      expect(mageStats.derived.mana).toBeGreaterThan(warriorStats.derived.mana)
    })
  })

  describe('calculateDerivedStats', () => {
    it('should calculate health correctly', () => {
      const baseStats: BaseStats = {
        strength: 12,
        dexterity: 10,
        intelligence: 10,
        constitution: 15,
        wisdom: 10,
        charisma: 10,
      }

      const derived = calculateDerivedStats(baseStats)

      // Health = 10 + (CON × 5) + (STR × 2)
      // = 10 + (15 × 5) + (12 × 2) = 10 + 75 + 24 = 109
      expect(derived.health).toBe(109)
    })

    it('should calculate mana correctly', () => {
      const baseStats: BaseStats = {
        strength: 10,
        dexterity: 10,
        intelligence: 14,
        constitution: 10,
        wisdom: 12,
        charisma: 10,
      }

      const derived = calculateDerivedStats(baseStats)

      // Mana = 10 + (INT × 5) + (WIS × 2)
      // = 10 + (14 × 5) + (12 × 2) = 10 + 70 + 24 = 104
      expect(derived.mana).toBe(104)
    })

    it('should apply stat modifiers', () => {
      const baseStats: BaseStats = {
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        constitution: 10,
        wisdom: 10,
        charisma: 10,
      }

      const modifiers = {
        base: { strength: 5, constitution: 3 },
      }

      const derived = calculateDerivedStats(baseStats, modifiers)
      const unmodified = calculateDerivedStats(baseStats)

      expect(derived.health).toBeGreaterThan(unmodified.health)
    })

    it('should calculate dodge from dexterity', () => {
      const dex15: BaseStats = {
        strength: 10,
        dexterity: 15,
        intelligence: 10,
        constitution: 10,
        wisdom: 10,
        charisma: 10,
      }

      const dex10: BaseStats = {
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        constitution: 10,
        wisdom: 10,
        charisma: 10,
      }

      const stats15 = calculateDerivedStats(dex15)
      const stats10 = calculateDerivedStats(dex10)

      expect(stats15.dodge).toBeGreaterThan(stats10.dodge)
    })

    it('should cap dodge and magic resistance at 0.9', () => {
      const veryHigh: BaseStats = {
        strength: 10,
        dexterity: 50,
        intelligence: 10,
        constitution: 10,
        wisdom: 50,
        charisma: 10,
      }

      const derived = calculateDerivedStats(veryHigh)

      expect(derived.dodge).toBeLessThanOrEqual(0.9)
      expect(derived.magicResistance).toBeLessThanOrEqual(0.9)
    })
  })

  describe('calculateExperienceForLevel', () => {
    it('should calculate xp for level 1', () => {
      expect(calculateExperienceForLevel(1)).toBe(100)
    })

    it('should calculate xp for level 2', () => {
      // 100 × 2^1.5 ≈ 282.84... → rounds to 283
      expect(calculateExperienceForLevel(2)).toBe(283)
    })

    it('should increase exponentially', () => {
      const level1 = calculateExperienceForLevel(1)
      const level5 = calculateExperienceForLevel(5)
      const level10 = calculateExperienceForLevel(10)

      expect(level5).toBeGreaterThan(level1)
      expect(level10).toBeGreaterThan(level5)
      expect(level10 - level5).toBeGreaterThan(level5 - level1) // Exponential growth
    })
  })

  describe('addExperience', () => {
    let stats: CharacterStats

    beforeEach(() => {
      stats = createDefaultStats()
    })

    it('should add experience', () => {
      const before = stats.experience
      addExperience(stats, 50)
      expect(stats.experience).toBe(before + 50)
    })

    it('should apply bonus multiplier', () => {
      addExperience(stats, 50, 1.5) // 50 * 1.5 = 75 XP
      expect(stats.experience).toBe(75)
    })

    it('should trigger level up at 100 xp', () => {
      const levelsGained = addExperience(stats, 100)
      expect(levelsGained).toBe(1)
      expect(stats.level).toBe(2)
    })

    it('should handle multiple level ups', () => {
      const levelsGained = addExperience(stats, 500)
      expect(levelsGained).toBeGreaterThanOrEqual(1)
      expect(stats.level).toBeGreaterThanOrEqual(2)
    })

    it('should reset experience on level up', () => {
      addExperience(stats, 150) // Should go to level 2 with 50 overflow
      expect(stats.level).toBe(2)
      expect(stats.experience).toBe(50) // 150 - 100 = 50
    })
  })

  describe('getExperienceProgress', () => {
    it('should return 0 at start of level', () => {
      const stats = createDefaultStats()
      expect(getExperienceProgress(stats)).toBe(0)
    })

    it('should return 0.5 halfway to next level', () => {
      const stats = createDefaultStats()
      stats.experience = 50 // Half of 100
      expect(getExperienceProgress(stats)).toBe(0.5)
    })

    it('should return 1 at level up', () => {
      const stats = createDefaultStats()
      stats.experience = 100
      expect(getExperienceProgress(stats)).toBe(1)
    })

    it('should cap at 1', () => {
      const stats = createDefaultStats()
      stats.experience = 150
      expect(getExperienceProgress(stats)).toBeLessThanOrEqual(1)
    })
  })

  describe('getStatPointValue', () => {
    it('should return 1.0 at level 1', () => {
      expect(getStatPointValue(1)).toBe(1.0)
    })

    it('should increase with level', () => {
      const level1 = getStatPointValue(1)
      const level10 = getStatPointValue(10)
      expect(level10).toBeGreaterThan(level1)
    })

    it('should increase by 0.1 per level', () => {
      expect(getStatPointValue(2)).toBe(1.1)
      expect(getStatPointValue(5)).toBe(1.4)
      expect(getStatPointValue(10)).toBe(1.9)
    })
  })

  describe('meetsLevelRequirement', () => {
    it('should return true if meets requirement', () => {
      const stats = createCharacterStats(
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

      expect(meetsLevelRequirement(stats, 5)).toBe(true)
      expect(meetsLevelRequirement(stats, 4)).toBe(true)
    })

    it('should return false if below requirement', () => {
      const stats = createCharacterStats(
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

      expect(meetsLevelRequirement(stats, 6)).toBe(false)
    })
  })

  describe('calculateStatEffectiveness', () => {
    let stats: CharacterStats

    beforeEach(() => {
      stats = createCharacterStats(
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
    })

    it('should return 1.0 for same level', () => {
      expect(calculateStatEffectiveness(stats, 10)).toBe(1.0)
    })

    it('should return > 1.0 if over-leveled', () => {
      expect(calculateStatEffectiveness(stats, 5)).toBeGreaterThan(1.0)
    })

    it('should return < 1.0 if under-leveled', () => {
      expect(calculateStatEffectiveness(stats, 15)).toBeLessThan(1.0)
    })

    it('should be capped at 0.5 - 2.0', () => {
      const veryOver = calculateStatEffectiveness(stats, 0)
      const veryUnder = calculateStatEffectiveness(stats, 100)

      expect(veryOver).toBeLessThanOrEqual(2.0)
      expect(veryUnder).toBeGreaterThanOrEqual(0.5)
    })
  })

  describe('getStatsSummary', () => {
    it('should return summary object', () => {
      const stats = createDefaultStats()
      const summary = getStatsSummary(stats)

      expect(summary).toHaveProperty('level')
      expect(summary).toHaveProperty('health')
      expect(summary).toHaveProperty('mana')
      expect(summary).toHaveProperty('armor')
      expect(summary).toHaveProperty('dodge')
    })

    it('should format percentages correctly', () => {
      const stats = createDefaultStats()
      const summary = getStatsSummary(stats)

      expect(typeof summary.dodge).toBe('number')
      expect(summary.dodge).toBeGreaterThanOrEqual(0)
      expect(summary.dodge).toBeLessThanOrEqual(100)
    })
  })

  describe('Integration Tests', () => {
    it('should handle character progression', () => {
      const stats = createDefaultStats()

      // Level up
      addExperience(stats, 1000)

      expect(stats.level).toBeGreaterThanOrEqual(3)
      expect(stats.experience).toBeGreaterThanOrEqual(0)
      expect(meetsLevelRequirement(stats, stats.level)).toBe(true)
    })

    it('should reflect level in stat effectiveness', () => {
      const lowLevel = createCharacterStats(
        {
          strength: 10,
          dexterity: 10,
          intelligence: 10,
          constitution: 10,
          wisdom: 10,
          charisma: 10,
        },
        1
      )

      const highLevel = createCharacterStats(
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

      const lowEff = calculateStatEffectiveness(lowLevel, 5)
      const highEff = calculateStatEffectiveness(highLevel, 5)

      expect(lowEff).toBeLessThan(highEff)
    })

    it('should create different character builds', () => {
      const warrior = createCharacterStats(
        {
          strength: 16,
          dexterity: 10,
          intelligence: 8,
          constitution: 15,
          wisdom: 11,
          charisma: 10,
        },
        1
      )

      const rogue = createCharacterStats(
        {
          strength: 10,
          dexterity: 16,
          intelligence: 12,
          constitution: 10,
          wisdom: 11,
          charisma: 12,
        },
        1
      )

      const mage = createCharacterStats(
        {
          strength: 8,
          dexterity: 12,
          intelligence: 16,
          constitution: 10,
          wisdom: 14,
          charisma: 10,
        },
        1
      )

      expect(warrior.derived.health).toBeGreaterThan(mage.derived.health)
      expect(rogue.derived.dodge).toBeGreaterThan(warrior.derived.dodge)
      expect(mage.derived.mana).toBeGreaterThan(warrior.derived.mana)
    })
  })

  describe('Edge Cases', () => {
    it('should handle level 100', () => {
      const stats = createCharacterStats(
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

      expect(stats.level).toBe(100)
      expect(stats.experienceToNextLevel).toBeGreaterThan(0)
    })

    it('should handle negative stat modifiers', () => {
      const baseStats: BaseStats = {
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        constitution: 10,
        wisdom: 10,
        charisma: 10,
      }

      const modifiers = {
        base: { constitution: -5 },
      }

      const derived = calculateDerivedStats(baseStats, modifiers)
      expect(derived.health).toBeGreaterThan(0) // Should still be positive
    })

    it('should handle very low stats', () => {
      const lowStats: BaseStats = {
        strength: 3,
        dexterity: 3,
        intelligence: 3,
        constitution: 3,
        wisdom: 3,
        charisma: 3,
      }

      const derived = calculateDerivedStats(lowStats)

      expect(derived.health).toBeGreaterThan(0)
      expect(derived.mana).toBeGreaterThan(0)
    })
  })
})

