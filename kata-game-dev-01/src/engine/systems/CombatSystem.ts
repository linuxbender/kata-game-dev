/**
 * Combat System
 *
 * Integrates combat calculations with ECS.
 * Manages turn-based combat, damage application, and combat events.
 *
 * @example
 * ```ts
 * const combatSystem = new CombatSystem(world, statsSystem, equipmentSystem)
 *
 * // Start combat
 * combatSystem.startCombat(player, enemy)
 *
 * // Execute attack
 * const result = combatSystem.attack(player, enemy, sword)
 *
 * // Check if entity is alive
 * if (!combatSystem.isAlive(enemy)) {
 *   victory()
 * }
 * ```
 */

import type { Entity, World } from '@engine/ECS'
import type { Weapon } from '@components/Weapon'
import { CombatCalculator, type CombatRound, type DamageResult } from './CombatCalculator'
import type { CharacterStatsSystem } from './CharacterStatsSystem'
import type { EquipmentSystem } from './EquipmentSystem'

/**
 * Combat encounter state.
 */
export enum CombatState {
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

/**
 * Combat encounter information.
 */
export interface CombatEncounter {
  /** Attacker entity */
  attacker: Entity
  /** Defender entity */
  defender: Entity
  /** Combat state */
  state: CombatState
  /** Rounds executed */
  rounds: CombatRound[]
  /** Winner entity or null if ongoing */
  winner: Entity | null
  /** Start time */
  startTime: number
  /** End time */
  endTime?: number
}

/**
 * Combat System
 *
 * Manages turn-based combat with damage application and event tracking.
 */
export class CombatSystem {
  private calculator = new CombatCalculator()
  private encounters = new Map<string, CombatEncounter>()
  private combatLog: string[] = []
  private encounterCounter = 0

  constructor(
    private world: World,
    private statsSystem: CharacterStatsSystem,
    private equipmentSystem: EquipmentSystem
  ) {}

  /**
   * Start a new combat encounter.
   *
   * @param attacker - Attacking entity
   * @param defender - Defending entity
   * @returns Encounter ID
   *
   * @example
   * ```ts
   * const encounterId = combatSystem.startCombat(player, enemy)
   * ```
   */
  startCombat(attacker: Entity, defender: Entity): string {
    this.encounterCounter++
    const encounterId = `${attacker}_vs_${defender}_${this.encounterCounter}`

    const encounter: CombatEncounter = {
      attacker,
      defender,
      state: CombatState.ACTIVE,
      rounds: [],
      winner: null,
      startTime: Date.now(),
    }

    this.encounters.set(encounterId, encounter)
    this.log(`Combat started: ${attacker} vs ${defender}`)

    return encounterId
  }

  /**
   * Execute an attack in combat.
   *
   * @param attacker - Attacking entity
   * @param defender - Defending entity
   * @param weapon - Weapon used
   * @param encounterId - Optional encounter ID
   * @returns Combat round result
   *
   * @example
   * ```ts
   * const result = combatSystem.attack(player, enemy, sword)
   * if (result.wasSuccessful) {
   *   console.log(`Hit for ${result.damageResult?.totalDamage} damage`)
   * }
   * ```
   */
  attack(
    attacker: Entity,
    defender: Entity,
    weapon: Weapon,
    encounterId?: string
  ): CombatRound {
    // Execute combat round
    const round = this.calculator.executeCombatRound(
      attacker,
      defender,
      weapon,
      this.statsSystem,
      this.equipmentSystem
    )

    // Update encounter if provided
    if (encounterId) {
      const encounter = this.encounters.get(encounterId)
      if (encounter) {
        encounter.rounds.push(round)

        // Log attack
        if (round.wasSuccessful) {
          this.log(
            `${attacker} hits ${defender} for ${round.damageResult?.totalDamage} damage`
          )
          if (round.damageResult?.isCritical) {
            this.log(`CRITICAL HIT!`)
          }
        } else {
          this.log(`${attacker} misses ${defender}`)
        }

        // Check for victory
        if (round.defenderHealthAfter <= 0) {
          encounter.state = CombatState.FINISHED
          encounter.winner = attacker
          encounter.endTime = Date.now()
          this.log(`${attacker} wins! ${defender} is defeated.`)
        }
      }
    }

    return round
  }

