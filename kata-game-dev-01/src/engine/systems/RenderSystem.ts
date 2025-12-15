import { World, Entity } from '../ECS'

export class RenderSystem {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private playerEntity?: Entity

  constructor(canvas: HTMLCanvasElement, playerEntity?: Entity) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D context not available')
    this.ctx = ctx
    this.playerEntity = playerEntity
  }

  update(world: World, _dt: number) {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    // camera: center on player if provided, otherwise on first Transform
    let camX = 0
    let camY = 0
    if (this.playerEntity !== undefined) {
      const t = world.getComponent<{ x: number; y: number }>(this.playerEntity, 'Transform')
      if (t) { camX = t.x; camY = t.y }
    } else {
      const transforms = world.query(['Transform'])
      if (transforms.length) { camX = transforms[0].comps[0].x; camY = transforms[0].comps[0].y }
    }

    const renderables = world.query(['Transform', 'Renderable'])
    for (const r of renderables) {
      const t = r.comps[0] as { x: number; y: number }
      const rend = r.comps[1] as { color: string; size: number }
      const screenX = Math.round((t.x - camX) + this.canvas.width / 2)
      const screenY = Math.round((t.y - camY) + this.canvas.height / 2)
      ctx.fillStyle = rend.color
      ctx.beginPath()
      ctx.arc(screenX, screenY, rend.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
