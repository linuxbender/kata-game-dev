# Kata 01 — Game Development (ECS Starter)

This repository is a minimal starter for building a TypeScript + React game using a simple Entity-Component-System (ECS) architecture. The goal is to provide a small, extendable foundation for experimenting with open-world RPG / simulation concepts.

## Quick start

1. Install dependencies

   ```bash
   cd kata-game-dev-01
   npm install
   ```

2. Run development server

   ```bash
   npm run dev
   ```

   Open the URL shown by Vite (usually http://localhost:5173).

## Basic features included

- Lightweight ECS implementation (`src/engine/ECS.ts`) with component maps and simple queries.
- Example components: `Transform`, `Velocity`, `Renderable`.
- Systems: `createMovementSystem` (updates position) and `createRenderSystem` (renders simple circles to a canvas).
- Game initialization in `src/game/setupWorld.ts` which creates a player entity and several NPCs.
- Player input: WASD / Arrow keys to move the player (implemented in `src/App.tsx`).

## Architecture & advanced features

- **Generic QuadTree spatial index** (`src/engine/spatial/QuadTree.ts`) with auto-tuning:
  - Automatic merging when nodes are underutilized (based on `mergeThreshold`).
  - Frame-rate independent auto-tuning that adjusts merge parameters and rebalance intervals based on runtime metrics.
  - Persists tuning decisions to `localStorage` for reproducible performance across runs.
- **React Context for persisted config** (`src/contexts/QuadConfigContext.tsx`):
  - Provides `useQuadConfig()` hook to read/write quad-tree tuning parameters.
  - Automatically persists to `localStorage` key `kata_quadtree_config_v1`.
- **High-DPI canvas support** (`src/hooks/useCanvas.ts`):
  - Automatically scales canvas to match device pixel ratio.
  - Handles window resize events and adapts canvas backing store.
- **Smooth camera follow** with exponential damping (`src/engine/systems/RenderSystem.ts`):
  - Frame-rate independent camera smoothing.
  - Dead zone to prevent micro-oscillations.
  - Optional predictive look-ahead based on velocity.
  - Configurable dampening (snappy vs. cinematic feel).
- **ECS event system** (`src/engine/ECS.ts`):
  - Components emit `add`, `update`, `remove` events.
  - External systems (e.g., spatial index) can subscribe to react to changes.

## How tuning persistence works

When the game runs, the QuadTree auto-tunes its parameters (merge threshold, rebalance interval) based on metrics.
These tuned values are automatically persisted to browser `localStorage` and loaded on the next run:

### To inspect persisted config (in browser console):
```js
JSON.parse(localStorage.getItem('kata_quadtree_config_v1') || '{}')
// Example output: { "mergeThreshold": 0.28, "rebalanceInterval": 200 }
```

### To reset tuning (clear localStorage):
```js
localStorage.removeItem('kata_quadtree_config_v1')
// Then reload the page
```

## Controls

- W / ArrowUp: move up
- S / ArrowDown: move down
- A / ArrowLeft: move left
- D / ArrowRight: move right

## Development environment

- **TypeScript 5.9.3** with strict mode enabled.
- **React 19.2.3** with hooks and context patterns.
- **Vite 7.3.0** for fast development and optimized builds.
- Arrow-function style throughout (modern ES6+).
- Professional code following DRY, SOLID, and ECS design principles.

## Project structure (full overview)

```
src/
├── App.tsx                      # Main game component
├── main.tsx                     # React entry with QuadConfigProvider
├── index.css                    # Global styles
├── contexts/
│   └── QuadConfigContext.tsx   # Persisted quad config via React Context
├── hooks/
│   └── useCanvas.ts            # Canvas ref + HiDPI + resize handling
├── engine/
│   ├── ECS.ts                  # World, components, events
│   ├── constants.ts            # Component key registry (DRY)
│   ├── components/             # Component type definitions
│   ├── systems/                # Movement, Render systems
│   └── spatial/
│       └── QuadTree.ts         # Generic quad-tree with auto-tuning
└── game/
    └── setupWorld.ts           # World initialization, quad config defaults
```

## Next steps / ideas

- Add smooth camera follow and window resize handling
- Implement spatial partitioning (quadtree) and culling for large worlds
- Replace simple shapes with sprite rendering and animations
- Add collision / tilemap and basic physics
- Persist/serialize world state, optionally add networking

## Contributing

This kata is intentionally small and educational. Feel free to open PRs or add features in separate branches. If you want, tell me which feature you want next and I will implement it and run tests locally.

## License & notes

This starter is provided for learning and experimentation. No external assets are included.
