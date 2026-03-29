import type { Entity, World } from '@engine/ECS'
import { COMPONENTS } from '@engine/constants'
import { applyDeadZone, CameraConfig, computeSmoothing, DEFAULT_CAMERA_CONFIG, lerp } from './CameraConfig'
import { createEnemyVisualizationSystem } from './EnemyVisualizationSystem'
import { drawSprite, drawEntityHealthBar } from './SpriteRenderer'
import { drawBackground } from './BackgroundRenderer'

export type RenderOptions = {
  camera?: CameraConfig
  dpr?: number
  debug?: boolean
  /** Callback that returns the current level theme type (e.g. 'forest', 'cave', 'fortress') */
  getThemeType?: () => string
}

export type SpatialIndex = {
  query: (range: { x: number; y: number; w: number; h: number }) => { x: number; y: number; entity: number }[]
}

export type HudRenderer = (
  ctx: CanvasRenderingContext2D,
  world: World,
  camX: number, camY: number,
  viewW: number, viewH: number,
  dpr: number
) => void

/**
 * Render system factory.
 *
 * Draws level backgrounds, entity sprites, health bars,
 * and optional debug/HUD overlays to a canvas element.
 * Camera follows the player with smooth dead-zone + look-ahead.
 */
export const createRenderSystem = (
  canvas: HTMLCanvasElement,
  playerEntity?: Entity,
  options?: RenderOptions,
  spatialIndex?: SpatialIndex,
  debugOverlay?: any,
  hudRenderer?: HudRenderer
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

  // Accumulated time for sprite animations
  let totalTime = 0

  const update = (
    world: World,
    dt: number,
    canvasSize?: { width: number; height: number },
    spatialIndex?: any
  ) => {
    totalTime += dt

    dpr = options?.dpr ?? dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // ── Camera target ───────────────────────────────────────────────────────
    if (playerEntity !== undefined) {
      const t = world.getComponent(playerEntity, COMPONENTS.TRANSFORM)
      if (t) {
        let targetX = t.x
        let targetY = t.y
        if (cameraConfig.lookAheadFactor && cameraConfig.lookAheadFactor > 0) {
          const v = world.getComponent(playerEntity, COMPONENTS.VELOCITY)
          if (v) {
            targetX += v.vx * cameraConfig.lookAheadFactor * 0.5
            targetY += v.vy * cameraConfig.lookAheadFactor * 0.5
          }
        }
        camXTarget = targetX
        camYTarget = targetY
      }
    } else {
      const transforms = world.query(COMPONENTS.TRANSFORM)
      if (transforms.length) {
        const t0 = transforms[0].comps[0]
        camXTarget = t0.x
        camYTarget = t0.y
      }
    }

    const dzX = applyDeadZone(camX, camXTarget, cameraConfig.deadZoneRadius ?? 0)
    const dzY = applyDeadZone(camY, camYTarget, cameraConfig.deadZoneRadius ?? 0)
    const alpha = computeSmoothing(dt, cameraConfig.dampingSeconds ?? 0.12)
    camX = lerp(camX, dzX, alpha)
    camY = lerp(camY, dzY, alpha)

    const logicalW = canvas.width / dpr
    const logicalH = canvas.height / dpr
    ctx.clearRect(0, 0, logicalW, logicalH)

    const viewW = canvasSize ? canvasSize.width : logicalW
    const viewH = canvasSize ? canvasSize.height : logicalH

    // ── Level background ────────────────────────────────────────────────────
    const themeType = options?.getThemeType?.() ?? 'forest'
    drawBackground(ctx, themeType, camX, camY, viewW, viewH, totalTime)

    const halfW = viewW / 2
    const halfH = viewH / 2
    const minX = camX - halfW
    const maxX = camX + halfW
    const minY = camY - halfH
    const maxY = camY + halfH

    // ── Collect candidates ──────────────────────────────────────────────────
    let candidates: { x: number; y: number; entity: number }[] = []
    if (spatialIndex) {
      candidates = spatialIndex.query({ x: minX, y: minY, w: viewW, h: viewH })
    }

    // ── Draw entities ───────────────────────────────────────────────────────
    const drawEntity = (ent: number) => {
      const t    = world.getComponent(ent, COMPONENTS.TRANSFORM)
      const rend = world.getComponent(ent, COMPONENTS.RENDERABLE)
      if (!t || !rend) return

      const radius  = rend.size ?? rend.radius ?? 8
      const screenX = Math.round((t.x - camX) + viewW / 2)
      const screenY = Math.round((t.y - camY) + viewH / 2)

      drawSprite(ctx, rend.type ?? 'circle', screenX, screenY, radius, totalTime, rend.color)

      // Health bar above enemies / NPCs (not above the player)
      const meta = world.getComponent(ent, COMPONENTS.METADATA) as any
      if (meta && !meta.isPlayer) {
        const hp = world.getComponent(ent, COMPONENTS.HEALTH) as any
        if (hp) {
          drawEntityHealthBar(ctx, screenX, screenY, radius, hp.current, hp.max)
        }
      }
    }

    if (candidates.length) {
      for (const c of candidates) drawEntity(c.entity)
    } else {
      const renderables = world.query(COMPONENTS.TRANSFORM, COMPONENTS.RENDERABLE)
      for (const r of renderables) {
        const t    = r.comps[0]
        const rend = r.comps[1]
        const radius = rend.size ?? rend.radius ?? 8
        const s = radius
        if (t.x + s < minX || t.x - s > maxX || t.y + s < minY || t.y - s > maxY) continue
        drawEntity(r.entity)
      }
    }

    // ── Debug + enemy visualization ─────────────────────────────────────────
    if (debugOverlay?.isEnabled()) {
      debugOverlay.update(world, camX, camY, viewW, viewH, spatialIndex)
    }

    const enemyVisualizationSystem = createEnemyVisualizationSystem()
    enemyVisualizationSystem.update(ctx, world, camX, camY, viewW, viewH, dpr)

    // ── Optional canvas-space HUD ───────────────────────────────────────────
    if (hudRenderer) {
      ctx.save()
      hudRenderer(ctx, world, camX, camY, viewW, viewH, dpr)
      ctx.restore()
    }
  }

  return { update }
}
