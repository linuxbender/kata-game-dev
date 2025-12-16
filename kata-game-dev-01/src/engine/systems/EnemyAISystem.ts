// Enemy AI system: controls enemy behavior, targeting, and attacks
// Refactored with behavior pattern for maintainability and extensibility

import type { TypedWorld } from '@engine/componentTypes'
import { COMPONENTS } from '@engine/constants'
import type { EnemyComponent } from '@components/Enemy'
import {
  EnemyState,
  type EnemyBehavior,
  createChaseBehavior,
  createAttackBehavior,
  createReturnBehavior,
  createIdleBehavior
} from './EnemyAIBehaviors'

// Behavior map for state-based AI
const createBehaviorMap = (): Record<EnemyState, EnemyBehavior> => ({
  [EnemyState.IDLE]: createIdleBehavior(),
  [EnemyState.CHASING]: createChaseBehavior(),
  [EnemyState.ATTACKING]: createAttackBehavior(),
  [EnemyState.RETURNING]: createReturnBehavior()
})

// Enemy AI system factory
export const createEnemyAISystem = () => {
  const behaviorMap = createBehaviorMap()

  // Track current state per enemy (entity -> state)
  const enemyStates = new Map<number, EnemyState>()

  // Get or initialize enemy state
  const getEnemyState = (entity: number): EnemyState => {
    return enemyStates.get(entity) ?? EnemyState.IDLE
  }

  // Transition to new state with enter/exit callbacks
  const transitionState = (enemy: EnemyComponent, oldState: EnemyState, newState: EnemyState) => {
    if (oldState === newState) return

    // Exit old state
    behaviorMap[oldState].exit?.(enemy)

    // Enter new state
    behaviorMap[newState].enter?.(enemy)
  }

  // Main update function
  const update = (world: TypedWorld) => {
    // Query all enemies
    const enemies = world.query(COMPONENTS.ENEMY, COMPONENTS.TRANSFORM, COMPONENTS.VELOCITY)

    for (const e of enemies) {
      const entity = e.entity
      const enemy = e.comps[0] as EnemyComponent
      const transform = e.comps[1] as { x: number; y: number }
      const velocity = e.comps[2] as { vx: number; vy: number }

      // Get current state
      const currentState = getEnemyState(entity)

      // Execute current behavior
      const behavior = behaviorMap[currentState]
      const nextState = behavior.execute(world, entity, enemy, transform, velocity)

      // Handle state transition
      if (nextState !== null && nextState !== currentState) {
        transitionState(enemy, currentState, nextState)
        enemyStates.set(entity, nextState)
      } else if (nextState === null) {
        // Ensure state is tracked
        enemyStates.set(entity, currentState)
      }
    }
  }

  return { update }
}
