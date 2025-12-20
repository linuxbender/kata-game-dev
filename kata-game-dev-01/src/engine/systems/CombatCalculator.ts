/**
 * Combat Calculator
 *
 * Calculates all combat-related values including damage, hit chance,
 * critical strikes, armor mitigation, and magic resistance.
 *
 * @example
 * ```ts
 * const calculator = new CombatCalculator()
 *
 * // Calculate attack damage
 * const damage = calculator.calculateDamage(
 *   attacker,
 *   defender,
 *   weapon,
 *   statsSystem,
 *   equipmentSystem
 * )
 *
 * // Check if attack hits
 * const hitResult = calculator.rollHit(attacker, defender, statsSystem)
 * ```
 */

import type { Entity } from '@engine/ECS'
import type { Weapon } from '@components/Weapon'
import type { CharacterStatsSystem } from '@engine/systems/CharacterStatsSystem'
import type { EquipmentSystem } from '@engine/systems/EquipmentSystem'
import type { CharacterStats, DerivedStats, BaseStats } from '@components/CharacterStats'

/**
 * Damage calculation result.
 */
export interface DamageResult {
  /** Base weapon damage */
  baseDamage: number
  /** Attacker stat bonus */
  statBonus: number
  /** Critical hit multiplier (1.0 = no crit) */
  criticalMultiplier: number
  /** Armor reduction amount */
  armorReduction: number
  /** Magic resistance reduction (0-1) */
  magicResistanceReduction: number
  /** Total damage dealt */
  totalDamage: number
  /** Is this a critical hit */
  isCritical: boolean
  /** Damage type */
  type: 'physical' | 'magical' | 'mixed'
}

/**
 * Hit probability result.
 */
export interface HitResult {
  /** Base accuracy chance (0-1) */
  baseAccuracy: number
  /** Attacker hit bonus */
  attackerBonus: number
  /** Defender dodge bonus */
  defenderDodge: number
  /** Final hit chance (0-1) */
  finalChance: number
  /** Did the attack hit */
  didHit: boolean
  /** Reason for hit/miss */
  reason: string
}

/**
 * Critical strike result.
 */
export interface CriticalResult {
  /** Base critical chance (0-1) */
  baseChance: number
  /** Critical multiplier (1.0-3.0) */
  multiplier: number
  /** Did critical hit occur */
  didCrit: boolean
}

/**
 * Combat encounter result.
 */
export interface CombatRound {
  /** Attacker entity */
  attacker: Entity
  /** Defender entity */
  defender: Entity
  /** Hit roll result */
  hitResult: HitResult
  /** Damage result (if hit) */
  damageResult?: DamageResult
  /** Defender health before attack */
  defenderHealthBefore: number
  /** Defender health after attack */
  defenderHealthAfter: number
  /** Attack successful */
  wasSuccessful: boolean
}

/**
 * Combat Calculator
 *
 * Handles all combat calculations for turn-based combat.
 */
