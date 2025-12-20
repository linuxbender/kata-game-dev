/**
 * Component Type Definitions
 *
 * Defines all game component types with full type safety,
 * JSDoc documentation, and helper type guards.
 *
 * This module provides:
 * - Type definitions for all components
 * - Type guard functions for runtime checking
 * - Type utilities for component access
 * - Best practices for type-safe component handling
 *
 * @example
 * ```ts
 * // Type-safe component access
 * const transform = getComponentTypeSafe<Transform>(world, entity, 'transform')
 *
 * // Type guard checking
 * if (isTransform(component)) {
 *   console.log(component.x, component.y)
 * }
 *
 * // Extract typed component
 * const health = extractHealth(world, entity)
 * if (health) {
 *   applyHealing(entity, health)
 * }
 * ```
 */

import type { Point } from '@components/Transform'
import type { Transform } from '@components/Transform'
import type { Velocity } from '@components/Velocity'
import type { Health } from '@components/Health'
import type { Renderable } from '@components/Renderable'
import type { Collider } from '@components/Collider'

/**
 * Damage component for combat calculations.
 *
 * Defines damage output with variance for combat variety.
 *
 * @example
 * ```ts
 * const playerDamage: Damage = {
 *   baseValue: 10,
 *   variance: 2
 * }
 * // Actual damage: 8-12
 * ```
 */
export interface Damage {
  /** Base damage value */
  baseValue: number
  /** Damage variance (±) */
  variance: number
}

/**
 * Stats component for player progression.
 *
 * Tracks level, experience, and progression system.
 *
 * @example
 * ```ts
 * const playerStats: Stats = {
 *   level: 1,
 *   experience: 0,
 *   experienceToNextLevel: 100
 * }
 * ```
 */
export interface Stats {
  /** Current level */
  level: number
  /** Current experience points */
  experience: number
  /** Experience needed for next level */
  experienceToNextLevel: number
}

/**
 * Inventory component for item storage.
 *
 * Manages items and inventory slots.
 *
 * @example
 * ```ts
 * const inventory: Inventory = {
 *   maxSlots: 20,
 *   items: []
 * }
 * ```
 */
export interface InventoryItem {
  /** Item ID */
  id: string
  /** Item type */
  type: string
  /** Quantity */
  quantity: number
}

export interface Inventory {
  /** Maximum inventory slots */
  maxSlots: number
  /** Items in inventory */
  items: InventoryItem[]
}

/**
 * Equipment component for equipped items.
 *
 * Manages equipment slots and equipped gear.
 *
 * @example
 * ```ts
 * const equipment: Equipment = {
 *   slots: {
 *     mainHand: 'sword_iron',
 *     offHand: undefined
 *   }
 * }
 * ```
 */
export interface EquipmentSlots {
  /** Main hand weapon/item */
  mainHand?: string
  /** Off hand weapon/item */
  offHand?: string
  [key: string]: string | undefined
}

export interface Equipment {
  /** Equipment slots and their contents */
  slots: EquipmentSlots
}

/**
 * AI component for behavior control.
 *
 * Defines AI behavior and detection parameters.
 *
 * @example
 * ```ts
 * const enemyAI: AI = {
 *   type: 'aggressive',
 *   detectionRange: 200,
 *   attackRange: 30,
 *   speed: 100
 * }
 * ```
 */
export interface AI {
  /** AI behavior type */
  type: 'aggressive' | 'defensive' | 'passive'
  /** Detection range for enemies */
  detectionRange: number
  /** Attack range */
  attackRange: number
  /** Movement speed */
  speed: number
}

/**
 * Enemy component for enemy-specific data.
 *
 * Defines enemy classification and behavior.
 *
 * @example
 * ```ts
 * const goblin: Enemy = {
 *   type: 'goblin',
 *   difficulty: 'easy',
 *   spawnX: 100,
 *   spawnY: 100
 * }
 * ```
 */
export interface Enemy {
  /** Enemy type/name */
  type: string
  /** Difficulty level */
  difficulty: 'easy' | 'medium' | 'hard' | 'boss'
  /** Original spawn X position */
  spawnX: number
  /** Original spawn Y position */
  spawnY: number
}

/**
 * Metadata component for general entity tagging.
 *
 * Used for flexible entity classification.
 *
 * @example
 * ```ts
 * const metadata: Metadata = {
 *   isPlayer: true,
 *   tags: ['hero', 'human']
 * }
 * ```
 */
export interface Metadata {
  /** Custom properties */
  [key: string]: any
}

/**
 * ParticleEmitter component for particle systems.
 *
 * Controls particle emission from an entity.
 *
 * @example
 * ```ts
 * const emitter: ParticleEmitter = {
 *   emissionRate: 10,
 *   lifetime: 2000,
 *   particleCount: 100
 * }
 * ```
 */
