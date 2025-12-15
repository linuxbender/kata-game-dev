import type { World, Entity } from '../ECS'
import { COMPONENTS } from '../constants'

// Render system: draws entities with Transform + Renderable onto a canvas
export const createRenderSystem = (canvas: HTMLCanvasElement, playerEntity?: Entity) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D context not available')

  const update = (world: World, _dt: number) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Camera center: follow player if provided, otherwise first Transform
    let camX = 0
    let camY = 0
    if (playerEntity !== undefined) {
      const t = world.getComponent<{ x: number; y: number }>(playerEntity, COMPONENTS.TRANSFORM)
      if (t) {
        camX = t.x
        camY = t.y
      }
    } else {
      const transforms = world.query([COMPONENTS.TRANSFORM])
      if (transforms.length) {
        camX = transforms[0].comps[0].x
        camY = transforms[0].comps[0].y
      }
    }

    const renderables = world.query([COMPONENTS.TRANSFORM, COMPONENTS.RENDERABLE])
    for (const r of renderables) {
      const t = r.comps[0] as { x: number; y: number }
      const rend = r.comps[1] as { color: string; size: number }
      const screenX = Math.round((t.x - camX) + canvas.width / 2)
      const screenY = Math.round((t.y - camY) + canvas.height / 2)
      ctx.fillStyle = rend.color
      ctx.beginPath()
      ctx.arc(screenX, screenY, rend.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  return { update }
}
