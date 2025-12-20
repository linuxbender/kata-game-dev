/**
 * Character Stats Component
 *
 * Defines all character statistics including base stats, derived stats,
 * and stat calculations with equipment bonuses.
 *
 * @example
 * ```ts
 * const stats: CharacterStats = {
 *   base: {
 *     strength: 10,
 *     dexterity: 10,
 *     intelligence: 10,
 *     constitution: 10,
 *     wisdom: 10,
 *     charisma: 10
 *   },
 *   derived: {
 *     health: 100,
 *     mana: 50,
 *     armor: 5,
 *     dodge: 0.1
 *   },
 *   experience: 0,
 *   level: 1
 * }
 * ```
 */

/**
 * Base attribute stats.
 * Core character attributes that affect derived stats.
 */
export interface BaseStats {
  /** Affects damage, carrying capacity, and derived strength */
  strength: number
  /** Affects dodge chance, attack speed, and precision */
  dexterity: number
  /** Affects mana, spell damage, and magic resistance */
  intelligence: number
  /** Affects health, poison resistance, and physical defense */
  constitution: number
  /** Affects mana regeneration, critical hits, and perception */
  wisdom: number
  /** Affects prices, persuasion, and leadership */
  charisma: number
}

/**
 * Derived stats calculated from base stats and equipment.
 * These are calculated, not stored directly.
 */
export interface DerivedStats {
  /** Current/Maximum health */
  health: number
  /** Current/Maximum mana */
  mana: number
  /** Physical armor defense */
  armor: number
  /** Dodge/evasion chance (0-1) */
  dodge: number
  /** Magic resistance (0-1) */
  magicResistance: number
  /** Attack speed multiplier */
  attackSpeed: number
  /** Spell power multiplier */
  spellPower: number
  /** Critical hit chance (0-1) */
  criticalChance: number
}

/**
 * Character stats component.
 *
 * Complete character statistics with base and derived stats.
 *
 * @example
 * ```ts
 * const stats: CharacterStats = {
 *   base: { strength: 15, dexterity: 12, intelligence: 14, constitution: 13, wisdom: 11, charisma: 10 },
 *   derived: { health: 130, mana: 70, armor: 8, dodge: 0.15, ... },
 *   experience: 500,
 *   level: 2
 * }
 * ```
 */
export interface CharacterStats {
  /** Base attributes */
  base: BaseStats
  /** Derived attributes (calculated) */
  derived: DerivedStats
  /** Current experience points */
  experience: number
  /** Character level */
  level: number
  /** Experience needed for next level */
  experienceToNextLevel?: number
}

/**
 * Stat bonuses from equipment.
 */
export interface StatModifiers {
  /** Bonus to each stat */
  base?: Partial<BaseStats>
  /** Multipliers for derived stats (0-2, where 1.0 = no change) */
  derived?: Partial<DerivedStats>
}

/**
 * Type guard: Check if object is CharacterStats.
 *
 * @example
 * ```ts
 * if (isCharacterStats(comp)) {
 *   calculateDerivedStats(comp)
 * }
 * ```
 */
export function isCharacterStats(obj: unknown): obj is CharacterStats {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as any
  return (
    typeof o.base === 'object' &&
    typeof o.derived === 'object' &&
    typeof o.experience === 'number' &&
    typeof o.level === 'number'
  )
}

/**
 * Extract CharacterStats if valid.
 *
 * @example
 * ```ts
 * const stats = extractCharacterStats(comp)
 * if (stats) {
 *   applyBonuses(stats)
 * }
 * ```
 */
export function extractCharacterStats(obj: unknown): CharacterStats | undefined {
  return isCharacterStats(obj) ? obj : undefined
}

/**
 * Create default character stats for level 1.
 *
 * All stats start at 10 (neutral average).
 *
 * @returns New character stats
 *
 * @example
 * ```ts
 * const newChar = createDefaultStats()
 * // All base stats = 10, Level 1, 0 experience
 * ```
 */
