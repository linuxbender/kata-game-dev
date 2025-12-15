import type { World, Entity } from '../ECS'
import { COMPONENTS } from '../constants'

export type RenderOptions = {
  smoothing?: number // 0..1, higher means slower follow
  dpr?: number
}

// Render system factory: draws entities and follows the player smoothly.
export const createRenderSystem = (canvas: HTMLCanvasElement, playerEntity?: Entity, options?: RenderOptions) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D context not available')

  const smoothing = options?.smoothing ?? 0.15
  let dpr = options?.dpr ?? 1

  // Camera target position and current (for smoothing)
  let camX = 0
  let camY = 0
  let camXTarget = 0
  let camYTarget = 0

  const update = (world: World, _dt: number) => {
    // Update DPR if provided; apply transform so drawing uses logical coordinates
    dpr = options?.dpr ?? dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Determine camera target: player's transform or first transform
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

    // Smoothly move camera toward target using linear interpolation
    camX += (camXTarget - camX) * smoothing
    camY += (camYTarget - camY) * smoothing

    // Clear using physical pixels but coordinates are logical due to transform
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw renderables
    const renderables = world.query([COMPONENTS.TRANSFORM, COMPONENTS.RENDERABLE])
    for (const r of renderables) {
      const t = r.comps[0] as { x: number; y: number }
      const rend = r.comps[1] as { color: string; size: number }
      // Convert world position to screen position (logical pixels)
      const screenX = Math.round((t.x - camX) + (canvas.width / dpr) / 2)
      const screenY = Math.round((t.y - camY) + (canvas.height / dpr) / 2)
      ctx.fillStyle = rend.color
      ctx.beginPath()
      ctx.arc(screenX, screenY, rend.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  return { update }
}