export class CombatCalculator {
  /**
   * Calculate physical damage from attack.
   *
   * Formula: BaseDamage + (STR × 0.5) - ArmorReduction
   *
   * @param attacker - Attacking character
   * @param defender - Defending character
   * @param weapon - Weapon used
   * @param statsSystem - Character stats system
   * @param equipmentSystem - Equipment system
   * @returns Damage calculation result
   *
   * @example
   * ```ts
   * const damage = calculator.calculateDamage(
   *   player, enemy, sword, statsSystem, equipmentSystem
   * )
   * console.log(`Deal ${damage.totalDamage} damage`)
   * ```
   */
  calculateDamage(
    attacker: Entity,
    defender: Entity,
    weapon: Weapon,
    statsSystem: CharacterStatsSystem,
    equipmentSystem: EquipmentSystem
  ): DamageResult {
    const attackerStats = statsSystem.getCharacterStats(attacker)!
    const defenderStats = statsSystem.getCharacterStats(defender)!

    // Base weapon damage
    const baseDamage = weapon.damage.baseValue

    // Attacker stat bonus (Strength)
    const strength = statsSystem.getStatValue(attacker, 'strength')
    const statBonus = strength * 0.5

    // Critical hit calculation
    const criticalChance = statsSystem.getDerivedStat(attacker, 'criticalChance')
    const isCritical = Math.random() < criticalChance
    const criticalMultiplier = isCritical ? (1.5 + Math.random() * 1.5) : 1.0

    // Armor reduction (Defender)
    const armor = statsSystem.getDerivedStat(defender, 'armor')
    const armorReduction = Math.max(0, armor * 1.5)

    // Magic resistance (only for magical damage)
    const magicResistance = statsSystem.getDerivedStat(defender, 'magicResistance')
    const magicResistanceReduction = magicResistance

    // Calculate total damage
    let totalDamage = baseDamage + statBonus
    totalDamage *= criticalMultiplier
    totalDamage -= armorReduction * (1 - magicResistanceReduction)
    totalDamage = Math.max(1, Math.round(totalDamage)) // Minimum 1 damage

    // Apply level scaling
    const levelEffectiveness = statsSystem.getStatEffectiveness(
      attacker,
      defenderStats.level
    )
    totalDamage = Math.round(totalDamage * levelEffectiveness)

    return {
      baseDamage,
      statBonus: Math.round(statBonus * 10) / 10,
      criticalMultiplier: Math.round(criticalMultiplier * 100) / 100,
      armorReduction: Math.round(armorReduction * 10) / 10,
      magicResistanceReduction: Math.round(magicResistanceReduction * 100) / 100,
      totalDamage,
      isCritical,
      type: 'physical',
    }
  }

  /**
   * Calculate magical damage from spell.
   *
   * Formula: BaseSpellPower × (INT × 0.1) - MagicResistance
   *
   * @param attacker - Casting character
   * @param defender - Target character
   * @param baseSpellPower - Base spell damage
   * @param statsSystem - Character stats system
   * @returns Damage calculation result
   *
   * @example
   * ```ts
   * const damage = calculator.calculateMagicalDamage(
   *   mage, enemy, 50, statsSystem
   * )
   * ```
   */
  calculateMagicalDamage(
    attacker: Entity,
    defender: Entity,
    baseSpellPower: number,
    statsSystem: CharacterStatsSystem
  ): DamageResult {
    const defenderStats = statsSystem.getCharacterStats(defender)!

    // Base spell damage
    const baseDamage = baseSpellPower

    // Attacker stat bonus (Intelligence)
    const intelligence = statsSystem.getStatValue(attacker, 'intelligence')
    const statBonus = intelligence * 0.1 * baseSpellPower

    // Spell power multiplier
    const spellPower = statsSystem.getDerivedStat(attacker, 'spellPower')
    const totalBeforeResistance = (baseDamage + statBonus) * spellPower

    // Critical hit for spells (lower chance)
    const wisdom = statsSystem.getStatValue(attacker, 'wisdom')
    const criticalChance = (wisdom - 10) / 500
    const isCritical = Math.random() < Math.max(0, criticalChance)
    const criticalMultiplier = isCritical ? (1.3 + Math.random() * 1.0) : 1.0

    // Magic resistance reduction
    const magicResistance = statsSystem.getDerivedStat(defender, 'magicResistance')
    const magicResistanceReduction = Math.max(0, 1 - magicResistance)

    // Calculate total damage
    let totalDamage = totalBeforeResistance * magicResistanceReduction * criticalMultiplier
    totalDamage = Math.max(1, Math.round(totalDamage))

    // Apply level scaling
    const levelEffectiveness = statsSystem.getStatEffectiveness(
      attacker,
      defenderStats.level
    )
    totalDamage = Math.round(totalDamage * levelEffectiveness)

    return {
      baseDamage,
      statBonus: Math.round(statBonus * 10) / 10,
      criticalMultiplier: Math.round(criticalMultiplier * 100) / 100,
      armorReduction: 0,
      magicResistanceReduction: Math.round(magicResistance * 100) / 100,
      totalDamage,
      isCritical,
      type: 'magical',
    }
  }