export function createDefaultStats(): CharacterStats {
  const baseStats: BaseStats = {
    strength: 10,
    dexterity: 10,
    intelligence: 10,
    constitution: 10,
    wisdom: 10,
    charisma: 10,
  }

  const stats: CharacterStats = {
    base: baseStats,
    derived: calculateDerivedStats(baseStats),
    experience: 0,
    level: 1,
    experienceToNextLevel: 100,
  }

  return stats
}

/**
 * Create character stats with custom base stats.
 *
 * @param base - Base attributes
 * @param level - Character level
 * @returns New character stats
 *
 * @example
 * ```ts
 * const warrior = createCharacterStats(
 *   { strength: 16, dexterity: 10, intelligence: 8, constitution: 15, wisdom: 11, charisma: 10 },
 *   5
 * )
 * ```
 */
export function createCharacterStats(base: BaseStats, level: number = 1): CharacterStats {
  const stats: CharacterStats = {
    base,
    derived: calculateDerivedStats(base),
    experience: 0,
    level,
    experienceToNextLevel: calculateExperienceForLevel(level + 1),
  }

  return stats
}

/**
 * Calculate derived stats from base stats.
 *
 * Uses standard RPG formulas:
 * - Health = 10 + (CON × 5) + (STR × 2)
 * - Mana = 10 + (INT × 5) + (WIS × 2)
 * - Armor = STR / 10 + DEX / 15
 * - Dodge = (DEX - 10) / 100
 * - Magic Resistance = (WIS - 10) / 100
 *
 * @param base - Base stats
 * @param modifiers - Optional stat modifiers from equipment
 * @returns Calculated derived stats
 *
 * @example
 * ```ts
 * const derived = calculateDerivedStats(baseStats, equipmentBonuses)
 * ```
 */
export function calculateDerivedStats(
  base: BaseStats,
  modifiers?: StatModifiers
): DerivedStats {
  // Apply base stat modifiers
  let str = base.strength
  let dex = base.dexterity
  let int = base.intelligence
  let con = base.constitution
  let wis = base.wisdom
  let cha = base.charisma

  if (modifiers?.base) {
    str += modifiers.base.strength || 0
    dex += modifiers.base.dexterity || 0
    int += modifiers.base.intelligence || 0
    con += modifiers.base.constitution || 0
    wis += modifiers.base.wisdom || 0
    cha += modifiers.base.charisma || 0
  }

  // Calculate derived stats
  let health = 10 + con * 5 + str * 2
  let mana = 10 + int * 5 + wis * 2
  let armor = str / 10 + dex / 15
  let dodge = Math.max(0, (dex - 10) / 100)
  let magicResistance = Math.max(0, (wis - 10) / 100)
  let attackSpeed = 1.0 + (dex - 10) / 100
  let spellPower = 1.0 + (int - 10) / 100
  let criticalChance = Math.max(0, (dex + wis - 20) / 500)

  // Apply derived stat multipliers
  if (modifiers?.derived) {
    health *= modifiers.derived.health ?? 1.0
    mana *= modifiers.derived.mana ?? 1.0
    armor *= modifiers.derived.armor ?? 1.0
    dodge *= modifiers.derived.dodge ?? 1.0
    magicResistance *= modifiers.derived.magicResistance ?? 1.0
    attackSpeed *= modifiers.derived.attackSpeed ?? 1.0
    spellPower *= modifiers.derived.spellPower ?? 1.0
    criticalChance *= modifiers.derived.criticalChance ?? 1.0
  }

  return {
    health: Math.round(health),
    mana: Math.round(mana),
    armor: Math.round(armor * 10) / 10,
    dodge: Math.min(0.9, Math.round(dodge * 1000) / 1000),
    magicResistance: Math.min(0.9, Math.round(magicResistance * 1000) / 1000),
    attackSpeed: Math.round(attackSpeed * 100) / 100,
    spellPower: Math.round(spellPower * 100) / 100,
    criticalChance: Math.min(0.9, Math.round(criticalChance * 1000) / 1000),
  }
}

/**
 * Calculate experience needed for a specific level.
 *
 * Formula: 100 × level^1.5
 *
 * @param level - Target level
 * @returns Experience points required
 *
 * @example
 * ```ts
 * const expForLevel3 = calculateExperienceForLevel(3) // ~520 XP
 * ```
 */
export function calculateExperienceForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5))
}

