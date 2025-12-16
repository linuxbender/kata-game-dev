import type {Entity} from '@engine/ECS'
import type {TypedWorld} from '@engine/componentTypes'
import {COMPONENTS} from '@engine/constants'
import {applyDeadZone, CameraConfig, computeSmoothing, DEFAULT_CAMERA_CONFIG, lerp} from './CameraConfig'
import {createEnemyVisualizationSystem} from './EnemyVisualizationSystem'

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

export type HudRenderer = (ctx: CanvasRenderingContext2D, world: TypedWorld, camX: number, camY: number, viewW: number, viewH: number, dpr: number) => void

// Render system factory: draws entities with smooth camera follow (dead zone + predictive).
// Performs frustum culling and supports spatial indexing for large worlds.
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

    const cameraConfig = {...DEFAULT_CAMERA_CONFIG, ...options?.camera}
    let dpr = options?.dpr ?? 1

    // Camera state
    let camX = 0
    let camY = 0
    let camXTarget = 0
    let camYTarget = 0

    const update = (world: TypedWorld, dt: number, canvasSize?: {
        width: number;
        height: number
    }, spatialIndex?: any) => {
        // Update DPR and apply transform so drawing uses logical coordinates
        dpr = options?.dpr ?? dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        // Determine camera target position
        if (playerEntity !== undefined) {
            const t = world.getComponent(playerEntity, COMPONENTS.TRANSFORM)
            if (t) {
                // Apply look-ahead prediction if velocity is available
                let targetX = t.x
                let targetY = t.y

                if (cameraConfig.lookAheadFactor && cameraConfig.lookAheadFactor > 0) {
                    const v = world.getComponent(playerEntity, COMPONENTS.VELOCITY)
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
            const transforms = world.query(COMPONENTS.TRANSFORM)
            if (transforms.length) {
                const t0 = transforms[0].comps[0]
                camXTarget = t0.x
                camYTarget = t0.y
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
            candidates = spatialIndex.query({x: minX, y: minY, w: viewW, h: viewH})
        }

        if (candidates.length) {
            // Draw only candidate entities
            for (const c of candidates) {
                const ent = c.entity
                const t = world.getComponent(ent, COMPONENTS.TRANSFORM)
                const rend = world.getComponent(ent, COMPONENTS.RENDERABLE)
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
            const renderables = world.query(COMPONENTS.TRANSFORM, COMPONENTS.RENDERABLE)
            for (const r of renderables) {
                const t = r.comps[0]
                const rend = r.comps[1]

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

        // Draw enemy detection ranges
        const enemyVisualizationSystem = createEnemyVisualizationSystem()
        enemyVisualizationSystem.update(ctx, world, camX, camY, viewW, viewH, dpr)

        // Call optional HUD renderer (draw UI into canvas after scene)
        if (hudRenderer) {
            // Save/restore to avoid interfering with scene transforms
            ctx.save()
            // HUD should draw in logical pixels already (we've set transform earlier)
            hudRenderer(ctx, world, camX, camY, viewW, viewH, dpr)
            ctx.restore()
        }
    }

    return {update}
}
