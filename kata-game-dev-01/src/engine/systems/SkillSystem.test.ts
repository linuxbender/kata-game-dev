import { describe, it, expect, beforeEach } from 'vitest'
import { World } from '@engine/ECS'
import type { Entity } from '@engine/ECS'
import { SkillSystem, type ResourcePool } from './SkillSystem'
import { createSkill, createSkillAdvanced, type Skill } from '@components/Skill'

describe('SkillSystem', () => {
  let world: World
  let skillSystem: SkillSystem
  let caster: Entity
  let fireball: Skill
  let defaultResources: ResourcePool

  beforeEach(() => {
    world = new World()
    skillSystem = new SkillSystem(world)

    caster = world.createEntity()
    fireball = createSkill('fireball', 'Fireball', 'spell', 20)

    defaultResources = {
      mana: { current: 200, max: 200 },
      stamina: { current: 100, max: 100 },
      health: { current: 100, max: 100 },
    }
  })

  describe('castSkill', () => {
    it('should successfully cast a skill', () => {
      const result = skillSystem.castSkill(caster, fireball, defaultResources)

      expect(result.success).toBe(true)
      expect(result.caster).toBe(caster)
      expect(result.skill).toBe(fireball)
      expect(result.damage).toBeGreaterThan(0)
      expect(result.resourceConsumed).toBeGreaterThan(0)
    })

    it('should consume resources on cast', () => {
      const before = defaultResources.mana.current
      skillSystem.castSkill(caster, fireball, defaultResources)

      expect(defaultResources.mana.current).toBeLessThan(before)
    })

    it('should fail if on cooldown', () => {
      // Cast once
      skillSystem.castSkill(caster, fireball, defaultResources)

      // Try to cast immediately
      const result = skillSystem.castSkill(caster, fireball, defaultResources)

      expect(result.success).toBe(false)
      expect(result.failureReason).toBe('cooldown')
    })

    it('should fail if not enough resources', () => {
      const lowMana = {
        ...defaultResources,
        mana: { current: 5, max: 200 },
      }

      const result = skillSystem.castSkill(caster, fireball, lowMana)

      expect(result.success).toBe(false)
      expect(result.failureReason).toBe('resources')
    })

    it('should fail for invalid skill', () => {
      const invalid = { id: 'invalid' } as any

      const result = skillSystem.castSkill(caster, invalid, defaultResources)

      expect(result.success).toBe(false)
      expect(result.failureReason).toBe('invalid_skill')
    })

    it('should work without resources parameter', () => {
      const result = skillSystem.castSkill(caster, fireball)

      expect(result.success).toBe(true)
    })
  })

  describe('canCastSkill', () => {
    it('should return true for new skill', () => {
      expect(skillSystem.canCastSkill(caster, fireball, defaultResources)).toBe(true)
    })

    it('should return false during cooldown', () => {
      skillSystem.castSkill(caster, fireball, defaultResources)
      expect(skillSystem.canCastSkill(caster, fireball, defaultResources)).toBe(false)
    })

    it('should return false without resources', () => {
      const lowMana = {
        ...defaultResources,
        mana: { current: 5, max: 200 },
      }

      expect(skillSystem.canCastSkill(caster, fireball, lowMana)).toBe(false)
    })
  })

  describe('canAffordSkill', () => {
    it('should return true with enough resources', () => {
      expect(skillSystem.canAffordSkill(caster, fireball, defaultResources)).toBe(true)
    })

    it('should return false with insufficient resources', () => {
      const lowMana = {
        ...defaultResources,
        mana: { current: 5, max: 200 },
      }

      expect(skillSystem.canAffordSkill(caster, fireball, lowMana)).toBe(false)
    })

    it('should return true if no resources provided', () => {
      expect(skillSystem.canAffordSkill(caster, fireball)).toBe(true)
    })

    it('should check stamina cost', () => {
      const staminaSkill = createSkill('slash', 'Slash', 'melee', 15)
      const lowStamina = {
        ...defaultResources,
        stamina: { current: 5, max: 100 },
      }

      expect(skillSystem.canAffordSkill(caster, staminaSkill, lowStamina)).toBe(false)
    })

    it('should check health cost', () => {
      const healthSkill = createSkill('sacrifice', 'Sacrifice', 'spell', 20)
      healthSkill.cost.type = 'health'

      expect(skillSystem.canAffordSkill(caster, healthSkill, defaultResources)).toBe(true)
      expect(defaultResources.health.current).toBeGreaterThan(0)
    })
  })

  describe('interruptCast', () => {
    it('should interrupt interruptible cast', () => {
      skillSystem.castSkill(caster, fireball, defaultResources)

      expect(skillSystem.isCasting(caster)).toBe(true)
      const interrupted = skillSystem.interruptCast(caster)

      expect(interrupted).toBe(true)
      expect(skillSystem.isCasting(caster)).toBe(false)
    })

    it('should not interrupt non-interruptible cast', () => {
      fireball.canInterrupt = false
      skillSystem.castSkill(caster, fireball, defaultResources)

      const interrupted = skillSystem.interruptCast(caster)

      expect(interrupted).toBe(false)
      expect(skillSystem.isCasting(caster)).toBe(true)
    })

    it('should return false if not casting', () => {
      const interrupted = skillSystem.interruptCast(caster)
      expect(interrupted).toBe(false)
    })
  })

  describe('isCasting', () => {
    it('should return true after casting', () => {
      skillSystem.castSkill(caster, fireball, defaultResources)
      expect(skillSystem.isCasting(caster)).toBe(true)
    })

    it('should return false before casting', () => {
      expect(skillSystem.isCasting(caster)).toBe(false)
    })

    it('should return false after interrupt', () => {
      skillSystem.castSkill(caster, fireball, defaultResources)
      skillSystem.interruptCast(caster)

      expect(skillSystem.isCasting(caster)).toBe(false)
    })
  })

  describe('getCastProgress', () => {
    it('should return -1 if not casting', () => {
      expect(skillSystem.getCastProgress(caster)).toBe(-1)
    })

    it('should return 0 immediately after cast', () => {
      skillSystem.castSkill(caster, fireball, defaultResources)
      const progress = skillSystem.getCastProgress(caster)

      expect(progress).toBeGreaterThanOrEqual(0)
      expect(progress).toBeLessThanOrEqual(0.1) // Within 10% of start
    })

    it('should progress from 0 to 1', async () => {
      fireball.castTime = 200 // 200ms for fast test
      skillSystem.castSkill(caster, fireball, defaultResources)

      const start = skillSystem.getCastProgress(caster)
      expect(start).toBeGreaterThanOrEqual(0)

      await new Promise(resolve => setTimeout(resolve, 250))

      const end = skillSystem.getCastProgress(caster)
      expect(end).toBeGreaterThanOrEqual(0.9) // Close to 1
    })
  })

  describe('getRemainingCastTime', () => {
    it('should return 0 if not casting', () => {
      expect(skillSystem.getRemainingCastTime(caster)).toBe(0)
    })

    it('should return cast time immediately after cast', () => {
      skillSystem.castSkill(caster, fireball, defaultResources)
      const remaining = skillSystem.getRemainingCastTime(caster)

      expect(remaining).toBeGreaterThan(0)
      expect(remaining).toBeLessThanOrEqual(fireball.castTime)
    })

    it('should decrease over time', async () => {
      fireball.castTime = 200
      skillSystem.castSkill(caster, fireball, defaultResources)

      const start = skillSystem.getRemainingCastTime(caster)
      await new Promise(resolve => setTimeout(resolve, 100))
      const end = skillSystem.getRemainingCastTime(caster)

      expect(end).toBeLessThan(start)
    })
  })

  describe('isCastComplete', () => {
    it('should return false immediately after cast', () => {
      skillSystem.castSkill(caster, fireball, defaultResources)
      expect(skillSystem.isCastComplete(caster)).toBe(false)
    })

    it('should return false if not casting', () => {
      expect(skillSystem.isCastComplete(caster)).toBe(false)
    })

    it('should return true after cast time elapses', async () => {
      fireball.castTime = 50 // 50ms for testing
      skillSystem.castSkill(caster, fireball, defaultResources)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(skillSystem.isCastComplete(caster)).toBe(true)
    })
  })

  describe('getSkillCooldown', () => {
    it('should return 0 for fresh skill', () => {
      expect(skillSystem.getSkillCooldown(caster, fireball)).toBe(0)
    })

    it('should return remaining cooldown after cast', () => {
      skillSystem.castSkill(caster, fireball, defaultResources)
      const cooldown = skillSystem.getSkillCooldown(caster, fireball)

      expect(cooldown).toBeGreaterThan(0)
      expect(cooldown).toBeLessThanOrEqual(fireball.cooldown)
    })
  })

  describe('resetSkillCooldown', () => {
    it('should allow immediate re-cast after reset', () => {
      skillSystem.castSkill(caster, fireball, defaultResources)
      expect(skillSystem.canCastSkill(caster, fireball, defaultResources)).toBe(false)

      skillSystem.resetSkillCooldown(caster, fireball.id)
      expect(skillSystem.canCastSkill(caster, fireball, defaultResources)).toBe(true)
    })
  })

  describe('resetAllCooldowns', () => {
    it('should reset all skill cooldowns', () => {
      const skill1 = createSkill('skill1', 'Skill 1', 'spell', 15)
      const skill2 = createSkill('skill2', 'Skill 2', 'spell', 20)

      skillSystem.castSkill(caster, skill1, defaultResources)
      skillSystem.castSkill(caster, skill2, defaultResources)

      expect(skillSystem.canCastSkill(caster, skill1, defaultResources)).toBe(false)
      expect(skillSystem.canCastSkill(caster, skill2, defaultResources)).toBe(false)

      skillSystem.resetAllCooldowns(caster)

      expect(skillSystem.canCastSkill(caster, skill1, defaultResources)).toBe(true)
      expect(skillSystem.canCastSkill(caster, skill2, defaultResources)).toBe(true)
    })
  })

  describe('clearAllCastingStates', () => {
    it('should clear all casting states', () => {
      const caster2 = world.createEntity()

      skillSystem.castSkill(caster, fireball, defaultResources)
      skillSystem.castSkill(caster2, fireball, defaultResources)

      expect(skillSystem.isCasting(caster)).toBe(true)
      expect(skillSystem.isCasting(caster2)).toBe(true)

      skillSystem.clearAllCastingStates()

      expect(skillSystem.isCasting(caster)).toBe(false)
      expect(skillSystem.isCasting(caster2)).toBe(false)
    })
  })

  describe('getSkillsOnCooldown', () => {
    it('should return empty array if all ready', () => {
      const skills = [
        createSkill('skill1', 'Skill 1', 'spell', 15),
        createSkill('skill2', 'Skill 2', 'spell', 20),
      ]

      const onCooldown = skillSystem.getSkillsOnCooldown(caster, skills)
      expect(onCooldown.length).toBe(0)
    })

    it('should return skills on cooldown', () => {
      const skill1 = createSkill('skill1', 'Skill 1', 'spell', 15)
      const skill2 = createSkill('skill2', 'Skill 2', 'spell', 20)

      skillSystem.castSkill(caster, skill1, defaultResources)

      const onCooldown = skillSystem.getSkillsOnCooldown(caster, [skill1, skill2])
      expect(onCooldown.length).toBe(1)
      expect(onCooldown[0].id).toBe(skill1.id)
    })
  })

  describe('getSkillStats', () => {
    it('should return stats for ready skill', () => {
      const stats = skillSystem.getSkillStats(caster, fireball)

      expect(stats.isReady).toBe(true)
      expect(stats.cooldown).toBe(0)
      expect(stats.cooldownPercent).toBe(0)
      expect(stats.isCasting).toBe(false)
    })

    it('should return stats for skill on cooldown', () => {
      skillSystem.castSkill(caster, fireball, defaultResources)
      const stats = skillSystem.getSkillStats(caster, fireball)

      expect(stats.isReady).toBe(false)
      expect(stats.cooldown).toBeGreaterThan(0)
      expect(stats.cooldownPercent).toBeGreaterThan(0)
      expect(stats.isCasting).toBe(true)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete skill casting cycle', () => {
      // 1. Check if ready
      expect(skillSystem.canCastSkill(caster, fireball, defaultResources)).toBe(true)

      // 2. Cast skill
      const castResult = skillSystem.castSkill(caster, fireball, defaultResources)
      expect(castResult.success).toBe(true)

      // 3. Check during cast
      expect(skillSystem.isCasting(caster)).toBe(true)
      expect(skillSystem.getCastProgress(caster)).toBeGreaterThanOrEqual(0)

      // 4. On cooldown
      expect(skillSystem.canCastSkill(caster, fireball, defaultResources)).toBe(false)

      // 5. Reset and try again
      skillSystem.resetSkillCooldown(caster, fireball.id)
      expect(skillSystem.canCastSkill(caster, fireball, defaultResources)).toBe(true)
    })

    it('should support multiple different skills', () => {
      const skill1 = createSkill('skill1', 'Skill 1', 'spell', 15)
      const skill2 = createSkill('skill2', 'Skill 2', 'melee', 12)

      skillSystem.castSkill(caster, skill1, defaultResources)
      expect(skillSystem.canCastSkill(caster, skill1, defaultResources)).toBe(false)

      // skill2 should still be ready (separate cooldown)
      expect(skillSystem.canCastSkill(caster, skill2, defaultResources)).toBe(true)

      skillSystem.castSkill(caster, skill2, defaultResources)
      expect(skillSystem.canCastSkill(caster, skill2, defaultResources)).toBe(false)
    })

    it('should handle resource management', () => {
      const limited = {
        mana: { current: 50, max: 200 },
        stamina: { current: 100, max: 100 },
        health: { current: 100, max: 100 },
      }

      // Can cast once
      expect(skillSystem.canCastSkill(caster, fireball, limited)).toBe(true)
      skillSystem.castSkill(caster, fireball, limited)

      // Out of mana
      expect(skillSystem.canCastSkill(caster, fireball, limited)).toBe(false)
    })

    it('should handle skill interruption', () => {
      skillSystem.castSkill(caster, fireball, defaultResources)
      expect(skillSystem.isCasting(caster)).toBe(true)

      skillSystem.interruptCast(caster)
      expect(skillSystem.isCasting(caster)).toBe(false)
      expect(skillSystem.getCastProgress(caster)).toBe(-1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle skills without damage', () => {
      const heal = createSkill('heal', 'Heal', 'support', 0)
      const result = skillSystem.castSkill(caster, heal, defaultResources)

      expect(result.success).toBe(true)
    })

    it('should handle zero-cost skills', () => {
      fireball.cost.type = 'none'
      const limited = {
        mana: { current: 0, max: 0 },
        stamina: { current: 0, max: 0 },
        health: { current: 1, max: 100 },
      }

      expect(skillSystem.canCastSkill(caster, fireball, limited)).toBe(true)
    })

    it('should handle very fast cast times', () => {
      fireball.castTime = 1
      const result = skillSystem.castSkill(caster, fireball, defaultResources)

      expect(result.castTime).toBe(1)
    })
  })
})

