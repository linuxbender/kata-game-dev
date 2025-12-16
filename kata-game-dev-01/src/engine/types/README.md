# Component Types & Extensibility (engine)

This file documents the preferred, type-safe patterns for adding new components to the engine, subscribing to component events, and extending the global component map from plugins or other modules.

Keep these rules in mind:
- Component runtime keys live in `src/engine/constants.ts` as `COMPONENTS`.
- Component types live under `src/engine/components/*` and are re-exported from `src/engine/components/index.ts`.
- The engine exposes a generic `World<C>` type. `GlobalComponents` (in `src/engine/componentTypes.ts`) is declared as an `interface` and can be extended by declaration merging.
- Prefer the typed helper `world.onComponentEventFor(KEY, cb)` to receive strongly typed events for a specific component.

## Add a new component (recommended flow)
1. Create the component type + factory (example: `Health`):

```ts
// src/engine/components/Health.ts
export type Health = { current: number; max: number }
export const createHealth = (max: number): Health => ({ current: max, max })
```

2. Re-export it from the components index so the bare alias `@components` works:

```ts
// src/engine/components/index.ts
export * from './Health'
```

3. Add the runtime key to `COMPONENTS`:

```ts
// src/engine/constants.ts
export const COMPONENTS = {
  TRANSFORM: 'Transform',
  VELOCITY: 'Velocity',
  RENDERABLE: 'Renderable',
  ENEMY: 'Enemy',
  HEALTH: 'Health'
} as const
```

4. Option A (recommended for monolithic repo): add the type to `GlobalComponents` in `src/engine/componentTypes.ts`:

```ts
import type { Health } from '@components'

export interface GlobalComponents {
  Transform: Transform
  Velocity: Velocity
  Renderable: Renderable
  Enemy: EnemyComponent
  Health: Health
}
```

5. Option B (plugin-friendly): use declaration merging (see next section) so plugins can augment `GlobalComponents` without editing the core file.

6. Use the component in code with full type-safety:

```ts
world.addComponent(entity, COMPONENTS.HEALTH, createHealth(100))
const hp = world.getComponent(entity, COMPONENTS.HEALTH)
if (hp) { hp.current -= 10; world.markComponentUpdated(entity, COMPONENTS.HEALTH) }
```

## Declaration merging (extend `GlobalComponents` from another module / plugin)
If you have a plugin or a separate module that needs to register new components without modifying the core `componentTypes.ts`, do this in a `.d.ts` file that is included in the TypeScript build (for example: `src/engine/types/plugin-augmentations.d.ts`):

```ts
// src/engine/types/plugin-augmentations.d.ts
import type { Health } from '@components/Health'

declare module '@engine/componentTypes' {
  interface GlobalComponents {
    Health: Health
  }
}
```

Notes:
- The `declare module` path must match the module specifier used where `GlobalComponents` is exported (`@engine/componentTypes` in this repo).
- Make sure the `.d.ts` file is included by TypeScript — the project `tsconfig.json` includes `src` by default.

## Using typed events
Prefer the typed helper to subscribe to events for one component key:

```ts
const unsub = world.onComponentEventFor(COMPONENTS.HEALTH, (ev) => {
  if (ev.type === 'add' || ev.type === 'update') {
    // ev.component is typed as Health
    console.log(ev.component.current, ev.component.max)
  }
})

// unsubscribe when done
unsub()
```

If you use the generic listener `world.onComponentEvent(cb)`, narrow by `ev.name` and `ev.type` before accessing `ev.component`.

## Aliases and IDE setup
This project exposes path aliases so you can import components and types cleanly:

- TypeScript paths (in `kata-game-dev-01/tsconfig.json`):
  - `@components` → `src/engine/components`
  - `@engine` → `src/engine`
  - `@game` → `src/game`
  - `@/*` → `src/*`

- Vite alias (in `kata-game-dev-01/vite.config.ts`) maps the same aliases for runtime resolution.

If your IDE doesn't pick up the aliases immediately, do:
- IntelliJ/WebStorm: `File → Invalidate Caches / Restart`
- VSCode: reload the window or ensure the workspace `tsconfig.json` is selected.

## FAQ / Tips
- Q: Can I add components at runtime with arbitrary names?
  - A: Yes, the runtime allows arbitrary string keys, but TypeScript typing is only available for known keys present in `GlobalComponents` (or declared via merging). For dynamic keys the event `component` type will be `unknown` (fallback) — guard before use.

- Q: How do I ensure tests / CI see declaration merging augmentations?
  - A: Make sure the augmentation `.d.ts` file is included in `tsconfig.json` `include` (the monorepo `kata-game-dev-01/tsconfig.json` includes `src` by default).

---
If you want, I can also:
- Add a small example that shows a plugin augmenting `GlobalComponents` and using the new component, or
- Add a unit test demonstrating `onComponentEventFor` with the `Health` component.

