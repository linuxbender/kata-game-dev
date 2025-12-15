// SETUP_GUIDE.md - QuadTree Tuning Persistence Implementation

## Summary

The QuadTree tuning decisions are now automatically persisted to browser `localStorage` and restored on app reload.

## Architecture

### Files Involved

1. **src/engine/spatial/QuadTree.ts**
   - Generic QuadTree with auto-tuning enabled by default.
   - When auto-tune adjusts `mergeThreshold` or `rebalanceInterval`, it calls `options.onConfigChange?.({ mergeThreshold, rebalanceInterval })`.
   - Exposes `getConfig()`, `setConfig()`, and `getMetrics()` for inspection and testing.

2. **src/contexts/QuadConfigContext.tsx**
   - React Context provider `QuadConfigProvider` and hook `useQuadConfig()`.
   - Persists config to `localStorage` key `kata_quadtree_config_v1` (JSON).
   - Provides `config` and `setConfig` in the context value.

3. **src/main.tsx**
   - Wraps App with `<QuadConfigProvider><App/></QuadConfigProvider>`.
   - Ensures context is available throughout the component tree.

4. **src/App.tsx**
   - Calls `useQuadConfig()` hook outside `useEffect` (correct React hooks pattern).
   - Initializes QuadTree with persisted config values merged with game defaults.
   - Passes `onConfigChange` callback to QuadTree so changes are immediately persisted.

## How It Works

### Initialization Flow
```
App mounts
  └─ useQuadConfig() reads localStorage (if present)
     └─ createQuadTree(..., { onConfigChange })
        └─ Game loop runs; QuadTree auto-tunes periodically
           └─ Auto-tune calls onConfigChange with new values
              └─ onConfigChange → setConfig (updates React state)
                 └─ useEffect watches config state
                    └─ Config saved to localStorage
```

### On Subsequent Runs
```
localStorage has 'kata_quadtree_config_v1'
  └─ App mounts
     └─ useQuadConfig() reads and returns persisted config
        └─ QuadTree initialized with these tuned values
           └─ Auto-tuning starts from these values (faster convergence)
```

## Local Testing

### 1. Install and run
```bash
cd kata-game-dev-01
npm install
npm run dev
```

### 2. Inspect persistence (browser console)
```js
// View current stored config
JSON.parse(localStorage.getItem('kata_quadtree_config_v1') || '{}')

// Output example after running for a few seconds:
// { mergeThreshold: 0.27, rebalanceInterval: 204 }
```

### 3. Reset to defaults
```js
localStorage.removeItem('kata_quadtree_config_v1')
// Reload page — QuadTree will re-tune from scratch
```

### 4. Observe auto-tuning
- Run the app with DevTools open.
- In console, repeatedly run the inspection command above.
- You should see values adjust slightly as the engine optimizes.

## Code Quality Assurance

### DRY (Don't Repeat Yourself)
- Single source of truth: React Context owns persisted config.
- QuadTree config centralized in `src/game/setupWorld.ts`.

### SOLID Principles
- **Single Responsibility**: QuadTree (tuning), Provider (persistence), App (orchestration).
- **Open/Closed**: Easy to swap localStorage for IndexedDB or server storage without changing QuadTree code.

### ECS & Design Patterns
- ECS World remains authoritative for components.
- Spatial index (QuadTree) is a pure data structure; persistence is orthogonal.
- React Context isolates persistence concern from game logic.

### Testability
- `QuadTree.getMetrics()` allows unit tests to inspect auto-tuning behavior.
- `getConfig()` / `setConfig()` allow tests to override and verify tuning decisions.
- Context provider can be mocked for isolated component tests.

### TypeScript 5.9.3 Best Practices
- Strict mode enabled in `tsconfig.json`.
- Generics used appropriately (e.g., `createQuadTree<T>`).
- Proper typing of React components and hooks.

### React 19.2.3 & Hooks Best Practices
- `useQuadConfig()` called at top level of component (correct hooks rules).
- `useMemo` used in provider to stabilize context value (avoid unnecessary re-renders).
- Arrow functions throughout for consistent modern JavaScript style.

## Next Enhancements

1. **Debug Overlay**: Visualize QuadTree nodes and metrics on-screen (toggle via `~` key).
2. **Unit Tests**: Jest + ts-jest to verify auto-tuning convergence and merging behavior.
3. **Export/Import Config**: Allow user to manually export/import tuning presets as JSON files.
4. **Server-side Persistence**: Store tuned configs on a backend to share across devices/sessions.

## Troubleshooting

### App shows empty canvas
1. Open browser console (F12) and check for errors.
2. Ensure `npm install` completed successfully (React, types, etc.).
3. Verify `index.html` has `<div id="root"></div>`.
4. Check that `QuadConfigProvider` is wrapped in `src/main.tsx`.

### localStorage not persisting
1. Check browser privacy/incognito mode (localStorage may be blocked).
2. Verify localStorage quota (typically 5-10 MB per domain).
3. In console, manually test: `localStorage.setItem('test', 'value')`.

### QuadTree auto-tuning not visible in localStorage
1. Auto-tuning runs periodically (default: every ~1000 operations).
2. Small worlds might not trigger tuning quickly.
3. Check `localStorage.getItem('kata_quadtree_config_v1')` — if null, tuning hasn't fired yet.
4. Play the game for 30+ seconds, then check again.

---

For questions or issues, refer to the main README.md or inline code comments.