export interface ParticleEmitter {
  /** Particles emitted per frame */
  emissionRate: number
  /** Particle lifetime in ms */
  lifetime: number
  /** Max particles */
  particleCount: number
}

/**
 * Union type of all component types.
 *
 * Useful for generic component handling.
 */
export type AnyComponent =
  | Transform
  | Velocity
  | Health
  | Damage
  | Stats
  | Inventory
  | Equipment
  | Renderable
  | Collider
  | AI
  | Enemy
  | Metadata
  | ParticleEmitter

/**
 * Type guard: Check if component is Transform.
 *
 * @example
 * ```ts
 * const comp = getComponent(entity, 'transform')
 * if (isTransform(comp)) {
 *   moveEntity(comp.x, comp.y)
 * }
 * ```
 */
export function isTransform(component: unknown): component is Transform {
  return (
    typeof component === 'object' &&
    component !== null &&
    'x' in component &&
    'y' in component
  )
}

/**
 * Type guard: Check if component is Velocity.
 *
 * @example
 * ```ts
 * if (isVelocity(comp)) {
 *   applyPhysics(comp.vx, comp.vy)
 * }
 * ```
 */
export function isVelocity(component: unknown): component is Velocity {
  return (
    typeof component === 'object' &&
    component !== null &&
    'vx' in component &&
    'vy' in component
  )
}

/**
 * Type guard: Check if component is Health.
 *
 * @example
 * ```ts
 * if (isHealth(comp)) {
 *   healEntity(comp.current, comp.max)
 * }
 * ```
 */
export function isHealth(component: unknown): component is Health {
  return (
    typeof component === 'object' &&
    component !== null &&
    'current' in component &&
    'max' in component
  )
}

/**
 * Type guard: Check if component is Damage.
 */
export function isDamage(component: unknown): component is Damage {
  return (
    typeof component === 'object' &&
    component !== null &&
    'baseValue' in component &&
    'variance' in component
  )
}

/**
 * Type guard: Check if component is Stats.
 */
export function isStats(component: unknown): component is Stats {
  return (
    typeof component === 'object' &&
    component !== null &&
    'level' in component &&
    'experience' in component &&
    'experienceToNextLevel' in component
  )
}

/**
 * Type guard: Check if component is Inventory.
 */
export function isInventory(component: unknown): component is Inventory {
  return (
    typeof component === 'object' &&
    component !== null &&
    'maxSlots' in component &&
    'items' in component &&
    Array.isArray((component as any).items)
  )
}

/**
 * Type guard: Check if component is Equipment.
 */
export function isEquipment(component: unknown): component is Equipment {
  return (
    typeof component === 'object' &&
    component !== null &&
    'slots' in component
  )
}

/**
 * Type guard: Check if component is Renderable.
 */
export function isRenderable(component: unknown): component is Renderable {
  return (
    typeof component === 'object' &&
    component !== null &&
    'color' in component &&
    'size' in component
  )
}

/**
 * Type guard: Check if component is Collider.
 */
export function isCollider(component: unknown): component is Collider {
  return (
    typeof component === 'object' &&
    component !== null &&
    'radius' in component &&
    'layer' in component &&
    'isTrigger' in component
  )
}

/**
 * Type guard: Check if component is AI.
 */
export function isAI(component: unknown): component is AI {
  return (
    typeof component === 'object' &&
    component !== null &&
    'type' in component &&
    'detectionRange' in component &&
    'attackRange' in component
  )
}

/**
 * Type guard: Check if component is Enemy.
 */
export function isEnemy(component: unknown): component is Enemy {
  return (
    typeof component === 'object' &&
    component !== null &&
    'type' in component &&
    'spawnX' in component &&
    'spawnY' in component
  )
}

/**
 * Type guard: Check if component is ParticleEmitter.
 */
export function isParticleEmitter(
  component: unknown
): component is ParticleEmitter {
  if (typeof component !== 'object' || component === null) return false
  const obj = component as any
  return (
    typeof obj.emissionRate === 'number' &&
    typeof obj.lifetime === 'number' &&
    typeof obj.particleCount === 'number'
  )
}

/**
 * Type guard: Check if value is a Point (has x, y).
 *
 * Useful for geometry operations.
 *
 * @example
 * ```ts
 * if (isPoint(value)) {
 *   const distance = Math.sqrt(value.x ** 2 + value.y ** 2)
 * }
 * ```
 */
export function isPoint(value: unknown): value is Point {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    'x' in obj &&
    'y' in obj &&
    typeof obj.x === 'number' &&
    typeof obj.y === 'number'
  )
}

