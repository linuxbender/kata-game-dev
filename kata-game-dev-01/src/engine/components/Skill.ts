/**
 * Skill Component
 *
 * Defines skills/abilities that can be used by characters.
 * Skills can have cooldowns, costs, effects, and damage.
 *
 * @example
 * ```ts
 * const fireball: Skill = {
 *   id: 'skill_fireball',
 *   name: 'Fireball',
 *   type: 'spell',
 *   damage: { baseValue: 20, variance: 5, type: 'fire' },
 *   cooldown: 3000,
 *   range: 200,
 *   cost: { type: 'mana', amount: 30 },
 *   effects: [{
 *     id: 'fire_dmg',
 *     name: 'Fire Damage',
 *     type: 'damage',
 *     duration: 5000,
 *     potency: 50
 *   }],
 *   castTime: 500,
 *   description: 'Launch a fireball at enemies'
 * }
 * ```
 */

/**
 * Skill cost definition.
 * Specifies resource cost to cast a skill.
 */
export interface SkillCost {
  /** Cost type (mana, stamina, health, etc.) */
  type: 'mana' | 'stamina' | 'health' | 'none'
  /** Amount of resource consumed */
  amount: number
}

/**
 * Skill damage configuration.
 * Defines damage properties for the skill.
 */
export interface SkillDamage {
  /** Base damage value */
  baseValue: number
  /** Damage variance */
  variance: number
  /** Damage type (physical, fire, cold, etc.) */
  type: 'physical' | 'fire' | 'cold' | 'lightning' | 'magic'
  /** Scaling factor (0-1, e.g., 0.5 = 50% of stat) */
  scaling?: number
}

/**
 * Skill effect definition.
 * Applies special effects when skill is cast.
 */
export interface SkillEffect {
  /** Effect ID */
  id: string
  /** Effect name */
  name: string
  /** Effect type */
  type: 'damage' | 'healing' | 'buff' | 'debuff' | 'crowd_control' | 'utility'
  /** Duration in milliseconds */
  duration: number
  /** Effect potency (0-100) */
  potency: number
  /** Area of effect radius (0 = single target) */
  aoe?: number
}

/**
 * Skill component.
 *
 * Complete skill definition with damage, effects, and mechanics.
 *
 * @example
 * ```ts
 * const skill: Skill = {
 *   id: 'skill_fireball',
 *   name: 'Fireball',
 *   type: 'spell',
 *   damage: { baseValue: 20, variance: 5, type: 'fire' },
 *   cooldown: 3000,
 *   range: 200,
 *   cost: { type: 'mana', amount: 30 },
 *   effects: [],
 *   castTime: 500
 * }
 * ```
 */
export interface Skill {
  /** Unique skill ID */
  id: string
  /** Display name */
  name: string
  /** Skill type (spell, melee, ranged, support, etc.) */
  type: 'spell' | 'melee' | 'ranged' | 'support' | 'utility' | 'ultimate'
  /** Damage configuration */
  damage?: SkillDamage
  /** Cooldown in milliseconds */
  cooldown: number
  /** Skill range in pixels */
  range: number
  /** Resource cost */
  cost: SkillCost
  /** Special effects */
  effects: SkillEffect[]
  /** Cast time in milliseconds */
  castTime: number
  /** Required level */
  level?: number
  /** Skill description */
  description?: string
  /** Can this skill be interrupted? */
  canInterrupt?: boolean
  /** Mana/stamina regeneration % this skill provides */
  regenBonus?: number
}

/**
 * Type guard: Check if component is Skill.
 *
 * @example
 * ```ts
 * if (isSkill(comp)) {
 *   castSkill(comp)
 * }
 * ```
 */
export function isSkill(component: unknown): component is Skill {
  if (typeof component !== 'object' || component === null) return false
  const obj = component as any
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.cooldown === 'number' &&
    typeof obj.range === 'number' &&
    typeof obj.castTime === 'number' &&
    typeof obj.cost === 'object' &&
    Array.isArray(obj.effects)
  )
}