  /**
   * Check if entity is alive.
   *
   * @param entity - Entity to check
   * @returns true if entity has health > 0
   *
   * @example
   * ```ts
   * if (combatSystem.isAlive(enemy)) {
   *   continueAttacking()
   * }
   * ```
   */
  isAlive(entity: Entity): boolean {
    const stats = this.statsSystem.getCharacterStats(entity)
    return stats ? stats.derived.health > 0 : false
  }

  /**
   * Get entity health.
   *
   * @param entity - Entity to get health for
   * @returns Current health value
   *
   * @example
   * ```ts
   * const health = combatSystem.getHealth(player)
   * ```
   */
  getHealth(entity: Entity): number {
    return this.statsSystem.getDerivedStat(entity, 'health')
  }

  /**
   * Set entity health.
   *
   * @param entity - Entity to set health for
   * @param health - New health value
   *
   * @example
   * ```ts
   * combatSystem.setHealth(player, 100)
   * ```
   */
  setHealth(entity: Entity, health: number): void {
    const stats = this.statsSystem.getCharacterStats(entity)
    if (stats) {
      stats.derived.health = Math.max(0, health)
    }
  }

  /**
   * Heal entity.
   *
   * @param entity - Entity to heal
   * @param amount - Healing amount
   * @returns New health value
   *
   * @example
   * ```ts
   * combatSystem.heal(player, 50)
   * ```
   */
  heal(entity: Entity, amount: number): number {
    const stats = this.statsSystem.getCharacterStats(entity)
    if (!stats) return 0

    const maxHealth = 10 + (stats.base.constitution * 5) + (stats.base.strength * 2)
    const newHealth = Math.min(stats.derived.health + amount, maxHealth)

    stats.derived.health = newHealth
    this.log(`${entity} healed for ${amount} health`)

    return newHealth
  }

  /**
   * Get encounter status.
   *
   * @param encounterId - Encounter ID
   * @returns Encounter information or undefined
   *
   * @example
   * ```ts
   * const encounter = combatSystem.getEncounter(id)
   * if (encounter?.state === CombatState.FINISHED) {
   *   showVictory()
   * }
   * ```
   */
  getEncounter(encounterId: string): CombatEncounter | undefined {
    return this.encounters.get(encounterId)
  }

  /**
   * Get all active encounters.
   *
   * @returns Array of active encounters
   *
   * @example
   * ```ts
   * const active = combatSystem.getActiveEncounters()
   * ```
   */
  getActiveEncounters(): CombatEncounter[] {
    return Array.from(this.encounters.values()).filter(e => e.state === CombatState.ACTIVE)
  }

  /**
   * Calculate damage preview without applying.
   *
   * @param attacker - Attacking entity
   * @param defender - Defending entity
   * @param weapon - Weapon to use
   * @returns Damage calculation result
   *
   * @example
   * ```ts
   * const damage = combatSystem.previewDamage(player, enemy, sword)
   * showDamagePreview(damage.totalDamage)
   * ```
   */
  previewDamage(
    attacker: Entity,
    defender: Entity,
    weapon: Weapon
  ): DamageResult {
    return this.calculator.calculateDamage(
      attacker,
      defender,
      weapon,
      this.statsSystem,
      this.equipmentSystem
    )
  }

  /**
   * Calculate hit probability.
   *
   * @param attacker - Attacking entity
   * @param defender - Defending entity
   * @returns Hit probability (0-1)
   *
   * @example
   * ```ts
   * const hitChance = combatSystem.getHitChance(player, enemy)
   * console.log(`${hitChance * 100}% chance to hit`)
   * ```
   */
  getHitChance(attacker: Entity, defender: Entity): number {
    return this.calculator.rollHit(attacker, defender, this.statsSystem).finalChance
  }

