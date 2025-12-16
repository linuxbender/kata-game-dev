// Enemy behavior states and transitions

import type { TypedWorld } from '@engine/componentTypes'
import { COMPONENTS } from '@engine/constants'
import type { EnemyComponent } from '@components/Enemy'
import { calculateDirection, applyVelocity, stopMovement } from '@engine/systems/EnemyAIUtilities'
import type { Transform, Velocity } from '@components/index'

// Enemy behavior state enum
export enum EnemyState {
  IDLE = 'idle',           // Waiting at spawn
  CHASING = 'chasing',     // Pursuing target
  ATTACKING = 'attacking', // In attack range
  RETURNING = 'returning'  // Going back to spawn
}

// Behavior interface for extensibility
export interface EnemyBehavior {
  enter?: (enemy: EnemyComponent) => void
  execute: (
    world: TypedWorld,
    entity: number,
    enemy: EnemyComponent,
    transform: Transform,
    velocity: Velocity
  ) => EnemyState | null
  exit?: (enemy: EnemyComponent) => void
}

// Chase behavior - move towards target
export const createChaseBehavior = (): EnemyBehavior => ({
  execute: (world, entity, enemy, transform, velocity) => {
    const targetId = enemy.targetEntity
    if (targetId === undefined) return EnemyState.IDLE

    const targetTransform = world.getComponent(
      targetId,
      COMPONENTS.TRANSFORM
    ) as Transform | undefined

    if (!targetTransform) return EnemyState.IDLE

    // Calculate direction and distance to target
    const { nx, ny, distance } = calculateDirection(
      transform.x,
      transform.y,
      targetTransform.x,
      targetTransform.y
    )

    // Check if target is still in detection range
    if (distance > enemy.detectionRange) {
      return EnemyState.RETURNING
    }

    // Check if close enough to attack
    if (distance <= enemy.attackRange) {
      return EnemyState.ATTACKING
    }

    // Move towards target
    applyVelocity(velocity, nx, ny, enemy.speed)
    world.markComponentUpdated(entity, COMPONENTS.VELOCITY)

    return null // Stay in chase state
  }
})

// Attack behavior - attack target if in range and cooldown passed
export const createAttackBehavior = (): EnemyBehavior => ({
  execute: (world, entity, enemy, transform, velocity) => {
    const targetId = enemy.targetEntity
    if (targetId === undefined) return EnemyState.IDLE

    const targetTransform = world.getComponent(
      targetId,
      COMPONENTS.TRANSFORM
    ) as Transform | undefined

    if (!targetTransform) return EnemyState.IDLE

    // Calculate distance
    const { distance } = calculateDirection(
      transform.x,
      transform.y,
      targetTransform.x,
      targetTransform.y
    )

    // If target moved out of attack range, go back to chase
    if (distance > enemy.attackRange) {
      return EnemyState.CHASING
    }

    // If target moved out of detection range, return to spawn
    if (distance > enemy.detectionRange) {
      return EnemyState.RETURNING
    }

    // Stop moving while attacking
    stopMovement(velocity)
    world.markComponentUpdated(entity, COMPONENTS.VELOCITY)

    // Perform attack if cooldown passed
    if (world.getTime() - enemy.lastAttackTime >= enemy.attackCooldown) {
      console.log(
        `[Enemy AI] Attack! Damage: ${enemy.attackDamage}, Target Distance: ${distance.toFixed(2)}px`
      )
      enemy.lastAttackTime = world.getTime()
      world.markComponentUpdated(entity, COMPONENTS.ENEMY)
    }

    return null // Stay in attack state
  }
})

// Return behavior - move back to spawn position
export const createReturnBehavior = (): EnemyBehavior => ({
  enter: (enemy) => {
    enemy.isReturning = true
  },
  execute: (world, entity, enemy, transform, velocity) => {
    // Calculate direction and distance to spawn
    const { nx, ny, distance } = calculateDirection(
      transform.x,
      transform.y,
      enemy.spawnX,
      enemy.spawnY
    )

    // Threshold for "close enough to spawn" (5 units)
    const SPAWN_ARRIVAL_THRESHOLD = 5

    if (distance <= SPAWN_ARRIVAL_THRESHOLD) {
      // Arrived at spawn
      stopMovement(velocity)
      world.markComponentUpdated(entity, COMPONENTS.VELOCITY)
      return EnemyState.IDLE
    }

    // Move towards spawn
    applyVelocity(velocity, nx, ny, enemy.speed)
    world.markComponentUpdated(entity, COMPONENTS.VELOCITY)

    return null // Stay in return state
  },
  exit: (enemy) => {
    enemy.isReturning = false
  }
})

// Idle behavior - patrol around spawn (check if target re-enters detection range)
export const createIdleBehavior = (): EnemyBehavior => ({
  execute: (world, entity, enemy, transform, velocity) => {
    const targetId = enemy.targetEntity
    if (targetId === undefined) return null

    const targetTransform = world.getComponent(
      targetId,
      COMPONENTS.TRANSFORM
    ) as Transform | undefined

    if (!targetTransform) return null

    // Calculate distance to target
    const { distance } = calculateDirection(
      transform.x,
      transform.y,
      targetTransform.x,
      targetTransform.y
    )

    // If target enters detection range, start chasing
    if (distance <= enemy.detectionRange) {
      return EnemyState.CHASING
    }

    // Patrol around spawn point in idle state
    const dt = 0.016  // Approximate frame time (60 FPS)
    const rotationSpeed = 1.5  // How fast to rotate patrol angle (radians/sec)

    // Update patrol angle (rotate continuously)
    enemy.patrolAngle += rotationSpeed * dt
    if (enemy.patrolAngle > Math.PI * 2) {
      enemy.patrolAngle -= Math.PI * 2
    }

    // Calculate patrol target position (circular around spawn)
    const patrolX = enemy.spawnX + Math.cos(enemy.patrolAngle) * enemy.patrolRadius
    const patrolY = enemy.spawnY + Math.sin(enemy.patrolAngle) * enemy.patrolRadius

    // Move towards patrol target
    const { nx, ny, distance: distToPatrol } = calculateDirection(
      transform.x,
      transform.y,
      patrolX,
      patrolY
    )

    if (distToPatrol > 2) {
      // Still moving to patrol point
      applyVelocity(velocity, nx, ny, enemy.patrolSpeed)
    } else {
      // Smooth stop when close to patrol point
      velocity.vx *= 0.9
      velocity.vy *= 0.9
    }

    world.markComponentUpdated(entity, COMPONENTS.VELOCITY)

    return null // Stay idle
  }
})
