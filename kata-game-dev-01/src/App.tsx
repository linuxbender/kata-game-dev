import React, { useEffect, useRef } from 'react'
import { createWorld } from './game/setupWorld'
import { createMovementSystem } from './engine/systems/MovementSystem'
import { createRenderSystem } from './engine/systems/RenderSystem'
import { createQuadTree } from './engine/spatial/QuadTree'
import { createDebugOverlay } from './engine/systems/DebugOverlay'
import type { World } from './engine/ECS'
import { COMPONENTS } from './engine/constants'
import { useCanvas } from './hooks/useCanvas'
import { useQuadConfig } from './contexts/QuadConfigContext'

// Main app component that manages game loop, systems, and quad-tree spatial indexing
const App = () => {
  const { canvasRef, ready, dpr } = useCanvas()
  const worldRef = useRef<World | null>(null)

  // Read persisted quad config from context outside the effect (follows React hooks rules)
  const { config: persistedConfig, setConfig: persistConfig } = useQuadConfig()

  useEffect(() => {
    if (!ready) return

    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const { world, player, quadConfig } = createWorld()
      worldRef.current = world

      const { update: movementUpdate } = createMovementSystem()

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
      }, quad, debugOverlay)

      // Track entities in quad tree for incremental updates
      const trackedEntities = new Set<number>()

      // Populate quad tree with initial entities
      const initial = world.query([COMPONENTS.TRANSFORM, COMPONENTS.RENDERABLE])
      for (const e of initial) {
        const id = e.entity
        const t = e.comps[0] as { x: number; y: number }
        quad.insert({ x: t.x, y: t.y, entity: id })
        trackedEntities.add(id)
      }

      // Subscribe to world component events to keep spatial index synchronized
      const unsubscribe = world.onComponentEvent((ev) => {
        if (ev.name !== COMPONENTS.TRANSFORM) return
        if (ev.type === 'add') {
          const id = ev.entity
          const pos = (ev.component as any)
          quad.insert({ x: pos.x, y: pos.y, entity: id })
          trackedEntities.add(id)
        } else if (ev.type === 'update') {
          const id = ev.entity
          const pos = world.getComponent<{ x: number; y: number }>(id, COMPONENTS.TRANSFORM)
          if (pos) {
            if (quad.has(id)) quad.update(id, pos.x, pos.y)
            else { quad.insert({ x: pos.x, y: pos.y, entity: id }); trackedEntities.add(id) }
          }
        } else if (ev.type === 'remove') {
          const id = ev.entity
          if (quad.has(id)) quad.remove(id)
          trackedEntities.delete(id)
        }
      })

      // Input handling
      const keys = { up: false, down: false, left: false, right: false }
      const SPEED = 150 // units per second

      // Update player velocity based on current input state
      const setVelocityFromInput = () => {
        const vx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
        const vy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0)
        let nx = vx
        let ny = vy
        if (vx !== 0 && vy !== 0) {
          const inv = 1 / Math.sqrt(2)
          nx = vx * inv
          ny = vy * inv
        }
        const vel = { vx: nx * SPEED, vy: ny * SPEED }
        world.addComponent(player, COMPONENTS.VELOCITY, vel)
      }

      // Handle keyboard input
      const onKey = (down: boolean, e: KeyboardEvent) => {
        const k = e.key.toLowerCase()
        if (k === 'w' || k === 'arrowup') keys.up = down
        if (k === 's' || k === 'arrowdown') keys.down = down
        if (k === 'a' || k === 'arrowleft') keys.left = down
        if (k === 'd' || k === 'arrowright') keys.right = down
        // Toggle debug overlay on Shift+D (reliable cross-platform)
        if (k === 'd' && down && e.shiftKey) {
          debugOverlay.toggle()
        }
        setVelocityFromInput()
      }

      const keydown = (e: KeyboardEvent) => onKey(true, e)
      const keyup = (e: KeyboardEvent) => onKey(false, e)

      window.addEventListener('keydown', keydown)
      window.addEventListener('keyup', keyup)

      let last = performance.now()
      let running = true

      // Main game loop frame
      const frame = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.05)
        last = now

        // Update movement
        movementUpdate(world, dt)

        // Render frame (pass quad for debug metrics)
        renderUpdate(world, dt, { width: canvas.width / dpr, height: canvas.height / dpr }, quad)

        if (running) requestAnimationFrame(frame)
      }

      requestAnimationFrame(frame)

      // Cleanup on unmount or ready change
      return () => {
        running = false
        window.removeEventListener('keydown', keydown)
        window.removeEventListener('keyup', keyup)
        unsubscribe()
      }
    } catch (error) {
      console.error('App initialization error:', error)
    }
  }, [ready, dpr])

  return (
    <canvas ref={canvasRef} />
  )
}

export default App