  /**
   * Get critical hit chance.
   *
   * @param attacker - Attacking entity
   * @returns Critical chance (0-1)
   *
   * @example
   * ```ts
   * const critChance = combatSystem.getCriticalChance(player)
   * ```
   */
  getCriticalChance(attacker: Entity): number {
    return this.calculator.rollCritical(attacker, this.statsSystem).baseChance
  }

  /**
   * Simulate full combat.
   *
   * @param attacker - Attacking entity
   * @param defender - Defending entity
   * @param weapon - Weapon to use
   * @param maxRounds - Max rounds to simulate
   * @returns Array of combat rounds
   *
   * @example
   * ```ts
   * const battle = combatSystem.simulateBattle(player, enemy, sword)
   * console.log(`Battle lasted ${battle.length} rounds`)
   * ```
   */
  simulateBattle(
    attacker: Entity,
    defender: Entity,
    weapon: Weapon,
    maxRounds: number = 100
  ): CombatRound[] {
    return this.calculator.simulateCombat(
      attacker,
      defender,
      weapon,
      this.statsSystem,
      this.equipmentSystem,
      maxRounds
    )
  }

  /**
   * Get combat log.
   *
   * @returns Array of log entries
   *
   * @example
   * ```ts
   * const log = combatSystem.getCombatLog()
   * log.forEach(entry => console.log(entry))
   * ```
   */
  getCombatLog(): string[] {
    return [...this.combatLog]
  }

  /**
   * Clear combat log.
   *
   * @example
   * ```ts
   * combatSystem.clearCombatLog()
   * ```
   */
  clearCombatLog(): void {
    this.combatLog = []
  }

  /**
   * Log combat event.
   *
   * @param message - Message to log
   *
   * @example
   * ```ts
   * combatSystem.log('Player defeated enemy!')
   * ```
   */
  log(message: string): void {
    const timestamp = new Date().toLocaleTimeString()
    this.combatLog.push(`[${timestamp}] ${message}`)
  }

  /**
   * End combat encounter.
   *
   * @param encounterId - Encounter ID
   *
   * @example
   * ```ts
   * combatSystem.endCombat(encounterId)
   * ```
   */
  endCombat(encounterId: string): void {
    const encounter = this.encounters.get(encounterId)
    if (encounter) {
      encounter.state = CombatState.FINISHED
      encounter.endTime = Date.now()

      const duration = encounter.endTime - encounter.startTime
      this.log(`Combat ended. Duration: ${duration}ms`)
    }
  }

  /**
   * Get combat statistics.
   *
   * @param encounterId - Encounter ID
   * @returns Combat statistics
   *
   * @example
   * ```ts
   * const stats = combatSystem.getStatistics(id)
   * console.log(`${stats.totalDamage} damage dealt`)
   * ```
   */
  getStatistics(encounterId: string) {
    const encounter = this.encounters.get(encounterId)
    if (!encounter) return null

    let totalDamage = 0
    let totalHealing = 0
    let criticalCount = 0
    let hitCount = 0
    let missCount = 0

    for (const round of encounter.rounds) {
      if (round.wasSuccessful) {
        hitCount++
        if (round.damageResult) {
          totalDamage += round.damageResult.totalDamage
          if (round.damageResult.isCritical) {
            criticalCount++
          }
        }
      } else {
        missCount++
      }
    }

    return {
      roundCount: encounter.rounds.length,
      hitCount,
      missCount,
      criticalCount,
      totalDamage,
      totalHealing,
      duration: (encounter.endTime || Date.now()) - encounter.startTime,
      winner: encounter.winner,
    }
  }

  /**
   * Clear all encounters.
   *
   * Useful for cleanup between scenes.
   *
   * @example
   * ```ts
   * combatSystem.clear()
   * ```
   */
  clear(): void {
    this.encounters.clear()
    this.combatLog = []
  }
}