/**
 * Extract Skill component if valid.
 *
 * @example
 * ```ts
 * const skill = extractSkill(comp)
 * if (skill) {
 *   executeSkill(skill)
 * }
 * ```
 */
export function extractSkill(component: unknown): Skill | undefined {
  return isSkill(component) ? component : undefined
}

/**
 * Create a basic skill with sensible defaults.
 *
 * @param id - Unique skill ID
 * @param name - Display name
 * @param type - Skill type
 * @param baseValue - Base damage
 * @returns New skill
 *
 * @example
 * ```ts
 * const fireball = createSkill('fireball', 'Fireball', 'spell', 20)
 * const slash = createSkill('slash', 'Slash', 'melee', 15)
 * ```
 */
export function createSkill(
  id: string,
  name: string,
  type: Skill['type'],
  baseValue: number
): Skill {
  return {
    id,
    name,
    type,
    damage: {
      baseValue,
      variance: Math.ceil(baseValue * 0.2),
      type: type === 'spell' ? 'magic' : 'physical',
      scaling: 0.5,
    },
    cooldown: 1000, // 1 second
    range: type === 'melee' ? 30 : type === 'spell' ? 200 : 150,
    cost: {
      type: type === 'spell' ? 'mana' : 'stamina',
      amount: Math.ceil(baseValue * 1.5),
    },
    effects: [],
    castTime: type === 'spell' ? 500 : 100,
    level: 1,
    canInterrupt: true,
  }
}

/**
 * Create a skill with full customization.
 *
 * @example
 * ```ts
 * const frostbolt = createSkillAdvanced({
 *   id: 'skill_frostbolt',
 *   name: 'Frostbolt',
 *   type: 'spell',
 *   damage: { baseValue: 18, variance: 4, type: 'cold', scaling: 0.6 },
 *   cooldown: 2000,
 *   range: 180,
 *   cost: { type: 'mana', amount: 25 },
 *   effects: [{
 *     id: 'slow',
 *     name: 'Slow',
 *     type: 'debuff',
 *     duration: 3000,
 *     potency: 40
 *   }],
 *   castTime: 600
 * })
 * ```
 */
export function createSkillAdvanced(config: Skill): Skill {
  return config
}

/**
 * Calculate actual damage dealt by a skill.
 *
 * Takes into account base damage and variance.
 *
 * @param skill - The skill
 * @param statsModifier - Optional stat modifier (0-2, where 1.0 = no change)
 * @returns Actual damage value
 *
 * @example
 * ```ts
 * const damage = calculateSkillDamage(fireball)
 * const boostedDamage = calculateSkillDamage(fireball, 1.5) // 50% more damage
 * ```
 */
export function calculateSkillDamage(skill: Skill, statsModifier: number = 1.0): number {
  if (!skill.damage) return 0
  const { baseValue, variance } = skill.damage
  const variance_amount = Math.floor(Math.random() * (variance * 2 + 1)) - variance
  const baseDamage = baseValue * statsModifier
  return Math.max(1, baseDamage + variance_amount)
}

/**
 * Check if skill can be cast (meets all requirements).
 *
 * @param skill - The skill
 * @param currentCost - Current resource value
 * @returns true if skill can be cast
 *
 * @example
 * ```ts
 * const currentMana = 100
 * if (canCastSkill(fireball, currentMana)) {
 *   castSkill(fireball)
 * } else {
 *   showMessage('Not enough mana!')
 * }
 * ```
 */
export function canCastSkill(skill: Skill, currentCost: number): boolean {
  return currentCost >= skill.cost.amount
}

/**
 * Get remaining cooldown in milliseconds.
 *
 * @param skill - The skill
 * @param lastCastTime - Last cast timestamp
 * @returns Milliseconds until skill is ready (0 if ready)
 *
 * @example
 * ```ts
 * const remaining = getSkillCooldown(fireball, lastCastTime)
 * if (remaining > 0) {
 *   showCooldownBar(remaining)
 * }
 * ```
 */