/**
 * Safe component extractor with type guard.
 *
 * Returns component if it matches the expected type, undefined otherwise.
 *
 * @template T Component type to extract
 * @param component Component to check
 * @param guard Type guard function
 * @returns Typed component or undefined
 *
 * @example
 * ```ts
 * const health = extractComponentIfType(comp, isHealth)
 * if (health) {
 *   applyHealing(health.current, health.max)
 * }
 * ```
 */
export function extractComponentIfType<T>(
  component: unknown,
  guard: (comp: unknown) => comp is T
): T | undefined {
  return guard(component) ? component : undefined
}

/**
 * Extract Transform component if valid.
 *
 * @example
 * ```ts
 * const transform = extractTransform(comp)
 * if (transform) { moveEntity(transform) }
 * ```
 */
export function extractTransform(component: unknown): Transform | undefined {
  return extractComponentIfType(component, isTransform)
}

/**
 * Extract Health component if valid.
 */
export function extractHealth(component: unknown): Health | undefined {
  return extractComponentIfType(component, isHealth)
}

/**
 * Extract Velocity component if valid.
 */
export function extractVelocity(component: unknown): Velocity | undefined {
  return extractComponentIfType(component, isVelocity)
}

/**
 * Extract Damage component if valid.
 */
export function extractDamage(component: unknown): Damage | undefined {
  return extractComponentIfType(component, isDamage)
}

/**
 * Extract Stats component if valid.
 */
export function extractStats(component: unknown): Stats | undefined {
  return extractComponentIfType(component, isStats)
}

/**
 * Extract Inventory component if valid.
 */
export function extractInventory(component: unknown): Inventory | undefined {
  return extractComponentIfType(component, isInventory)
}

/**
 * Extract Equipment component if valid.
 */
export function extractEquipment(component: unknown): Equipment | undefined {
  return extractComponentIfType(component, isEquipment)
}

/**
 * Extract Renderable component if valid.
 */
export function extractRenderable(component: unknown): Renderable | undefined {
  return extractComponentIfType(component, isRenderable)
}

/**
 * Extract Collider component if valid.
 */
export function extractCollider(component: unknown): Collider | undefined {
  return extractComponentIfType(component, isCollider)
}

/**
 * Extract AI component if valid.
 */
export function extractAI(component: unknown): AI | undefined {
  return extractComponentIfType(component, isAI)
}

/**
 * Extract Enemy component if valid.
 */
export function extractEnemy(component: unknown): Enemy | undefined {
  return extractComponentIfType(component, isEnemy)
}

/**
 * Extract ParticleEmitter component if valid.
 */
export function extractParticleEmitter(
  component: unknown
): ParticleEmitter | undefined {
  return extractComponentIfType(component, isParticleEmitter)
}

/**
 * Factory function to create a default Transform.
 *
 * @example
 * ```ts
 * const transform = createTransform(100, 200)
 * ```
 */
export function createTransform(
  x: number,
  y: number,
  rotation: number = 0
): Transform {
  return { x, y, rotation }
}

/**
 * Factory function to create a default Velocity.
 */
export function createVelocity(vx: number = 0, vy: number = 0): Velocity {
  return { vx, vy }
}

/**
 * Factory function to create a default Health.
 */
export function createHealthComponent(max: number): Health {
  return { current: max, max }
}

/**
 * Factory function to create a default Damage.
 */
export function createDamage(baseValue: number, variance: number = 0): Damage {
  return { baseValue, variance }
}

/**
 * Factory function to create a default Stats.
 */
export function createStats(level: number = 1): Stats {
  return { level, experience: 0, experienceToNextLevel: 100 }
}

/**
 * Factory function to create a default Inventory.
 */
export function createInventory(maxSlots: number = 20): Inventory {
  return { maxSlots, items: [] }
}

/**
 * Factory function to create a default Equipment.
 */
export function createEquipment(): Equipment {
  return { slots: { mainHand: undefined, offHand: undefined } }
}

/**
 * Factory function to create a default AI.
 */
export function createAI(
  type: 'aggressive' | 'defensive' | 'passive' = 'aggressive',
  detectionRange: number = 200,
  attackRange: number = 30,
  speed: number = 100
): AI {
  return { type, detectionRange, attackRange, speed }
}

/**
 * Factory function to create a default Enemy.
 */
export function createEnemy(
  type: string,
  difficulty: 'easy' | 'medium' | 'hard' | 'boss' = 'easy',
  spawnX: number = 0,
  spawnY: number = 0
): Enemy {
  return { type, difficulty, spawnX, spawnY }
}

/**
 * Factory function to create a default ParticleEmitter.
 */
export function createParticleEmitter(
  emissionRate: number = 10,
  lifetime: number = 1000,
  particleCount: number = 100
): ParticleEmitter {
  return { emissionRate, lifetime, particleCount }
}

