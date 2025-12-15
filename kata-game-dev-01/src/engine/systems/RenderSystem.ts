import type { World, Entity } from '../ECS'
import { COMPONENTS } from '../constants'
import { CameraConfig, DEFAULT_CAMERA_CONFIG, computeSmoothing, lerp, applyDeadZone } from './CameraConfig'
import { createDebugOverlay } from './DebugOverlay'

export type RenderOptions = {
  // Camera configuration for smooth follow behavior
  camera?: CameraConfig
  dpr?: number
  // Enable debug overlay (draws QuadTree nodes and metrics)
  debug?: boolean
}

export type SpatialIndex = {
  query: (range: { x: number; y: number; w: number; h: number }) => { x: number; y: number; entity: number }[]
}

// Render system factory: draws entities with smooth camera follow (dead zone + predictive).
// Performs frustum culling and supports spatial indexing for large worlds.
export const createRenderSystem = (
  canvas: HTMLCanvasElement,
  playerEntity?: Entity,
  options?: RenderOptions,
  spatialIndex?: SpatialIndex,
  debugOverlay?: any
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D context not available')

  const cameraConfig = { ...DEFAULT_CAMERA_CONFIG, ...options?.camera }
  let dpr = options?.dpr ?? 1

  // Camera state
  let camX = 0
  let camY = 0
  let camXTarget = 0
  let camYTarget = 0

  const update = (world: World, dt: number, canvasSize?: { width: number; height: number }, spatialIndex?: any) => {
    // Update DPR and apply transform so drawing uses logical coordinates
    dpr = options?.dpr ?? dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Determine camera target position
    if (playerEntity !== undefined) {
      const t = world.getComponent<{ x: number; y: number }>(playerEntity, COMPONENTS.TRANSFORM)
      if (t) {
        // Apply look-ahead prediction if velocity is available
        let targetX = t.x
        let targetY = t.y

        if (cameraConfig.lookAheadFactor && cameraConfig.lookAheadFactor > 0) {
          const v = world.getComponent<{ vx: number; vy: number }>(playerEntity, COMPONENTS.VELOCITY)
          if (v) {
            // Add velocity-based offset for predictive camera (1-3 frames ahead)
            const lookAheadDistance = 0.5 // Adjust for desired look-ahead effect
            targetX += v.vx * cameraConfig.lookAheadFactor * lookAheadDistance
            targetY += v.vy * cameraConfig.lookAheadFactor * lookAheadDistance
          }
        }

        camXTarget = targetX
        camYTarget = targetY
      }
    } else {
      const transforms = world.query([COMPONENTS.TRANSFORM])
      if (transforms.length) {
        camXTarget = transforms[0].comps[0].x
        camYTarget = transforms[0].comps[0].y
      }
    }

    // Apply dead zone to reduce micro-oscillations
    const dzX = applyDeadZone(camX, camXTarget, cameraConfig.deadZoneRadius ?? 0)
    const dzY = applyDeadZone(camY, camYTarget, cameraConfig.deadZoneRadius ?? 0)

    // Compute frame-rate independent smoothing alpha and lerp camera
    const alpha = computeSmoothing(dt, cameraConfig.dampingSeconds ?? 0.12)
    camX = lerp(camX, dzX, alpha)
    camY = lerp(camY, dzY, alpha)

    // Clear the canvas using logical dimensions (after applying DPR transform)
    const logicalW = canvas.width / dpr
    const logicalH = canvas.height / dpr
    ctx.clearRect(0, 0, logicalW, logicalH)

    // Determine view bounds in world coordinates (logical pixels)
    const viewW = canvasSize ? canvasSize.width : logicalW
    const viewH = canvasSize ? canvasSize.height : logicalH
    const halfW = viewW / 2
    const halfH = viewH / 2
    const minX = camX - halfW
    const maxX = camX + halfW
    const minY = camY - halfH
    const maxY = camY + halfH

    // If a spatial index is provided, query it for candidate entities inside the view rect
    let candidates: { x: number; y: number; entity: number }[] = []
    if (spatialIndex) {
      candidates = spatialIndex.query({ x: minX, y: minY, w: viewW, h: viewH })
    }

    if (candidates.length) {
      // Draw only candidate entities
      for (const c of candidates) {
        const ent = c.entity
        const t = world.getComponent<{ x: number; y: number }>(ent, COMPONENTS.TRANSFORM)
        const rend = world.getComponent<{ color: string; size: number }>(ent, COMPONENTS.RENDERABLE)
        if (!t || !rend) continue

        const screenX = Math.round((t.x - camX) + viewW / 2)
        const screenY = Math.round((t.y - camY) + viewH / 2)
        ctx.fillStyle = rend.color
        ctx.beginPath()
        ctx.arc(screenX, screenY, rend.size, 0, Math.PI * 2)
        ctx.fill()
      }
    } else {
      // Fallback: query all renderables from world (useful for small scenes)
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

    // Draw debug overlay after entities if enabled (pass spatialIndex for metrics)
    if (debugOverlay && debugOverlay.isEnabled()) {
      debugOverlay.update(world, camX, camY, viewW, viewH, spatialIndex)
    }
  }

  return { update }
}
