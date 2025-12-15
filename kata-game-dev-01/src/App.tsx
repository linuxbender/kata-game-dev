import React, { useEffect, useRef } from 'react'
import { createWorld } from './game/setupWorld'
import { createMovementSystem } from './engine/systems/MovementSystem'
import { createRenderSystem } from './engine/systems/RenderSystem'
import { createQuadTree } from './engine/spatial/QuadTree'
import type { World } from './engine/ECS'
import { COMPONENTS } from './engine/constants'
import { useCanvas } from './hooks/useCanvas'

const App = () => {
  const { canvasRef, ready, dpr } = useCanvas()
  const worldRef = useRef<World | null>(null)

  useEffect(() => {
    if (!ready) return
    const canvas = canvasRef.current!

    const { world, player, quadConfig } = createWorld()
    worldRef.current = world

    const { update: movementUpdate } = createMovementSystem()
    // Initialize spatial index using recommended quadConfig from game setup
    const quad = createQuadTree(quadConfig.boundary, quadConfig.capacity ?? 8, quadConfig.maxDepth ?? 8, { mergeThreshold: quadConfig.mergeThreshold, rebalanceInterval: quadConfig.rebalanceInterval })
    const { update: renderUpdate } = createRenderSystem(canvas, player, { dpr, dampingSeconds: 0.12 }, quad)

    // Track which entities we've inserted into the quad for incremental updates/removals
    const trackedEntities = new Set<number>()

    // Initial population of the spatial index from existing entities
    const initial = world.query([COMPONENTS.TRANSFORM, COMPONENTS.RENDERABLE])
    for (const e of initial) {
      const id = e.entity
      const t = e.comps[0] as { x: number; y: number }
      quad.insert({ x: t.x, y: t.y, entity: id })
      trackedEntities.add(id)
    }

    // Subscribe to world component events to keep spatial index in sync
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

    // input state
    const keys = { up: false, down: false, left: false, right: false }
    const SPEED = 150 // units per second

    // Compute and set player velocity based on current input keys
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

    // Handle key down/up updates to the input state
    const onKey = (down: boolean, e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'w' || k === 'arrowup') keys.up = down
      if (k === 's' || k === 'arrowdown') keys.down = down
      if (k === 'a' || k === 'arrowleft') keys.left = down
      if (k === 'd' || k === 'arrowright') keys.right = down
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
      movementUpdate(world, dt)
      // pass logical canvas size for culling calculation
      renderUpdate(world, dt, { width: canvas.width / dpr, height: canvas.height / dpr })
      if (running) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)

    return () => {
      running = false
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      unsubscribe()
    }
  }, [ready])

  return (
    <canvas ref={canvasRef} />
  )
}

export default App
