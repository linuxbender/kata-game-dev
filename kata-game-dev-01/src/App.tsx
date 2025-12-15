import React, { useEffect, useRef } from 'react'
import { createWorld } from './game/setupWorld'
import { MovementSystem } from './engine/systems/MovementSystem'
import { RenderSystem } from './engine/systems/RenderSystem'
import type { World } from './engine/ECS'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const worldRef = useRef<World | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const { world, player } = createWorld()
    worldRef.current = world

    const movement = new MovementSystem()
    const render = new RenderSystem(canvas, player)

    // input state
    const keys = { up: false, down: false, left: false, right: false }
    const SPEED = 150 // units per second

    function setVelocityFromInput() {
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
      world.addComponent(player, 'Velocity', vel)
    }

    function onKey(down: boolean, e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      if (k === 'w' || k === 'arrowup') keys.up = down
      if (k === 's' || k === 'arrowdown') keys.down = down
      if (k === 'a' || k === 'arrowleft') keys.left = down
      if (k === 'd' || k === 'arrowright') keys.right = down
      setVelocityFromInput()
    }

    function keydown(e: KeyboardEvent) { onKey(true, e) }
    function keyup(e: KeyboardEvent) { onKey(false, e) }

    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)

    let last = performance.now()
    let running = true

    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      movement.update(world, dt)
      render.update(world, dt)
      if (running) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)

    return () => {
      running = false
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
    }
  }, [])

  return (
    <canvas ref={canvasRef} />
  )
}
