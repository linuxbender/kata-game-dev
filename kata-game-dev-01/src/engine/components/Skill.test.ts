import { describe, it, expect, beforeEach } from 'vitest'
import {
  isSkill,
  extractSkill,
  createSkill,
  createSkillAdvanced,
  calculateSkillDamage,
  canCastSkill,
  getSkillCooldown,
  isSkillReady,
  getSkillCastTime,
  getSkillEffectiveness,
  getSkillCost,
  getSkillEffects,
  isAreaOfEffect,
  getAoERadius,
  type Skill,
} from './Skill'

describe('Skill Component', () => {
  describe('isSkill Type Guard', () => {
    it('should identify valid skill', () => {
      const skill: Skill = {
        id: 'fireball',
        name: 'Fireball',
        type: 'spell',
        damage: { baseValue: 20, variance: 5, type: 'fire' },
        cooldown: 3000,
        range: 200,
        cost: { type: 'mana', amount: 30 },
        effects: [],
        castTime: 500,
      }
      expect(isSkill(skill)).toBe(true)
    })

    it('should reject invalid skills', () => {
      expect(isSkill({ id: 'skill_1' })).toBe(false)
      expect(isSkill(null)).toBe(false)
      expect(isSkill(undefined)).toBe(false)
      expect(isSkill('skill')).toBe(false)
    })

    it('should require all necessary properties', () => {
      const incomplete = {
        id: 'skill_1',
        name: 'Spell',
        type: 'spell',
        cooldown: 1000,
        range: 200,
        // Missing cost, castTime, effects
      }
      expect(isSkill(incomplete)).toBe(false)
    })
  })

  describe('extractSkill', () => {
    it('should extract valid skill', () => {
      const skill = createSkill('fireball', 'Fireball', 'spell', 20)
      const extracted = extractSkill(skill)
      expect(extracted).toBeDefined()
      expect(extracted?.name).toBe('Fireball')
    })

    it('should return undefined for invalid skill', () => {
      expect(extractSkill({ id: 'skill_1' })).toBeUndefined()
      expect(extractSkill(null)).toBeUndefined()
    })
  })

  describe('createSkill Factory', () => {
    it('should create spell with magic damage', () => {
      const fireball = createSkill('fireball', 'Fireball', 'spell', 20)

      expect(fireball.id).toBe('fireball')
      expect(fireball.name).toBe('Fireball')
      expect(fireball.type).toBe('spell')
      expect(fireball.damage?.type).toBe('magic')
      expect(fireball.cost.type).toBe('mana')
      expect(fireball.castTime).toBe(500)
      expect(fireball.range).toBe(200)
    })

    it('should create melee skill with physical damage', () => {
      const slash = createSkill('slash', 'Slash', 'melee', 15)

      expect(slash.type).toBe('melee')
      expect(slash.damage?.type).toBe('physical')
      expect(slash.cost.type).toBe('stamina')
      expect(slash.castTime).toBe(100)
      expect(slash.range).toBe(30)
    })

    it('should calculate appropriate cost', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      expect(skill.cost.amount).toBe(Math.ceil(20 * 1.5)) // 30
    })

    it('should calculate variance', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      expect(skill.damage?.variance).toBe(4) // 20 * 0.2
    })
  })

  describe('createSkillAdvanced', () => {
    it('should create skill with custom properties', () => {
      const frostbolt: Skill = {
        id: 'frostbolt',
        name: 'Frostbolt',
        type: 'spell',
        damage: { baseValue: 18, variance: 4, type: 'cold', scaling: 0.6 },
        cooldown: 2000,
        range: 180,
        cost: { type: 'mana', amount: 25 },
        effects: [
          { id: 'slow', name: 'Slow', type: 'debuff', duration: 3000, potency: 40 },
        ],
        castTime: 600,
        level: 5,
      }

      const skill = createSkillAdvanced(frostbolt)

      expect(skill.damage?.type).toBe('cold')
      expect(skill.cooldown).toBe(2000)
      expect(skill.effects.length).toBe(1)
      expect(skill.level).toBe(5)
    })
  })

  describe('calculateSkillDamage', () => {
    it('should return damage within variance range', () => {
      const fireball = createSkill('fireball', 'Fireball', 'spell', 20)
      // Variance is 4, so damage should be between 16 and 24

      const damages = Array.from({ length: 100 }, () => calculateSkillDamage(fireball))

      damages.forEach(dmg => {
        expect(dmg).toBeGreaterThanOrEqual(16) // baseValue - variance
        expect(dmg).toBeLessThanOrEqual(24) // baseValue + variance
      })
    })

    it('should apply stats modifier', () => {
      const fireball = createSkill('fireball', 'Fireball', 'spell', 20)

      // With 1.5x modifier, should be between 24-36 (16*1.5 to 24*1.5)
      const damages = Array.from({ length: 100 }, () =>
        calculateSkillDamage(fireball, 1.5)
      )

      damages.forEach(dmg => {
        expect(dmg).toBeGreaterThanOrEqual(24)
        expect(dmg).toBeLessThanOrEqual(36)
      })
    })

    it('should have minimum damage of 1', () => {
      const skill = createSkill('weak', 'Weak', 'spell', 1)
      const damages = Array.from({ length: 50 }, () => calculateSkillDamage(skill))

      damages.forEach(dmg => {
        expect(dmg).toBeGreaterThanOrEqual(1)
      })
    })

    it('should handle skills without damage', () => {
      const skill: Skill = {
        id: 'heal',
        name: 'Heal',
        type: 'support',
        cooldown: 2000,
        range: 150,
        cost: { type: 'mana', amount: 25 },
        effects: [],
        castTime: 300,
      }

      const damage = calculateSkillDamage(skill)
      expect(damage).toBe(0)
    })
  })

  describe('canCastSkill', () => {
    it('should return true if has enough resources', () => {
      const skill = createSkill('fireball', 'Fireball', 'spell', 20)
      expect(canCastSkill(skill, 100)).toBe(true) // Need 30, have 100
    })

    it('should return false if not enough resources', () => {
      const skill = createSkill('fireball', 'Fireball', 'spell', 20)
      expect(canCastSkill(skill, 10)).toBe(false) // Need 30, have 10
    })

    it('should return true if exactly enough', () => {
      const skill = createSkill('fireball', 'Fireball', 'spell', 20)
      const cost = skill.cost.amount
      expect(canCastSkill(skill, cost)).toBe(true)
    })
  })

  describe('getSkillCooldown', () => {
    it('should return 0 if cooldown elapsed', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      const veryOldTime = Date.now() - 100000 // 100 seconds ago

      const cooldown = getSkillCooldown(skill, veryOldTime)
      expect(cooldown).toBe(0)
    })

    it('should return remaining cooldown', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      skill.cooldown = 5000 // 5 seconds
      const recentTime = Date.now() - 2000 // 2 seconds ago

      const cooldown = getSkillCooldown(skill, recentTime)
      expect(cooldown).toBeGreaterThan(2500) // At least 2.5 seconds remaining
      expect(cooldown).toBeLessThanOrEqual(3000) // At most 3 seconds remaining
    })
  })

  describe('isSkillReady', () => {
    it('should return true if cooldown elapsed', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      const veryOldTime = Date.now() - 100000

      expect(isSkillReady(skill, veryOldTime)).toBe(true)
    })

    it('should return false if in cooldown', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      skill.cooldown = 5000
      const recentTime = Date.now() - 1000 // 1 second ago

      expect(isSkillReady(skill, recentTime)).toBe(false)
    })

    it('should return true if exactly on cooldown boundary', async () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      skill.cooldown = 50 // 50ms for fast test

      const castTime = Date.now()
      await new Promise(resolve => setTimeout(resolve, 60))

      expect(isSkillReady(skill, castTime)).toBe(true)
    })
  })

  describe('getSkillCastTime', () => {
    it('should return base cast time', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      expect(getSkillCastTime(skill)).toBe(skill.castTime)
    })

    it('should apply speed modifier', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      skill.castTime = 500

      const normal = getSkillCastTime(skill, 1.0) // 500ms
      const haste = getSkillCastTime(skill, 2.0) // 250ms
      const slow = getSkillCastTime(skill, 0.5) // 1000ms

      expect(normal).toBe(500)
      expect(haste).toBe(250)
      expect(slow).toBe(1000)
    })
  })

  describe('getSkillEffectiveness', () => {
    it('should return 0.5 if under-leveled', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      skill.level = 10

      expect(getSkillEffectiveness(skill, 5)).toBe(0.5)
    })

    it('should return 1.0 at required level', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      skill.level = 10

      expect(getSkillEffectiveness(skill, 10)).toBe(1.0)
    })

    it('should return bonus at higher levels', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      skill.level = 10

      const lv15 = getSkillEffectiveness(skill, 15) // +50% = 1.5
      const lv20 = getSkillEffectiveness(skill, 20) // +100% = 2.0 (capped)

      expect(lv15).toBe(1.5)
      expect(lv20).toBe(2.0) // Capped at 2.0
    })

    it('should cap at 2.0', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      skill.level = 1

      expect(getSkillEffectiveness(skill, 100)).toBe(2.0)
    })
  })

  describe('getSkillCost', () => {
    it('should return base cost', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      expect(getSkillCost(skill)).toBe(skill.cost.amount)
    })

    it('should apply cost modifier', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      const baseCost = skill.cost.amount

      const normal = getSkillCost(skill, 1.0) // Normal cost
      const reduced = getSkillCost(skill, 0.5) // 50% cost
      const increased = getSkillCost(skill, 1.5) // 150% cost

      expect(normal).toBe(baseCost)
      expect(reduced).toBe(Math.ceil(baseCost * 0.5))
      expect(increased).toBe(Math.ceil(baseCost * 1.5))
    })
  })

  describe('getSkillEffects', () => {
    it('should return effects array', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      const effects = getSkillEffects(skill)
      expect(Array.isArray(effects)).toBe(true)
    })

    it('should return all effects', () => {
      const frostbolt: Skill = {
        ...createSkill('frost', 'Frost', 'spell', 18),
        effects: [
          { id: 'slow', name: 'Slow', type: 'debuff', duration: 3000, potency: 40 },
          { id: 'chill', name: 'Chill', type: 'debuff', duration: 2000, potency: 20 },
        ],
      }

      const effects = getSkillEffects(frostbolt)
      expect(effects.length).toBe(2)
      expect(effects[0].id).toBe('slow')
      expect(effects[1].id).toBe('chill')
    })
  })

  describe('isAreaOfEffect', () => {
    it('should return false for single target', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      expect(isAreaOfEffect(skill)).toBe(false)
    })

    it('should return true if effect has AoE', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      skill.effects = [
        { id: 'damage', name: 'Damage', type: 'damage', duration: 0, potency: 100, aoe: 150 },
      ]
      expect(isAreaOfEffect(skill)).toBe(true)
    })

    it('should ignore 0 AoE radius', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      skill.effects = [
        { id: 'damage', name: 'Damage', type: 'damage', duration: 0, potency: 100, aoe: 0 },
      ]
      expect(isAreaOfEffect(skill)).toBe(false)
    })
  })

  describe('getAoERadius', () => {
    it('should return 0 for single target', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      expect(getAoERadius(skill)).toBe(0)
    })

    it('should return AoE radius', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      skill.effects = [
        { id: 'damage', name: 'Damage', type: 'damage', duration: 0, potency: 100, aoe: 200 },
      ]
      expect(getAoERadius(skill)).toBe(200)
    })

    it('should return first AoE effect radius', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      skill.effects = [
        { id: 'damage', name: 'Damage', type: 'damage', duration: 0, potency: 100 }, // No AoE
        { id: 'aoe', name: 'AoE', type: 'damage', duration: 0, potency: 100, aoe: 150 },
      ]
      expect(getAoERadius(skill)).toBe(150)
    })
  })

  describe('Integration Tests', () => {
    it('should create and cast a full skill', () => {
      const fireball = createSkill('fireball', 'Fireball', 'spell', 20)

      expect(isSkill(fireball)).toBe(true)

      const extracted = extractSkill(fireball)
      expect(extracted).toBeDefined()

      const currentMana = 100
      expect(canCastSkill(fireball, currentMana)).toBe(true)

      const damage = calculateSkillDamage(fireball)
      expect(damage).toBeGreaterThanOrEqual(16)
      expect(damage).toBeLessThanOrEqual(24)
    })

    it('should handle skill cooldown cycle', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      skill.cooldown = 100 // 100ms for testing

      const castTime = Date.now()

      expect(isSkillReady(skill, castTime)).toBe(false) // Just cast, not ready

      // Wait for cooldown
      setTimeout(() => {
        expect(isSkillReady(skill, castTime)).toBe(true) // Ready now
      }, 150)
    })

    it('should support advanced skill configuration', () => {
      const meteor: Skill = {
        id: 'meteor',
        name: 'Meteor',
        type: 'spell',
        damage: { baseValue: 30, variance: 6, type: 'fire' },
        cooldown: 10000,
        range: 300,
        cost: { type: 'mana', amount: 50 },
        effects: [
          {
            id: 'impact',
            name: 'Meteor Impact',
            type: 'damage',
            duration: 0,
            potency: 100,
            aoe: 200,
          },
        ],
        castTime: 1000,
        level: 20,
      }

      expect(isSkill(meteor)).toBe(true)
      expect(isAreaOfEffect(meteor)).toBe(true)
      expect(getAoERadius(meteor)).toBe(200)
      expect(getSkillCastTime(meteor)).toBe(1000)
    })
  })

  describe('Edge Cases', () => {
    it('should handle skills without damage', () => {
      const heal: Skill = {
        id: 'heal',
        name: 'Heal',
        type: 'support',
        cooldown: 2000,
        range: 150,
        cost: { type: 'mana', amount: 25 },
        effects: [],
        castTime: 300,
      }

      expect(isSkill(heal)).toBe(true)
      expect(calculateSkillDamage(heal)).toBe(0)
    })

    it('should handle very high level characters', () => {
      const skill = createSkill('skill', 'Skill', 'spell', 20)
      skill.level = 1

      const effectiveness = getSkillEffectiveness(skill, 1000)
      expect(effectiveness).toBe(2.0) // Capped at 2.0
    })

    it('should support all skill types', () => {
      const types = ['spell', 'melee', 'ranged', 'support', 'utility', 'ultimate'] as const

      types.forEach(type => {
        const skill = createSkill(`skill_${type}`, `Skill ${type}`, type, 20)
        expect(skill.type).toBe(type)
      })
    })
  })
})

