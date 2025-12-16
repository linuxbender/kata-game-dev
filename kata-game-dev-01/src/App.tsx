import React, { useEffect, useRef } from 'react'
import { createWorld } from '@game/setupWorld'
import { createMovementSystem } from '@engine/systems/MovementSystem'
import { createEnemyAISystem } from '@engine/systems/EnemyAISystem'
import { createRenderSystem } from '@engine/systems/RenderSystem'
import { createInputSystem, INPUT_ACTIONS } from '@engine/systems/InputSystem'
import { createQuadTree } from '@engine/spatial/QuadTree'
import { createDebugOverlay } from '@engine/systems/DebugOverlay'
import type { TypedWorld } from '@engine/componentTypes'
import { COMPONENTS, EVENT_TYPES } from '@engine/constants'
import { useCanvas } from './hooks/useCanvas'
import { useQuadConfig } from './contexts/QuadConfigContext'
import { createCanvasHudRenderer } from '@game/HUD'

// Main app component that manages game loop, systems, and quad-tree spatial indexing
const App = () => {
  const { canvasRef, ready, dpr } = useCanvas()
  const worldRef = useRef<TypedWorld | null>(null)
  const playerRef = useRef<number | null>(null)

  // Read persisted quad config from context outside the effect (follows React hooks rules)
  const { config: persistedConfig, setConfig: persistConfig } = useQuadConfig()

  // Create a single stable canvas HUD renderer that reads the world/player refs.
  // It internally keeps animation state and will be called each frame by the render system.
  const canvasHudRef = useRef<ReturnType<typeof createCanvasHudRenderer> | null>(null)
  if (!canvasHudRef.current) {
    canvasHudRef.current = createCanvasHudRenderer(() => {
      const w = worldRef.current
      const p = playerRef.current
      if (!w || p == null) return null
      return w.getComponent(p, COMPONENTS.HEALTH) ?? null
    })
  }

  // Stable wrapper passed to render system
  const wrapperHudRenderer = (ctx: CanvasRenderingContext2D, world: TypedWorld, camX: number, camY: number, viewW: number, viewH: number, dpr: number) => {
    const fn = canvasHudRef.current
    if (fn) fn(ctx, world, camX, camY, viewW, viewH, dpr)
  }

  useEffect(() => {
    if (!ready) return

    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const { world, player, quadConfig } = createWorld()
      worldRef.current = world
      playerRef.current = player

      const { update: movementUpdate } = createMovementSystem()
      const { update: enemyAIUpdate } = createEnemyAISystem()

      // Initialize input system with configurable settings
      const inputSystem = createInputSystem({
        movementSpeed: 150,
        enableDiagonalNormalization: true
      })

      // Initialize quad tree with persisted config merged with defaults
      const quad = createQuadTree(
        quadConfig.boundary,
        quadConfig.capacity ?? 8,
        quadConfig.maxDepth ?? 8,
        {
          mergeThreshold: persistedConfig.mergeThreshold ?? quadConfig.mergeThreshold,
          rebalanceInterval: persistedConfig.rebalanceInterval ?? quadConfig.rebalanceInterval,
          // Persist tuning changes to localStorage via context
          onConfigChange: (c: { mergeThreshold: number; rebalanceInterval: number }) => {
            try { persistConfig(c) } catch (e) { /* ignore persistence errors */ }
          }
        }
      )

      // Initialize debug overlay (toggle with Shift+D)
      const debugOverlay = createDebugOverlay(canvas)

      // Initialize render system with smooth camera follow and spatial culling
      const { update: renderUpdate } = createRenderSystem(canvas, player, {
        dpr,
        camera: {
          dampingSeconds: 0.12,
          deadZoneRadius: 3,
          lookAheadFactor: 0.2
        }
      }, quad, debugOverlay, wrapperHudRenderer)

      // Track entities in quad tree for incremental updates
      const trackedEntities = new Set<number>()

      // Populate quad tree with initial entities
      const initial = world.query(COMPONENTS.TRANSFORM, COMPONENTS.RENDERABLE)
      for (const e of initial) {
        const id = e.entity
        const t = e.comps[0]
        quad.insert({ x: t.x, y: t.y, entity: id })
        trackedEntities.add(id)
      }

      // Subscribe to world component events to keep spatial index synchronized
      const unsubscribe = world.onComponentEvent((ev) => {
        if (ev.name !== COMPONENTS.TRANSFORM) return
        if (ev.type === EVENT_TYPES.ADD) {
          const id = ev.entity
          const pos = (ev.component as any)
          quad.insert({ x: pos.x, y: pos.y, entity: id })
          trackedEntities.add(id)
        } else if (ev.type === EVENT_TYPES.UPDATE) {
          const id = ev.entity
          const pos = world.getComponent(id, COMPONENTS.TRANSFORM)
          if (pos) {
            if (quad.has(id)) quad.update(id, pos.x, pos.y)
            else { quad.insert({ x: pos.x, y: pos.y, entity: id }); trackedEntities.add(id) }
          }
        } else if (ev.type === EVENT_TYPES.REMOVE) {
          const id = ev.entity
          if (quad.has(id)) quad.remove(id)
          trackedEntities.delete(id)
        }
      })

      // Attach input system listeners
      inputSystem.attach()

      // Track last debug toggle state to detect changes
      let lastDebugState = false

      // Debug keys: H = damage -10, J = heal +10
      const debugDamageKey = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase()
        const w = worldRef.current
        const p = playerRef.current
        if (!w || p == null) return
        if (key === 'h') {
          const hp = w.getComponent(p, COMPONENTS.HEALTH)
          if (hp) {
            hp.current = Math.max(0, hp.current - 10)
            w.markComponentUpdated(p, COMPONENTS.HEALTH)
          }
        }
        if (key === 'j') {
          const hp = w.getComponent(p, COMPONENTS.HEALTH)
          if (hp) {
            hp.current = Math.min(hp.max, hp.current + 10)
            w.markComponentUpdated(p, COMPONENTS.HEALTH)
          }
        }
      }
      window.addEventListener('keydown', debugDamageKey)

      let last = performance.now()
      let running = true

      // Main game loop frame
      const frame = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.05)
        last = now

        // Update world time for game logic (cooldowns, timers, etc.)
        world.updateTime(dt)

        // Update input and player movement
        inputSystem.update(world, player, dt)

        // Handle debug overlay toggle
        const debugPressed = inputSystem.isActionPressed(INPUT_ACTIONS.DEBUG_TOGGLE)
        if (debugPressed && !lastDebugState) {
          debugOverlay.toggle()
        }
        lastDebugState = debugPressed

        // Update movement
        movementUpdate(world, dt)

        // Update enemy AI (targeting, movement, attacks)
        enemyAIUpdate(world)

        // Render frame (pass quad for debug metrics)
        renderUpdate(world, dt, { width: canvas.width / dpr, height: canvas.height / dpr }, quad)

        if (running) requestAnimationFrame(frame)
      }

      requestAnimationFrame(frame)

      // Cleanup on unmount or ready change
      return () => {
        running = false
        inputSystem.detach()
        window.removeEventListener('keydown', debugDamageKey)
        unsubscribe()
      }
    } catch (error) {
      console.error('App initialization error:', error)
    }
  }, [ready, dpr])

  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  )
}

export default App
