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

## Controls

- W / ArrowUp: move up
- S / ArrowDown: move down
- A / ArrowLeft: move left
- D / ArrowRight: move right

## Project structure (important files)

- `index.html` — app entry
- `src/main.tsx` — React entry
- `src/App.tsx` — Canvas setup, main loop, input handling
- `src/engine/` — minimal ECS engine (World, components, systems)
- `src/game/setupWorld.ts` — world & entity initialization

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
