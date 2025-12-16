// Enemy detection range visualization system
// Draws dashed circle showing enemy detection radius

import type { TypedWorld } from '@engine/componentTypes'
import { COMPONENTS } from '@engine/constants'
import type { EnemyComponent } from '@components/Enemy'

// Create visualization system for enemy detection ranges
export const createEnemyVisualizationSystem = () => {
  const update = (
    ctx: CanvasRenderingContext2D,
    world: TypedWorld,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    dpr: number
  ) => {
    // Query all enemies with transform
    const enemies = world.query(COMPONENTS.ENEMY, COMPONENTS.TRANSFORM)

    for (const e of enemies) {
      const enemy = e.comps[0] as EnemyComponent
      const transform = e.comps[1] as { x: number; y: number }

      // Draw detection range circle (dashed)
      drawDetectionRange(ctx, transform.x, transform.y, enemy.detectionRange, camX, camY, viewW, viewH, dpr)
    }
  }

  return { update }
}

// Draw dashed detection range circle
const drawDetectionRange = (
  ctx: CanvasRenderingContext2D,
  worldX: number,
  worldY: number,
  radius: number,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
  dpr: number
) => {
  // Convert world position to screen position
  const screenX = (worldX - camX) + viewW / 2
  const screenY = (worldY - camY) + viewH / 2

  // Check if circle is visible on screen
  if (
    screenX + radius < 0 ||
    screenX - radius > viewW ||
    screenY + radius < 0 ||
    screenY - radius > viewH
  ) {
    return // Off-screen, skip drawing
  }

  // Draw dashed circle (detection range)
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)'  // Semi-transparent red
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])  // Dashed pattern: 5px line, 5px gap
  ctx.beginPath()
  ctx.arc(screenX, screenY, radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])  // Reset dash pattern
  ctx.restore()

  // Draw small center dot
  ctx.save()
  ctx.fillStyle = 'rgba(255, 100, 100, 0.6)'
  ctx.beginPath()
  ctx.arc(screenX, screenY, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
