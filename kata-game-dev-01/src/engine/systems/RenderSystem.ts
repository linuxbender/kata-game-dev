import type { World, Entity } from '../ECS'
import { COMPONENTS } from '../constants'

export type RenderOptions = {
  // smoothing factor interpreted as damping in seconds (smaller is snappier)
  dampingSeconds?: number
  dpr?: number
}

// Helper: compute exponential smoothing factor for given dt and dampingSeconds
const smoothingFactor = (dt: number, dampingSeconds: number) => {
  // Convert dampingSeconds to a lerp alpha: alpha = 1 - exp(-dt / tau)
  const tau = Math.max(1e-4, dampingSeconds)
  return 1 - Math.exp(-dt / tau)
}

// Render system factory: draws entities and follows the player smoothly with damping.
// Also performs simple frustum culling using canvasSize to skip off-screen entities.
export const createRenderSystem = (canvas: HTMLCanvasElement, playerEntity?: Entity, options?: RenderOptions) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D context not available')

  const dampingSeconds = options?.dampingSeconds ?? 0.08 // default damping
  let dpr = options?.dpr ?? 1

  // Camera state
  let camX = 0
  let camY = 0
  let camXTarget = 0
  let camYTarget = 0

  const update = (world: World, dt: number, canvasSize?: { width: number; height: number }) => {
    // Update DPR and apply transform so drawing uses logical coordinates
    dpr = options?.dpr ?? dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Determine camera target position
    if (playerEntity !== undefined) {
      const t = world.getComponent<{ x: number; y: number }>(playerEntity, COMPONENTS.TRANSFORM)
      if (t) {
        camXTarget = t.x
        camYTarget = t.y
      }
    } else {
      const transforms = world.query([COMPONENTS.TRANSFORM])
      if (transforms.length) {
        camXTarget = transforms[0].comps[0].x
        camYTarget = transforms[0].comps[0].y
      }
    }

    // Compute frame-rate independent smoothing alpha and lerp camera
    const alpha = smoothingFactor(dt, dampingSeconds)
    camX += (camXTarget - camX) * alpha
    camY += (camYTarget - camY) * alpha

    // Clear the canvas (physical pixel dimensions)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Determine view bounds in world coordinates (logical pixels)
    const viewW = (canvasSize ? canvasSize.width : canvas.width / dpr)
    const viewH = (canvasSize ? canvasSize.height : canvas.height / dpr)
    const halfW = viewW / 2
    const halfH = viewH / 2
    const minX = camX - halfW
    const maxX = camX + halfW
    const minY = camY - halfH
    const maxY = camY + halfH

    // Draw renderables but skip those outside the view (simple culling)
    const renderables = world.query([COMPONENTS.TRANSFORM, COMPONENTS.RENDERABLE])
    for (const r of renderables) {
      const t = r.comps[0] as { x: number; y: number }
      const rend = r.comps[1] as { color: string; size: number }

      // Simple AABB culling using entity size
      const s = rend.size
      if (t.x + s < minX || t.x - s > maxX || t.y + s < minY || t.y - s > maxY) continue

      // Convert world position to screen position (logical pixels)
      const screenX = Math.round((t.x - camX) + viewW / 2)
      const screenY = Math.round((t.y - camY) + viewH / 2)

      ctx.fillStyle = rend.color
      ctx.beginPath()
      ctx.arc(screenX, screenY, rend.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  return { update }
}
