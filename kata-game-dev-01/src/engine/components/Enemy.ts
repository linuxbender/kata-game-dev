// Enemy component type moved to engine to allow global component-type mapping
import type { Entity } from '../ECS'

export type EnemyComponent = {
  targetEntity?: Entity  // Entity this enemy is targeting
  attackRange: number    // How close to attack
  attackDamage: number   // Damage per hit
  attackCooldown: number // Time between attacks
  lastAttackTime: number // When last attack happened
  speed: number          // Movement speed
  detectionRange: number // How far to chase the target
  spawnX: number         // Original spawn position X
  spawnY: number         // Original spawn position Y
  isReturning: boolean   // Currently returning to spawn?
  // Idle patrol behavior
  patrolRadius: number   // How far to wander from spawn
  patrolAngle: number    // Current patrol angle (radians)
  patrolSpeed: number    // How fast to patrol (units/sec)
}

