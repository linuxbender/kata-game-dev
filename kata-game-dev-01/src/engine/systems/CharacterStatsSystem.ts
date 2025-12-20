/**
 * Character Stats System
 *
 * Integrates character stats with equipment system.
 * Handles stat calculations with equipment bonuses,
 * stat progression, and character updates.
 *
 * @example
 * ```ts
 * const statsSystem = new CharacterStatsSystem()
 *
 * // Create character
 * const character = statsSystem.createCharacter()
 *
 * // Apply equipment bonuses
 * statsSystem.applyEquipmentBonuses(character, equipmentBonuses)
 *
 * // Add experience
 * statsSystem.addExperience(character, 250)
 * ```
 */

import type { Entity } from '@engine/ECS'
import {
  calculateDerivedStats,
  calculateExperienceForLevel,
  addExperience as addExpToStats,
  createDefaultStats,
  createCharacterStats,
  getStatsSummary,
  calculateStatEffectiveness,
  type CharacterStats,
  type BaseStats,
  type StatModifiers,
  type DerivedStats,
} from '@components/CharacterStats'
import type { ItemBonus } from '@components/Item'

/**
 * Character stats system.
 *
 * Manages character stats with equipment integration.
 */
export class CharacterStatsSystem {
  private characterStats = new Map<Entity, CharacterStats>()

  /**
   * Create a new character with default stats.
   *
   * @param entity - Entity to assign stats to
   * @returns Created character stats
   *
   * @example
   * ```ts
   * const stats = statsSystem.createCharacter(player)
   * ```
   */
  createCharacter(entity: Entity): CharacterStats {
    const stats = createDefaultStats()
    this.characterStats.set(entity, stats)
    return stats
  }

  /**
   * Create character with custom base stats.
   *
   * @param entity - Entity to assign stats to
   * @param base - Base stats
   * @param level - Starting level
   * @returns Created character stats
   *
   * @example
   * ```ts
   * const warrior = statsSystem.createCharacter(entity, {
   *   strength: 16,
   *   dexterity: 10,
   *   constitution: 15,
   *   intelligence: 8,
   *   wisdom: 11,
   *   charisma: 10
   * }, 5)
   * ```
   */
  createCharacterWithStats(entity: Entity, base: BaseStats, level: number = 1): CharacterStats {
    const stats = createCharacterStats(base, level)
    this.characterStats.set(entity, stats)
    return stats
  }

  /**
   * Get character stats.
   *
   * @param entity - Entity to get stats for
   * @returns Character stats or undefined
   *
   * @example
   * ```ts
   * const stats = statsSystem.getCharacterStats(player)
   * ```
   */
  getCharacterStats(entity: Entity): CharacterStats | undefined {
    return this.characterStats.get(entity)
  }

  /**
   * Apply equipment bonuses to character stats.
   *
   * Recalculates derived stats with equipment bonuses.
   *
   * @param entity - Entity to apply bonuses to
   * @param bonuses - Equipment bonuses from items
   *
   * @example
   * ```ts
   * const bonuses = equipment.getAllBonuses()
   * statsSystem.applyEquipmentBonuses(player, bonuses)
   * ```
   */
  applyEquipmentBonuses(entity: Entity, bonuses: ItemBonus[]): void {
    const stats = this.characterStats.get(entity)
    if (!stats) return

    // Convert ItemBonuses to StatModifiers
    const modifiers: StatModifiers = { base: {} }

    bonuses.forEach(bonus => {
      if (modifiers.base) {
        modifiers.base[bonus.stat] = (modifiers.base[bonus.stat] || 0) + bonus.amount
      }
    })

    // Recalculate derived stats with bonuses
    stats.derived = calculateDerivedStats(stats.base, modifiers)
  }

  /**
   * Add experience to character.
   *
   * @param entity - Entity to add experience to
   * @param amount - Experience amount
   * @param bonus - Optional bonus multiplier
   * @returns Number of levels gained
   *
   * @example
   * ```ts
   * const levelsGained = statsSystem.addExperience(player, 250, 1.2)
   * ```
   */
  addExperience(entity: Entity, amount: number, bonus: number = 1.0): number {
    const stats = this.characterStats.get(entity)
    if (!stats) return 0

    return addExpToStats(stats, amount, bonus)
  }

  /**
   * Level up character by specific amount.
   *
   * @param entity - Entity to level up
   * @param levels - Number of levels to gain
   *
   * @example
   * ```ts
   * statsSystem.levelUp(player, 5)
   * ```
   */
  levelUp(entity: Entity, levels: number = 1): void {
    const stats = this.characterStats.get(entity)
    if (!stats) return

    stats.level += levels
    stats.experienceToNextLevel = calculateExperienceForLevel(stats.level + 1)
  }

