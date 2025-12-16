# COMPONENTKEY_USAGE.md - Why ComponentKey Exists and How to Use It

## What is ComponentKey?

`ComponentKey` is a **branded type** that represents a valid component name from the `COMPONENTS` constant.

```typescript
// src/engine/constants.ts
export const COMPONENTS = {
  TRANSFORM: 'Transform',
  VELOCITY: 'Velocity',
  RENDERABLE: 'Renderable',
  ENEMY: 'Enemy'
} as const

// Derived type: all valid component keys
export type ComponentKey = (typeof COMPONENTS)[keyof typeof COMPONENTS]
// Result: 'Transform' | 'Velocity' | 'Renderable' | 'Enemy'
```

---

## Why ComponentKey Exists

### Problem: Typos in Component Names

❌ **Without ComponentKey:**
```typescript
// Easy to make typos!
world.addComponent(entity, 'Transfrom', ...)  // Typo!
world.query(['Vleocity', COMPONENTS.TRANSFORM])  // Typo!
```

### Solution: Type Safety

✅ **With ComponentKey:**
```typescript
// Type-checked from COMPONENTS constant
world.addComponent(entity, COMPONENTS.TRANSFORM, ...)  // ✅ Type-safe
world.query([COMPONENTS.VELOCITY, COMPONENTS.TRANSFORM])  // ✅ Type-safe
```

---

## How to Use ComponentKey

### In Function Signatures (Internal/Advanced)

```typescript
// Enforce that only valid component keys are accepted
const getComponent = <T>(entity: Entity, name: ComponentKey): T | undefined => {
  // Type checker ensures 'name' is one of COMPONENTS keys
  // Can't pass 'BadName' or typos
}
```

### In Type Definitions

```typescript
// Mark internal state with strict typing
type ComponentMap = Map<ComponentKey, any>

type ComponentEvent = {
  type: 'add' | 'update' | 'remove'
  entity: Entity
  name: ComponentKey  // ✅ Only valid keys allowed
  component?: any
}
```

### In Public API (Flexible)

```typescript
// Public API still accepts string for flexibility/extensibility
addComponent = <T>(entity: Entity, name: string, comp: T): void => {
  // This allows future components not yet in COMPONENTS constant
  // But in practice, you should use COMPONENTS.<KEY>
}
```

---

## Best Practices

### ✅ DO: Use COMPONENTS constant

```typescript
// Always use COMPONENTS constant for type safety
world.addComponent(player, COMPONENTS.TRANSFORM, { x: 0, y: 0 })
world.addComponent(enemy, COMPONENTS.ENEMY, enemyData)
world.query([COMPONENTS.TRANSFORM, COMPONENTS.VELOCITY])
```

### ❌ DON'T: Use hardcoded strings

```typescript
// Avoid hardcoded strings (no type checking)
world.addComponent(player, 'Transform', ...)      // ❌ Bad
world.query(['Velocity', 'Transform'])             // ❌ Bad
```

### ✅ DO: Add new components to COMPONENTS

```typescript
// When adding PLAYER component:
export const COMPONENTS = {
  TRANSFORM: 'Transform',
  VELOCITY: 'Velocity',
  RENDERABLE: 'Renderable',
  ENEMY: 'Enemy',
  PLAYER: 'Player'  // ✅ Add here
} as const
```

### ❌ DON'T: Create separate constants

```typescript
// Don't scatter component definitions
export const PLAYER_COMPONENT = 'Player'  // ❌ Bad
```

---

## Type Safety Benefits

### Before (Without ComponentKey)

```typescript
// Hard to track all component names
const comp1 = world.getComponent(e1, 'Transform')
const comp2 = world.getComponent(e2, 'Transfrom')  // Typo! Not caught!
const comp3 = world.getComponent(e3, 'BadName')     // No error!
```

### After (With ComponentKey)

```typescript
// All component names typed and checked
const comp1 = world.getComponent(e1, COMPONENTS.TRANSFORM)   // ✅ Type-safe
const comp2 = world.getComponent(e2, COMPONENTS.TRANSFROM)   // ❌ Error
const comp3 = world.getComponent(e3, COMPONENTS.BAD_NAME)    // ❌ Error
```

---

## Why Public API Still Uses String

```typescript
// Public API (in ECS.ts)
addComponent = <T>(entity: Entity, name: string, comp: T): void => {
  // ✅ Accepts string for flexibility
  // Real code should still use COMPONENTS.<KEY>
}

// Why?
// 1. Allows extensibility (external systems might add components)
// 2. Backwards compatible
// 3. More flexible for advanced use cases
```

---

## Summary

| Aspect | Purpose |
|--------|---------|
| **ComponentKey** | Type for valid component names |
| **COMPONENTS** | Single source of truth |
| **Type Safety** | Prevents typos and errors |
| **Best Practice** | Always use COMPONENTS.KEY |

**ComponentKey ensures type safety throughout your ECS system!** 🎯

