/**
 * Skill System
 *
 * Manages skill mechanics including:
 * - Skill execution and casting
 * - Resource consumption
 * - Cooldown management
 * - Cast time and interruption
 * - Effect application
 *
 * @example
 * ```ts
 * const skillSystem = new SkillSystem(world)
 *
 * // Cast a skill
 * const result = skillSystem.castSkill(caster, fireball)
 *
 * // Check if skill is available
 * if (skillSystem.canCastSkill(caster, fireball)) {
 *   executeSkill()
 * }
 * ```
 */

import type { World } from '@engine/ECS'
import type { Entity } from '@engine/ECS'
import {
  isSkill,
  calculateSkillDamage,
  isSkillReady,
  getSkillCost,
  type Skill,
  type SkillEffect,
} from '@components/Skill'

/**
 * Resource pool for a character.
 * Tracks mana, stamina, or other resources.
 */
export interface ResourcePool {
  mana: { current: number; max: number }
  stamina: { current: number; max: number }
  health: { current: number; max: number }
}

/**
 * Skill cast result containing all relevant data.
 */
export interface SkillCastResult {
  /** Caster entity */
  caster: Entity
  /** Skill that was cast */
  skill: Skill
  /** Whether cast was successful */
  success: boolean
  /** Reason for failure (if unsuccessful) */
  failureReason?: 'cooldown' | 'resources' | 'invalid_skill' | 'interrupted'
  /** Damage dealt */
  damage?: number
  /** Resource consumed */
  resourceConsumed?: number
  /** Timestamp of cast */
  timestamp: number
  /** Cast time duration */
  castTime: number
}

/**
 * Skill casting state for an entity.
 */
interface CastingState {
  skill: Skill
  startTime: number
  castTime: number
  canInterrupt: boolean
}

/**
 * Skill System
 *
 * Handles all skill-related mechanics in the game.
 */
export class SkillSystem {
  private world: World
  private lastSkillCastTime = new Map<Entity, Map<string, number>>()
  private castingStates = new Map<Entity, CastingState>()
  private resourcePools = new Map<Entity, ResourcePool>()

  /**
   * Create a new Skill System.
   *
   * @param world - Game world instance
   */
  constructor(world: World) {
    this.world = world
  }

  /**
   * Cast a skill from one entity.
   *
   * Checks:
   * - Skill validity
   * - Cooldown status
   * - Resource availability
   * - Cast time handling
   *
   * @param caster - Casting entity
   * @param skill - Skill to cast
   * @param resources - Current resources (defaults to full)
   * @returns Cast result
   *
   * @example
   * ```ts
   * const result = skillSystem.castSkill(player, fireball, playerResources)
   * if (result.success) {
   *   console.log(`Cast ${skill.name} for ${result.damage} damage!`)
   * }
   * ```
   */
  castSkill(
    caster: Entity,
    skill: Skill,
    resources?: ResourcePool
  ): SkillCastResult {
    const timestamp = Date.now()

    // Validate skill
    if (!isSkill(skill)) {
      return {
        caster,
        skill,
        success: false,
        failureReason: 'invalid_skill',
        timestamp,
        castTime: 0,
      }
    }

    // Check cooldown
    const lastCastTime = this.getLastCastTime(caster, skill.id)
    const canCast = isSkillReady(skill, lastCastTime)

    if (!canCast) {
      return {
        caster,
        skill,
        success: false,
        failureReason: 'cooldown',
        timestamp,
        castTime: 0,
      }
    }

    // Check resources
    const resourceNeeded = getSkillCost(skill)
    const hasResources = this.canAffordSkill(caster, skill, resources)

    if (!hasResources) {
      return {
        caster,
        skill,
        success: false,
        failureReason: 'resources',
        timestamp,
        castTime: 0,
      }
    }

    // Consume resources
    if (resources) {
      this.consumeResources(caster, skill, resources)
    }

    // Calculate damage
    let damage = 0
    if (skill.damage) {
      damage = calculateSkillDamage(skill)
    }

    // Record cast time
    this.recordCastTime(caster, skill.id, timestamp)

    // Start casting
    const castTime = skill.castTime
    this.castingStates.set(caster, {
      skill,
      startTime: timestamp,
      castTime,
      canInterrupt: skill.canInterrupt !== false,
    })

    return {
      caster,
      skill,
      success: true,
      damage,
      resourceConsumed: resourceNeeded,
      timestamp,
      castTime,
    }
  }

