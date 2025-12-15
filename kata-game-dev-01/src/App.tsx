import React, { useEffect, useRef } from 'react'
import { createWorld } from './game/setupWorld'
import { createMovementSystem } from './engine/systems/MovementSystem'
import { createRenderSystem } from './engine/systems/RenderSystem'
import type { World } from './engine/ECS'
import { COMPONENTS } from './engine/constants'
import { useCanvas } from './hooks/useCanvas'

const App = () => {
  const { canvasRef, ready } = useCanvas()
  const worldRef = useRef<World | null>(null)

  useEffect(() => {
    if (!ready) return
    const canvas = canvasRef.current!

    const { world, player } = createWorld()
    worldRef.current = world

    const { update: movementUpdate } = createMovementSystem()
    const { update: renderUpdate } = createRenderSystem(canvas, player)

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
      renderUpdate(world, dt)
      if (running) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)

    return () => {
      running = false
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
    }
  }, [ready])

  return (
    <canvas ref={canvasRef} />
  )
}

export default App
