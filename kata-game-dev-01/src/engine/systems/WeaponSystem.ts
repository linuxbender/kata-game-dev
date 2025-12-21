/**
 * Weapon System
 *
 * Manages weapon mechanics including:
 * - Attack execution and damage calculation
 * - Durability management
 * - Combat interactions
 * - Weapon effects application
 *
 * @example
 * ```ts
 * const weaponSystem = new WeaponSystem(world)
 *
 * // Entity performs attack
 * weaponSystem.executeAttack(playerEntity, targetEntity, weapon)
 *
 * // Check durability
 * if (weaponSystem.isWeaponBroken(weapon)) {
 *   showMessage('Your weapon broke!')
 * }
 * ```
 */

import type { World } from '@engine/ECS'
import type { Entity } from '@engine/ECS'
import type { Transform } from '@components/Transform'
import type { Health } from '@components/Health'
import {
  calculateWeaponDamage,
  damageDurability,
  canUseWeapon,
  type Weapon,
} from '@components/Weapon'
import { COMPONENTS } from '@engine/constants'

/**
 * Attack result containing damage and metadata.
 */
export interface AttackResult {
  /** Attacker entity */
  attacker: Entity
  /** Target entity */
  target: Entity
  /** Damage dealt */
  damage: number
  /** Whether attack hit */
  hit: boolean
  /** Distance between attacker and target */
  distance: number
  /** Weapon used */
  weapon?: Weapon
  /** Timestamp of attack */
  timestamp: number
}

/**
 * Weapon System
 *
 * Handles all weapon-related mechanics in combat.
 */
export class WeaponSystem {
  private world: World
  private lastAttackTime = new Map<Entity, number>()

  /**
   * Create a new Weapon System.
   *
   * @param world - Game world instance
   */
  constructor(world: World) {
    this.world = world
  }

  /**
   * Execute an attack from one entity to another.
   *
   * Checks:
   * - Attack cooldown
   * - Weapon validity
   * - Distance to target
   * - Hit/miss
   * - Applies damage and effects
   *
   * @param attacker - Attacking entity
   * @param target - Target entity
   * @param weapon - Weapon being used
   * @returns Attack result
   *
   * @example
   * ```ts
   * const result = weaponSystem.executeAttack(player, enemy, playerWeapon)
   * if (result.hit) {
   *   console.log(`Hit for ${result.damage} damage!`)
   * } else {
   *   console.log('Attack missed!')
   * }
   * ```
   */
  executeAttack(attacker: Entity, target: Entity, weapon: Weapon): AttackResult {
    const timestamp = Date.now()

    // Check cooldown
    const lastAttack = this.lastAttackTime.get(attacker) || 0
    const weaponCooldown = this.getWeaponCooldown(weapon)
    const canAttack = timestamp - lastAttack >= weaponCooldown

    // Check weapon validity
    const weaponValid = canUseWeapon(weapon)

    // Calculate distance
    const attackerTransform = this.world.getComponent(attacker, COMPONENTS.TRANSFORM) as Transform | undefined
    const targetTransform = this.world.getComponent(target, COMPONENTS.TRANSFORM) as Transform | undefined
    const distance = this.calculateDistance(attackerTransform, targetTransform)

    // Check if in range
    const inRange = distance <= weapon.range

    // Determine hit
    const hit = canAttack && weaponValid && inRange && Math.random() > 0.1 // 90% hit chance

    // Calculate damage
    let damage = 0
    if (hit) {
      damage = calculateWeaponDamage(weapon)
      // Apply damage to target
      this.applyDamage(target, damage)
      // Reduce weapon durability
      damageDurability(weapon)
    }
    // Record attack time (immer, egal ob Hit oder Miss)
    this.lastAttackTime.set(attacker, timestamp)

    return {
      attacker,
      target,
      damage,
      hit,
      distance,
      weapon,
      timestamp,
    }
  }

  /**
   * Apply damage to an entity.
   *
   * Reduces entity health by the damage amount.
   *
   * @param entity - Target entity
   * @param damage - Damage amount
   * @returns New health amount (or undefined if no health)
   *
   * @example
   * ```ts
   * const newHealth = weaponSystem.applyDamage(enemy, 15)
   * if (newHealth === 0) {
   *   removeEntity(enemy)
   * }
   * ```
   */
  applyDamage(entity: Entity, damage: number): number | undefined {
    const health = this.world.getComponent(entity, COMPONENTS.HEALTH) as Health | undefined
    if (!health) return undefined

    health.current = Math.max(0, health.current - damage)
    return health.current
  }

  /**
   * Get weapon cooldown in milliseconds.
   *
   * @param weapon - The weapon
   * @returns Cooldown in milliseconds
   *
   * @example
   * ```ts
   * const cooldown = weaponSystem.getWeaponCooldown(sword)
   * console.log(`Must wait ${cooldown}ms before next attack`)
   * ```
   */
  getWeaponCooldown(weapon: Weapon): number {
    const BASE_COOLDOWN = 600 // milliseconds
    return BASE_COOLDOWN / weapon.attackSpeed
  }

