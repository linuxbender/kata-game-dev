// ENEMY_AI_ARCHITECTURE.md - Technical Architecture Guide

## File Structure

```
src/engine/systems/
├── EnemyAISystem.ts          # State machine & behavior orchestration
├── EnemyAIBehaviors.ts       # Behavior implementations (IDLE, CHASE, ATTACK, RETURN)
├── EnemyAIUtilities.ts       # Pure math functions for AI logic
├── MovementSystem.ts         # Player input → velocity
├── RenderSystem.ts           # World → canvas
└── ... other systems
```

---

## Component Dependencies

### EnemyComponent (in setupWorld.ts)

```typescript
export type EnemyComponent = {
  // Targeting
  targetEntity?: Entity

  // Combat
  attackRange: number         // Distance to start attacking
  attackDamage: number
  attackCooldown: number      // Time between attacks
  lastAttackTime: number      // For cooldown tracking

  // Movement
  speed: number
  detectionRange: number      // How far to chase target
  spawnX: number
  spawnY: number
  isReturning: boolean        // State flag (legacy, kept for compat)
}
```

### Required Component Access

```typescript
// Required by behaviors:
COMPONENTS.TRANSFORM  // Position: { x, y }
COMPONENTS.VELOCITY   // Velocity: { vx, vy }
'Enemy'              // Enemy component itself
```

---

## Data Flow

```
┌─────────────────────────────────┐
│ World (ECS Container)           │
│                                 │
│  Entity 1 (Player)              │
│  ├─ TRANSFORM: {x, y}           │
│  └─ VELOCITY: {vx, vy}          │
│                                 │
│  Entity 2 (Enemy)               │
│  ├─ TRANSFORM: {x, y}           │
│  ├─ VELOCITY: {vx, vy}          │
│  └─ Enemy: { speed, range... }  │
└─────────────────────────────────┘
           │
           │ Query all enemies
           ▼
┌─────────────────────────────────┐
│ EnemyAISystem.update()          │
│                                 │
│ for each enemy:                 │
│  1. getEnemyState(entity)       │
│  2. behaviorMap[state].execute()│
│  3. Handle state transition     │
│  4. Call enter/exit if needed   │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Behaviors (Idle, Chase, etc)    │
│                                 │
│ Each behavior:                  │
│  • Uses EnemyAIUtilities        │
│  • Reads components             │
│  • Modifies velocity            │
│  • Returns next state           │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ World Updated                   │
│                                 │
│ Enemy TRANSFORM & VELOCITY      │
│ changed, marked updated         │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Other Systems (Movement, etc)   │
│                                 │
│ Apply updates, physics, etc     │
└─────────────────────────────────┘
```

---

## State Machine Flow

### State Transitions

```typescript
// Each frame in EnemyAISystem.update():

const currentState = getEnemyState(entity)        // e.g., CHASING
const behavior = behaviorMap[currentState]        // Get CHASE behavior
const nextState = behavior.execute(...)           // Execute, returns ATTACKING

if (nextState !== null && nextState !== currentState) {
  behaviorMap[currentState].exit?.(enemy)         // Exit CHASE
  behaviorMap[nextState].enter?.(enemy)           // Enter ATTACKING
  enemyStates.set(entity, nextState)              // Update state
}
```

### Behavior Execution Order

1. **Enter** — Setup state (if first time)
2. **Execute** — Main logic (every frame)
3. **Exit** — Cleanup (on transition out)

---

## Behavior Details

### IDLE Behavior

```
┌─────────────────┐
│ IDLE            │
├─────────────────┤
│ • Stop moving   │
│ • Watch for     │
│   target        │
│ • Wait at spawn │
└─────────────────┘
     ▲
     │
  On enter:
  - Nothing special

  On execute:
  - Stop velocity
  - Check: target in range?
    YES → CHASING
    NO  → stay IDLE

  On exit:
  - Reset movement
```

### CHASING Behavior

```
┌──────────────────────┐
│ CHASING              │
├──────────────────────┤
│ • Move toward target │
│ • Calculate distance │
│ • Normalize velocity │
└──────────────────────┘
         ▲
         │
      On enter:
      - Nothing

      On execute:
      - Get target position
      - Calculate direction
      - Apply velocity
      - Check distance:
        ≤ attackRange?    → ATTACKING
        > detectionRange? → RETURNING

      On exit:
      - (nothing)
```

### ATTACKING Behavior

```
┌────────────────────┐
│ ATTACKING          │
├────────────────────┤
│ • Stop movement    │
│ • Check cooldown   │
│ • Deal damage      │
└────────────────────┘
         ▲
         │
      On enter:
      - Stop velocity

      On execute:
      - Stop moving
      - Check attack cooldown
      - If ready: attack
      - Check distance:
        > attackRange?       → CHASING
        > detectionRange?    → RETURNING

      On exit:
      - (nothing)
```

### RETURNING Behavior