  /**
   * Check if skill can be cast by entity.
   *
   * Checks cooldown and resources.
   *
   * @param caster - Casting entity
   * @param skill - Skill to check
   * @param resources - Current resources
   * @returns true if skill can be cast
   *
   * @example
   * ```ts
   * if (skillSystem.canCastSkill(player, fireball, playerResources)) {
   *   castSkill()
   * }
   * ```
   */
  canCastSkill(caster: Entity, skill: Skill, resources?: ResourcePool): boolean {
    if (!isSkill(skill)) return false

    const lastCastTime = this.getLastCastTime(caster, skill.id)
    const cooldownReady = isSkillReady(skill, lastCastTime)

    if (!cooldownReady) return false

    return this.canAffordSkill(caster, skill, resources)
  }

  /**
   * Check if entity has resources to cast skill.
   *
   * @param caster - Casting entity
   * @param skill - Skill to check
   * @param resources - Current resources
   * @returns true if entity has enough resources
   */
  canAffordSkill(
    caster: Entity,
    skill: Skill,
    resources?: ResourcePool
  ): boolean {
    if (!resources) return true

    const cost = getSkillCost(skill)
    const resourceType = skill.cost.type

    if (resourceType === 'none') return true

    if (resourceType === 'mana') return resources.mana.current >= cost
    if (resourceType === 'stamina') return resources.stamina.current >= cost
    if (resourceType === 'health') return resources.health.current > cost // Must have health left

    return false
  }

  /**
   * Consume resources from caster.
   *
   * @param caster - Entity consuming resources
   * @param skill - Skill being cast
   * @param resources - Resource pool to consume from
   */
  private consumeResources(caster: Entity, skill: Skill, resources: ResourcePool): void {
    const cost = getSkillCost(skill)
    const type = skill.cost.type

    if (type === 'mana') {
      resources.mana.current = Math.max(0, resources.mana.current - cost)
    } else if (type === 'stamina') {
      resources.stamina.current = Math.max(0, resources.stamina.current - cost)
    } else if (type === 'health') {
      resources.health.current = Math.max(1, resources.health.current - cost)
    }

    this.resourcePools.set(caster, resources)
  }

  /**
   * Get last cast time for a skill.
   *
   * @param caster - Casting entity
   * @param skillId - Skill ID
   * @returns Last cast timestamp (0 if never cast)
   */
  private getLastCastTime(caster: Entity, skillId: string): number {
    return this.lastSkillCastTime.get(caster)?.get(skillId) || 0
  }

  /**
   * Record cast time for skill.
   *
   * @param caster - Casting entity
   * @param skillId - Skill ID
   * @param time - Cast timestamp
   */
  private recordCastTime(caster: Entity, skillId: string, time: number): void {
    if (!this.lastSkillCastTime.has(caster)) {
      this.lastSkillCastTime.set(caster, new Map())
    }
    this.lastSkillCastTime.get(caster)!.set(skillId, time)
  }

  /**
   * Interrupt current casting.
   *
   * @param caster - Entity to interrupt
   * @returns true if successfully interrupted
   *
   * @example
   * ```ts
   * if (skillSystem.interruptCast(enemy)) {
   *   showEffect('interrupted')
   * }
   * ```
   */
  interruptCast(caster: Entity): boolean {
    const state = this.castingStates.get(caster)
    if (!state || !state.canInterrupt) return false

    this.castingStates.delete(caster)
    return true
  }

  /**
   * Check if entity is currently casting.
   *
   * @param caster - Entity to check
   * @returns true if currently casting
   *
   * @example
   * ```ts
   * if (skillSystem.isCasting(player)) {
   *   showCastBar()
   * }
   * ```
   */
  isCasting(caster: Entity): boolean {
    return this.castingStates.has(caster)
  }