  /**
   * Check if weapon is broken (no durability).
   *
   * @param weapon - The weapon
   * @returns true if weapon is broken
   *
   * @example
   * ```ts
   * if (weaponSystem.isWeaponBroken(sword)) {
   *   showMessage('Your weapon is broken! Repair it at the blacksmith.')
   * }
   * ```
   */
  isWeaponBroken(weapon: Weapon): boolean {
    return weapon.durability.current === 0
  }

  /**
   * Get weapon durability percentage.
   *
   * @param weapon - The weapon
   * @returns Durability percentage (0-100)
   *
   * @example
   * ```ts
   * const durability = weaponSystem.getWeaponDurabilityPercent(sword)
   * showDurabilityBar(durability)
   * ```
   */
  getWeaponDurabilityPercent(weapon: Weapon): number {
    return (weapon.durability.current / weapon.durability.max) * 100
  }

  /**
   * Check if attack is ready (cooldown elapsed).
   *
   * @param entity - Attacking entity
   * @param weapon - Weapon being used
   * @returns true if attack is ready
   *
   * @example
   * ```ts
   * if (weaponSystem.isAttackReady(player, weapon)) {
   *   executeAttack()
   * }
   * ```
   */
  isAttackReady(entity: Entity, weapon: Weapon): boolean {
    const lastAttack = this.lastAttackTime.get(entity) || 0
    const cooldown = this.getWeaponCooldown(weapon)
    return Date.now() - lastAttack >= cooldown
  }

  /**
   * Get time until next attack is ready.
   *
   * @param entity - Attacking entity
   * @param weapon - Weapon being used
   * @returns Milliseconds until ready (0 if ready)
   *
   * @example
   * ```ts
   * const waitTime = weaponSystem.getTimeUntilAttackReady(player, weapon)
   * if (waitTime > 0) {
   *   showCooldownBar(waitTime)
   * }
   * ```
   */
  getTimeUntilAttackReady(entity: Entity, weapon: Weapon): number {
    const lastAttack = this.lastAttackTime.get(entity) || 0
    const cooldown = this.getWeaponCooldown(weapon)
    const elapsed = Date.now() - lastAttack
    return Math.max(0, cooldown - elapsed)
  }

  /**
   * Calculate distance between two entities.
   *
   * Uses Euclidean distance formula.
   *
   * @param from - Source position
   * @param to - Target position
   * @returns Distance in pixels
   *
   * @example
   * ```ts
   * const dist = weaponSystem.calculateDistance(player.transform, enemy.transform)
   * console.log(`Enemy is ${dist} pixels away`)
   * ```
   */
  calculateDistance(from?: Transform, to?: Transform): number {
    if (!from || !to) return Infinity
    const dx = to.x - from.x
    const dy = to.y - from.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Check if target is in attack range.
   *
   * @param weapon - Weapon being used
   * @param distance - Distance to target
   * @returns true if in range
   *
   * @example
   * ```ts
   * if (weaponSystem.isTargetInRange(weapon, distance)) {
   *   allowAttack()
   * } else {
   *   showMessage('Target is too far away!')
   * }
   * ```
   */
  isTargetInRange(weapon: Weapon, distance: number): boolean {
    return distance <= weapon.range
  }

  /**
   * Reset attack cooldown for entity.
   *
   * Useful for resets or special abilities.
   *
   * @param entity - The entity
   *
   * @example
   * ```ts
   * // Activate haste ability
   * weaponSystem.resetAttackCooldown(player)
   * ```
   */
  resetAttackCooldown(entity: Entity): void {
    this.lastAttackTime.delete(entity)
  }

  /**
   * Clear all recorded attack times.
   *
   * Useful for cleanup or scene transitions.
   */
  clearAllAttackTimes(): void {
    this.lastAttackTime.clear()
  }

  /**
   * Get statistics about an entity's weapon usage.
   *
   * @param entity - The entity
   * @param weapon - The weapon
   * @returns Usage statistics
   *
   * @example
   * ```ts
   * const stats = weaponSystem.getWeaponStats(player, sword)
   * console.log(`Durability: ${stats.durabilityPercent}%`)
   * console.log(`Attack Ready: ${stats.attackReady ? 'Yes' : 'No'}`)
   * ```
   */
  getWeaponStats(entity: Entity, weapon: Weapon) {
    return {
      canUse: !this.isWeaponBroken(weapon),
      durabilityPercent: this.getWeaponDurabilityPercent(weapon),
      isBroken: this.isWeaponBroken(weapon),
      attackReady: this.isAttackReady(entity, weapon),
      timeUntilReady: this.getTimeUntilAttackReady(entity, weapon),
      cooldown: this.getWeaponCooldown(weapon),
    }
  }
}