```
┌──────────────────────┐
│ RETURNING            │
├──────────────────────┤
│ • Move to spawn      │
│ • Calculate distance │
│ • Apply velocity     │
└──────────────────────┘
         ▲
         │
      On enter:
      - Set isReturning = true

      On execute:
      - Get spawn position
      - Calculate direction
      - Apply velocity
      - Check distance:
        ≤ THRESHOLD (5)? → IDLE

      On exit:
      - Set isReturning = false
```

---

## Utility Functions Reference

### Distance Calculations

```typescript
// Fast squared distance (for comparisons)
const distSq = calculateDistanceSquared(x1, y1, x2, y2)
if (distSq <= rangeSquared) { ... }

// Actual distance
const dist = calculateDistance(x1, y1, x2, y2)
console.log(`Distance: ${dist}px`)
```

### Vector Operations

```typescript
// Normalize a vector
const { nx, ny } = normalizeVector(dx, dy)

// Full direction calculation
const { dx, dy, nx, ny, distance } = calculateDirection(
  fromX, fromY,
  toX, toY
)
```

### Entity Updates

```typescript
// Apply movement
applyVelocity(velocity, nx, ny, speed)
world.markComponentUpdated(entity, COMPONENTS.VELOCITY)

// Stop
stopMovement(velocity)
world.markComponentUpdated(entity, COMPONENTS.VELOCITY)
```

---

## Extension Example: Adding Patrol Behavior

```typescript
// Step 1: Define new state
enum EnemyState {
  IDLE = 'idle',
  PATROLLING = 'patrolling',  // NEW
  CHASING = 'chasing',
  ATTACKING = 'attacking',
  RETURNING = 'returning'
}

// Step 2: Implement behavior
export const createPatrolBehavior = (): EnemyBehavior => ({
  enter: (enemy) => {
    enemy.patrolIndex = 0  // Start at first waypoint
  },

  execute: (world, entity, enemy, transform, velocity) => {
    // Check if target detected
    if (targetInDetectionRange()) return EnemyState.CHASING

    // Get current waypoint
    const waypoint = enemy.patrolWaypoints[enemy.patrolIndex]

    // Calculate distance to waypoint
    const { nx, ny, distance } = calculateDirection(
      transform.x, transform.y,
      waypoint.x, waypoint.y
    )

    if (distance > 10) {
      // Move to waypoint
      applyVelocity(velocity, nx, ny, enemy.speed)
      world.markComponentUpdated(entity, COMPONENTS.VELOCITY)
    } else {
      // Waypoint reached, move to next
      enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrolWaypoints.length
    }

    return null  // Stay patrolling
  },

  exit: (enemy) => {
    enemy.patrolIndex = 0
  }
})

// Step 3: Register in behavior map
const createBehaviorMap = (): Record<EnemyState, EnemyBehavior> => ({
  [EnemyState.IDLE]: createIdleBehavior(),
  [EnemyState.PATROLLING]: createPatrolBehavior(),  // NEW
  [EnemyState.CHASING]: createChaseBehavior(),
  [EnemyState.ATTACKING]: createAttackBehavior(),
  [EnemyState.RETURNING]: createReturnBehavior()
})

// No changes needed to EnemyAISystem! 🎉
```

---

## Common Issues & Solutions

### Issue: Enemy not moving

**Check**:
- Is TRANSFORM component present? ✓
- Is VELOCITY component present? ✓
- Is velocity being marked updated? ✓
- Is behavior executing? (add console.log)

### Issue: State stuck in one state

**Check**:
- Does behavior.execute() return correct state?
- Is transition logic correct?
- Are enter/exit callbacks working?

### Issue: Attack not triggering

**Check**:
- Is `world.getTime()` advancing? ✓
- Is cooldown large? ✓
- Is distance <= attackRange? ✓

---

## Performance Tips

1. **Use `calculateDistanceSquared()` for range checks** — Avoids sqrt
2. **Avoid creating objects every frame** — Reuse objects
3. **Cache behavior map** — Create once in factory
4. **Minimize console.log** — Use debug flag

---

## Testing Strategy

```typescript
// Unit test behaviors (pure logic)
const behavior = createChaseBehavior()
const nextState = behavior.execute(mockWorld, mockEntity, ...)
expect(nextState).toBe(EnemyState.ATTACKING)

// Unit test utilities (pure functions)
const dist = calculateDistance(0, 0, 3, 4)
expect(dist).toBe(5)

// Integration test (full system)
createEnemyAISystem().update(world)
// Verify state changes, velocity updates, etc.
```

---

## Summary

| Layer | Responsibility | File |
|-------|---|---|
| **System** | State machine, orchestration | EnemyAISystem.ts |
| **Behaviors** | State-specific logic | EnemyAIBehaviors.ts |
| **Utilities** | Pure math functions | EnemyAIUtilities.ts |
| **Components** | Data & configuration | setupWorld.ts |

This architecture is **SOLID, DRY, and extensible**. ✅