  /**
   * Roll to hit - determine if attack connects.
   *
   * Base accuracy: 0.7 (70%)
   * Modified by DEX difference: (Attacker DEX - Defender DEX) × 0.02
   * Defender dodge reduces by: Defender Dodge chance
   *
   * @param attacker - Attacking character
   * @param defender - Defending character
   * @param statsSystem - Character stats system
   * @returns Hit roll result
   *
   * @example
   * ```ts
   * const hitResult = calculator.rollHit(player, enemy, statsSystem)
   * if (hitResult.didHit) {
   *   dealDamage()
   * }
   * ```
   */
  rollHit(
    attacker: Entity,
    defender: Entity,
    statsSystem: CharacterStatsSystem
  ): HitResult {
    const attackerStats = statsSystem.getCharacterStats(attacker)!
    const defenderStats = statsSystem.getCharacterStats(defender)!

    // Base accuracy
    const baseAccuracy = 0.7

    // Attacker DEX bonus
    const attackerDex = statsSystem.getStatValue(attacker, 'dexterity')
    const defenderDex = statsSystem.getStatValue(defender, 'dexterity')
    const dexDifference = (attackerDex - defenderDex) * 0.02
    const attackerBonus = Math.max(0, dexDifference)

    // Defender dodge
    const dodge = statsSystem.getDerivedStat(defender, 'dodge')
    const defenderDodge = dodge

    // Final hit chance
    let finalChance = baseAccuracy + attackerBonus - defenderDodge
    finalChance = Math.max(0.1, Math.min(0.95, finalChance)) // Clamp 10% - 95%

    // Roll
    const roll = Math.random()
    const didHit = roll < finalChance

    let reason = ''
    if (didHit) {
      reason = `Hit! (${Math.round(finalChance * 100)}% vs ${Math.round(roll * 100)}%)`
    } else {
      reason = `Miss! (${Math.round(finalChance * 100)}% vs ${Math.round(roll * 100)}%)`
    }

    return {
      baseAccuracy,
      attackerBonus: Math.round(attackerBonus * 100) / 100,
      defenderDodge: Math.round(defenderDodge * 100) / 100,
      finalChance: Math.round(finalChance * 100) / 100,
      didHit,
      reason,
    }
  }

  /**
   * Calculate critical strike chance.
   *
   * Base: (DEX + WIS) / 500
   * Capped at 90%
   *
   * @param attacker - Attacking character
   * @param statsSystem - Character stats system
   * @returns Critical strike result
   *
   * @example
   * ```ts
   * const crit = calculator.rollCritical(player, statsSystem)
   * if (crit.didCrit) {
   *   damage *= crit.multiplier
   * }
   * ```
   */
  rollCritical(
    attacker: Entity,
    statsSystem: CharacterStatsSystem
  ): CriticalResult {
    const dexterity = statsSystem.getStatValue(attacker, 'dexterity')
    const wisdom = statsSystem.getStatValue(attacker, 'wisdom')

    const baseChance = Math.min(0.9, (dexterity + wisdom - 20) / 500)
    const multiplier = 1.5 + Math.random() * 1.5 // 1.5x - 3.0x damage

    const roll = Math.random()
    const didCrit = roll < baseChance

    return {
      baseChance: Math.max(0, baseChance),
      multiplier,
      didCrit,
    }
  }

  /**
   * Execute a complete combat round.
   *
   * @param attacker - Attacking entity
   * @param defender - Defending entity
   * @param weapon - Weapon used
   * @param statsSystem - Character stats system
   * @param equipmentSystem - Equipment system
   * @returns Combat round result
   *
   * @example
   * ```ts
   * const round = calculator.executeCombatRound(
   *   player, enemy, sword, statsSystem, equipmentSystem
   * )
   * console.log(`Damage: ${round.damageResult?.totalDamage || 0}`)
   * ```
   */
  executeCombatRound(
    attacker: Entity,
    defender: Entity,
    weapon: Weapon,
    statsSystem: CharacterStatsSystem,
    equipmentSystem: EquipmentSystem
  ): CombatRound {
    const defenderStats = statsSystem.getCharacterStats(defender)!
    const defenderHealthBefore = defenderStats.derived.health

    // Roll to hit
    const hitResult = this.rollHit(attacker, defender, statsSystem)

    let damageResult: DamageResult | undefined
    let defenderHealthAfter = defenderHealthBefore

    if (hitResult.didHit) {
      // Calculate damage
      damageResult = this.calculateDamage(
        attacker,
        defender,
        weapon,
        statsSystem,
        equipmentSystem
      )

      // Apply damage
      defenderHealthAfter = Math.max(0, defenderHealthBefore - damageResult.totalDamage)
      defenderStats.derived.health = defenderHealthAfter
    }

    return {
      attacker,
      defender,
      hitResult,
      damageResult,
      defenderHealthBefore,
      defenderHealthAfter,
      wasSuccessful: hitResult.didHit,
    }
  }