  /**
   * Get stat bonus for a specific stat.
   *
   * Useful for applying bonuses to actions.
   *
   * @param entity - Entity
   * @param stat - Stat name
   * @returns Stat value
   *
   * @example
   * ```ts
   * const strength = statsSystem.getStatValue(player, 'strength')
   * const damage = baseDamage + strength
   * ```
   */
  getStatValue(
    entity: Entity,
    stat: keyof BaseStats
  ): number {
    const stats = this.characterStats.get(entity)
    if (!stats) return 0

    return stats.base[stat]
  }

  /**
   * Get derived stat value.
   *
   * @param entity - Entity
   * @param stat - Stat name
   * @returns Stat value
   *
   * @example
   * ```ts
   * const health = statsSystem.getDerivedStat(player, 'health')
   * ```
   */
  getDerivedStat(
    entity: Entity,
    stat: keyof DerivedStats
  ): number {
    const stats = this.characterStats.get(entity)
    if (!stats) return 0

    return stats.derived[stat]
  }

  /**
   * Get character level.
   *
   * @param entity - Entity
   * @returns Character level
   *
   * @example
   * ```ts
   * const level = statsSystem.getLevel(player)
   * ```
   */
  getLevel(entity: Entity): number {
    const stats = this.characterStats.get(entity)
    return stats?.level ?? 0
  }

  /**
   * Check if character meets level requirement.
   *
   * @param entity - Entity
   * @param requiredLevel - Required level
   * @returns true if meets requirement
   *
   * @example
   * ```ts
   * if (statsSystem.meetsLevelRequirement(player, weapon.level)) {
   *   equipWeapon()
   * }
   * ```
   */
  meetsLevelRequirement(entity: Entity, requiredLevel: number): boolean {
    return this.getLevel(entity) >= requiredLevel
  }

  /**
   * Get stat effectiveness modifier for level difference.
   *
   * @param entity - Entity
   * @param targetLevel - Target level (item/enemy)
   * @returns Effectiveness multiplier
   *
   * @example
   * ```ts
   * const eff = statsSystem.getStatEffectiveness(player, enemy.level)
   * const actualDamage = baseDamage * eff
   * ```
   */
  getStatEffectiveness(entity: Entity, targetLevel: number): number {
    const stats = this.characterStats.get(entity)
    if (!stats) return 1.0

    return calculateStatEffectiveness(stats, targetLevel)
  }

  /**
   * Get character stats summary for UI.
   *
   * @param entity - Entity
   * @returns Stats summary
   *
   * @example
   * ```ts
   * const summary = statsSystem.getStatsSummary(player)
   * displayCharacterSheet(summary)
   * ```
   */
  getStatsSummary(entity: Entity) {
    const stats = this.characterStats.get(entity)
    if (!stats) return null

    return getStatsSummary(stats)
  }

  /**
   * Update character stats (full recalculation).
   *
   * @param entity - Entity
   * @param base - New base stats
   *
   * @example
   * ```ts
   * statsSystem.updateCharacterStats(player, newBaseStats)
   * ```
   */
  updateCharacterStats(entity: Entity, base: BaseStats): void {
    const stats = this.characterStats.get(entity)
    if (!stats) return

    stats.base = base
    stats.derived = calculateDerivedStats(base)
  }

  /**
   * Reset character (for respawn, etc).
   *
   * @param entity - Entity
   *
   * @example
   * ```ts
   * statsSystem.resetCharacter(player)
   * ```
   */
  resetCharacter(entity: Entity): void {
    const stats = this.characterStats.get(entity)
    if (!stats) return

    stats.experience = 0
    stats.derived = calculateDerivedStats(stats.base)
  }

  /**
   * Get all characters.
   *
   * @returns Map of entities to stats
   *
   * @example
   * ```ts
   * const all = statsSystem.getAllCharacters()
   * ```
   */
  getAllCharacters(): Map<Entity, CharacterStats> {
    return new Map(this.characterStats)
  }

  /**
   * Remove character stats.
   *
   * @param entity - Entity to remove
   *
   * @example
   * ```ts
   * statsSystem.removeCharacter(entity)
   * ```
   */
  removeCharacter(entity: Entity): void {
    this.characterStats.delete(entity)
  }

  /**
   * Clear all characters.
   *
   * Useful for cleanup or scene transitions.
   */
  clear(): void {
    this.characterStats.clear()
  }
}