/**
 * Add experience to character and handle level ups.
 *
 * @param stats - Character stats to update
 * @param amount - Experience to add
 * @param baseBonus - Optional bonus multiplier (e.g., 1.5 for 50% more XP)
 * @returns Number of levels gained
 *
 * @example
 * ```ts
 * const levelsGained = addExperience(character, 250, 1.2)
 * if (levelsGained > 0) {
 *   showLevelUpMessage(levelsGained)
 * }
 * ```
 */
export function addExperience(
  stats: CharacterStats,
  amount: number,
  baseBonus: number = 1.0
): number {
  const actualAmount = Math.round(amount * baseBonus)
  let levelsGained = 0

  stats.experience += actualAmount

  // Check for level ups
  while (stats.experience >= stats.experienceToNextLevel!) {
    stats.experience -= stats.experienceToNextLevel!
    stats.level += 1
    levelsGained += 1
    stats.experienceToNextLevel = calculateExperienceForLevel(stats.level + 1)
  }

  return levelsGained
}

/**
 * Get experience percentage to next level.
 *
 * @param stats - Character stats
 * @returns Progress 0-1
 *
 * @example
 * ```ts
 * const progress = getExperienceProgress(character)
 * updateExperienceBar(progress * 100)
 * ```
 */
export function getExperienceProgress(stats: CharacterStats): number {
  const nextLevelXp = stats.experienceToNextLevel!
  return Math.min(1, stats.experience / nextLevelXp)
}

/**
 * Get stat point value for a specific attribute at a level.
 *
 * Used for stat point allocation or stat comparisons.
 *
 * @param level - Character level
 * @returns Value per stat point
 *
 * @example
 * ```ts
 * const value = getStatPointValue(10) // Value of 1 stat point at level 10
 * ```
 */
export function getStatPointValue(level: number): number {
  return 1.0 + (level - 1) * 0.1 // 1.0 at level 1, 1.9 at level 10
}

/**
 * Check if character meets level requirement.
 *
 * @param stats - Character stats
 * @param requiredLevel - Required level
 * @returns true if meets requirement
 *
 * @example
 * ```ts
 * if (meetsLevelRequirement(player, weapon.level)) {
 *   equipWeapon()
 * }
 * ```
 */
export function meetsLevelRequirement(
  stats: CharacterStats,
  requiredLevel: number
): boolean {
  return stats.level >= requiredLevel
}

/**
 * Calculate stat effectiveness based on level difference.
 *
 * Over-leveled characters get bonus, under-leveled get penalty.
 *
 * @param stats - Character stats
 * @param itemLevel - Item/enemy level
 * @returns Effectiveness multiplier (0.5-2.0)
 *
 * @example
 * ```ts
 * const eff = calculateStatEffectiveness(player, enemy)
 * const actualDamage = baseDamage * eff
 * ```
 */
export function calculateStatEffectiveness(
  stats: CharacterStats,
  itemLevel: number
): number {
  const levelDiff = stats.level - itemLevel
  // +10% per level above, -10% per level below (capped at 0.5 - 2.0)
  const multiplier = 1.0 + levelDiff * 0.1
  return Math.max(0.5, Math.min(2.0, multiplier))
}

/**
 * Get stat summary for UI display.
 *
 * @param stats - Character stats
 * @returns Summary object
 *
 * @example
 * ```ts
 * const summary = getStatsSummary(character)
 * displayCharacterSheet(summary)
 * ```
 */
export function getStatsSummary(stats: CharacterStats) {
  const nextLevelXp = stats.experienceToNextLevel!
  const expProgress = getExperienceProgress(stats)

  return {
    level: stats.level,
    experience: stats.experience,
    experienceToNextLevel: nextLevelXp,
    experienceProgress: expProgress,
    health: stats.derived.health,
    mana: stats.derived.mana,
    armor: stats.derived.armor,
    dodge: Math.round(stats.derived.dodge * 100),
    magicResistance: Math.round(stats.derived.magicResistance * 100),
    attackSpeed: stats.derived.attackSpeed,
    spellPower: stats.derived.spellPower,
    criticalChance: Math.round(stats.derived.criticalChance * 100),
  }
}