  /**
   * Calculate total damage reduction from armor and resistances.
   *
   * @param defender - Defending character
   * @param statsSystem - Character stats system
   * @param damageType - Type of damage
   * @returns Total reduction percentage (0-1)
   *
   * @example
   * ```ts
   * const reduction = calculator.calculateDamageReduction(
   *   enemy, statsSystem, 'physical'
   * )
   * const actualDamage = baseDamage * (1 - reduction)
   * ```
   */
  calculateDamageReduction(
    defender: Entity,
    statsSystem: CharacterStatsSystem,
    damageType: 'physical' | 'magical' | 'mixed'
  ): number {
    let reduction = 0

    if (damageType === 'physical' || damageType === 'mixed') {
      const armor = statsSystem.getDerivedStat(defender, 'armor')
      reduction += armor / 100 * 0.5 // Max 50% armor reduction
    }

    if (damageType === 'magical' || damageType === 'mixed') {
      const magicResistance = statsSystem.getDerivedStat(defender, 'magicResistance')
      reduction += magicResistance * 0.5 // Max 50% magic resistance
    }

    return Math.min(0.75, reduction) // Max 75% total reduction
  }

  /**
   * Get damage breakdown for display.
   *
   * @param result - Damage calculation result
   * @returns Formatted damage breakdown
   *
   * @example
   * ```ts
   * const breakdown = calculator.getDamageBreakdown(damageResult)
   * console.log(breakdown)
   * // Output: "Base: 20 + STR: 5 × Crit: 2.0 = 50 DMG"
   * ```
   */
  getDamageBreakdown(result: DamageResult): string {
    const parts = [
      `Base: ${result.baseDamage}`,
      `STR: +${result.statBonus}`,
      result.isCritical ? `Crit: ×${result.criticalMultiplier}` : null,
      result.armorReduction > 0 ? `-Armor: ${result.armorReduction}` : null,
      result.magicResistanceReduction > 0
        ? `-MagRes: ${Math.round(result.magicResistanceReduction * 100)}%`
        : null,
    ]
      .filter(Boolean)
      .join(' ')

    return `${parts} = ${result.totalDamage} DMG${result.isCritical ? ' (CRITICAL!)' : ''}`
  }

  /**
   * Simulate multiple combat rounds.
   *
   * @param attacker - Attacking entity
   * @param defender - Defending entity
   * @param weapon - Weapon used
   * @param statsSystem - Character stats system
   * @param equipmentSystem - Equipment system
   * @param maxRounds - Maximum rounds to simulate
   * @returns Array of combat rounds
   *
   * @example
   * ```ts
   * const battle = calculator.simulateCombat(
   *   player, enemy, sword, statsSystem, equipmentSystem, 100
   * )
   * console.log(`Battle lasted ${battle.length} rounds`)
   * ```
   */
  simulateCombat(
    attacker: Entity,
    defender: Entity,
    weapon: Weapon,
    statsSystem: CharacterStatsSystem,
    equipmentSystem: EquipmentSystem,
    maxRounds: number = 100
  ): CombatRound[] {
    const rounds: CombatRound[] = []
    const defenderStats = statsSystem.getCharacterStats(defender)!

    for (let i = 0; i < maxRounds; i++) {
      if (defenderStats.derived.health <= 0) break

      const round = this.executeCombatRound(
        attacker,
        defender,
        weapon,
        statsSystem,
        equipmentSystem
      )

      rounds.push(round)

      if (defenderStats.derived.health <= 0) break
    }

    return rounds
  }
}