  /**
   * Get casting progress (0-1).
   *
   * @param caster - Entity to check
   * @returns Progress 0-1, or -1 if not casting
   *
   * @example
   * ```ts
   * const progress = skillSystem.getCastProgress(player)
   * updateCastBar(progress * 100)
   * ```
   */
  getCastProgress(caster: Entity): number {
    const state = this.castingStates.get(caster)
    if (!state) return -1

    const elapsed = Date.now() - state.startTime
    return Math.min(1, elapsed / state.castTime)
  }

  /**
   * Get remaining cast time.
   *
   * @param caster - Entity to check
   * @returns Milliseconds remaining (0 if not casting)
   *
   * @example
   * ```ts
   * const remaining = skillSystem.getRemainingCastTime(player)
   * ```
   */
  getRemainingCastTime(caster: Entity): number {
    const state = this.castingStates.get(caster)
    if (!state) return 0

    const elapsed = Date.now() - state.startTime
    return Math.max(0, state.castTime - elapsed)
  }

  /**
   * Check if cast is complete.
   *
   * @param caster - Entity to check
   * @returns true if cast time has elapsed
   *
   * @example
   * ```ts
   * if (skillSystem.isCastComplete(player)) {
   *   applyEffects()
   *   this.castingStates.delete(caster)
   * }
   * ```
   */
  isCastComplete(caster: Entity): boolean {
    return this.getRemainingCastTime(caster) === 0 && this.isCasting(caster)
  }

  /**
   * Get cooldown remaining for a skill.
   *
   * @param caster - Entity
   * @param skill - Skill to check
   * @returns Milliseconds remaining (0 if ready)
   *
   * @example
   * ```ts
   * const cooldown = skillSystem.getSkillCooldown(player, fireball)
   * showCooldownBar(cooldown)
   * ```
   */
  getSkillCooldown(caster: Entity, skill: Skill): number {
    const lastCastTime = this.getLastCastTime(caster, skill.id)
    const elapsed = Date.now() - lastCastTime
    return Math.max(0, skill.cooldown - elapsed)
  }

  /**
   * Reset skill cooldown (for special abilities).
   *
   * @param caster - Entity
   * @param skillId - Skill ID
   *
   * @example
   * ```ts
   * // Activate haste ability
   * skillSystem.resetSkillCooldown(player, 'fireball')
   * ```
   */
  resetSkillCooldown(caster: Entity, skillId: string): void {
    this.recordCastTime(caster, skillId, 0)
  }

  /**
   * Reset all skill cooldowns for entity.
   *
   * @param caster - Entity
   *
   * @example
   * ```ts
   * // Level up - reset all cooldowns
   * skillSystem.resetAllCooldowns(player)
   * ```
   */
  resetAllCooldowns(caster: Entity): void {
    this.lastSkillCastTime.delete(caster)
  }

  /**
   * Clear all casting states (for scene transitions).
   */
  clearAllCastingStates(): void {
    this.castingStates.clear()
  }

  /**
   * Get all active skills for an entity (skills on cooldown).
   *
   * @param caster - Entity
   * @param skills - All available skills
   * @returns Skills that are on cooldown
   *
   * @example
   * ```ts
   * const onCooldown = skillSystem.getSkillsOnCooldown(player, allSkills)
   * updateCooldownUI(onCooldown)
   * ```
   */
  getSkillsOnCooldown(caster: Entity, skills: Skill[]): Skill[] {
    return skills.filter(skill => !this.canCastSkill(caster, skill))
  }

  /**
   * Get skill statistics for UI display.
   *
   * @param caster - Entity
   * @param skill - Skill to check
   * @returns Statistics object
   *
   * @example
   * ```ts
   * const stats = skillSystem.getSkillStats(player, fireball)
   * console.log(`Ready: ${stats.isReady ? 'Yes' : 'No'}`)
   * console.log(`Cooldown: ${stats.cooldownPercent}%`)
   * ```
   */
  getSkillStats(caster: Entity, skill: Skill) {
    const cooldown = this.getSkillCooldown(caster, skill)
    const cooldownPercent = Math.round((cooldown / skill.cooldown) * 100)
    const castProgress = this.getCastProgress(caster)

    return {
      isReady: cooldown === 0,
      cooldown,
      cooldownPercent,
      isCasting: this.isCasting(caster),
      castProgress: castProgress >= 0 ? castProgress : 0,
      remainingCastTime: this.getRemainingCastTime(caster),
    }
  }
}