export function getSkillCooldown(skill: Skill, lastCastTime: number): number {
  const elapsed = Date.now() - lastCastTime
  return Math.max(0, skill.cooldown - elapsed)
}

/**
 * Check if skill is ready to cast (cooldown elapsed).
 *
 * @param skill - The skill
 * @param lastCastTime - Last cast timestamp
 * @returns true if skill is ready
 *
 * @example
 * ```ts
 * if (isSkillReady(fireball, lastFireballCast)) {
 *   canCast()
 * }
 * ```
 */
export function isSkillReady(skill: Skill, lastCastTime: number): boolean {
  return Date.now() - lastCastTime >= skill.cooldown
}

/**
 * Calculate total cast time including animation.
 *
 * @param skill - The skill
 * @param speedModifier - Cast speed modifier (0-2, where 1.0 = normal)
 * @returns Cast time in milliseconds
 *
 * @example
 * ```ts
 * const castTime = getSkillCastTime(fireball) // 500ms
 * const hasteTime = getSkillCastTime(fireball, 0.5) // 250ms (50% faster)
 * ```
 */
export function getSkillCastTime(skill: Skill, speedModifier: number = 1.0): number {
  return Math.round(skill.castTime / speedModifier)
}

/**
 * Get skill effectiveness based on level/tier.
 *
 * @param skill - The skill
 * @param characterLevel - Character's current level
 * @returns Effectiveness multiplier (0-2)
 *
 * @example
 * ```ts
 * const multiplier = getSkillEffectiveness(skill, 10)
 * const boostedDamage = baseDamage * multiplier
 * ```
 */
export function getSkillEffectiveness(skill: Skill, characterLevel: number): number {
  const requiredLevel = skill.level || 1
  if (characterLevel < requiredLevel) return 0.5 // Reduced effectiveness if under-leveled
  if (characterLevel === requiredLevel) return 1.0 // Normal effectiveness
  // Bonus for higher level: +10% per level above requirement (max 2.0)
  const bonus = (characterLevel - requiredLevel) * 0.1
  return Math.min(2.0, 1.0 + bonus)
}

/**
 * Calculate total resource cost including modifiers.
 *
 * @param skill - The skill
 * @param costModifier - Cost modifier (0-2, where 1.0 = normal)
 * @returns Actual cost
 *
 * @example
 * ```ts
 * const normalCost = getSkillCost(fireball) // 30 mana
 * const reducedCost = getSkillCost(fireball, 0.5) // 15 mana
 * ```
 */
export function getSkillCost(skill: Skill, costModifier: number = 1.0): number {
  return Math.ceil(skill.cost.amount * costModifier)
}

/**
 * Get all effects from a skill.
 *
 * @param skill - The skill
 * @returns Array of effects
 *
 * @example
 * ```ts
 * const effects = getSkillEffects(fireball)
 * effects.forEach(effect => applyEffect(entity, effect))
 * ```
 */
export function getSkillEffects(skill: Skill): SkillEffect[] {
  return skill.effects
}

/**
 * Check if skill has area of effect damage.
 *
 * @param skill - The skill
 * @returns true if skill hits multiple targets
 *
 * @example
 * ```ts
 * if (isAreaOfEffect(skill)) {
 *   damageAllTargetsInRadius(skill.effects[0].aoe)
 * }
 * ```
 */
export function isAreaOfEffect(skill: Skill): boolean {
  return skill.effects.some(effect => effect.aoe && effect.aoe > 0)
}

/**
 * Get area of effect radius.
 *
 * @param skill - The skill
 * @returns AoE radius in pixels (0 if single target)
 *
 * @example
 * ```ts
 * const radius = getAoERadius(meteora)
 * damageAllInRadius(casterPos, radius)
 * ```
 */
export function getAoERadius(skill: Skill): number {
  const aoeEffect = skill.effects.find(e => e.aoe && e.aoe > 0)
  return aoeEffect?.aoe || 0
}

