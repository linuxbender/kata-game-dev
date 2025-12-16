import React, {useEffect, useRef, useState} from 'react'
import type {TypedWorld} from '@engine/componentTypes'
import {COMPONENTS, EVENT_TYPES} from '@engine/constants'
import type {Health} from '@components'
import type {HudRenderer} from '@engine/systems/RenderSystem'

// Smooth interpolation helper
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// Factory that returns a hud renderer function for the canvas.
// `getHealth` is called each frame to obtain the current Health (or null).
export const createCanvasHudRenderer = (getHealth: () => Health | null): HudRenderer => {
    let animatedPct = 1
    let animatedValue = 0
    return (ctx) => {
        const health = getHealth()
        if (!health) return
        const targetPct = Math.max(0, Math.min(1, health.current / health.max))
        animatedPct = lerp(animatedPct, targetPct, 0.12)
        animatedValue = Math.round(lerp(animatedValue, health.current, 0.12))

        const x = 12
        const y = 12
        const width = 140
        const height = 40

        // background box
        ctx.save()
        ctx.globalAlpha = 0.8
        ctx.fillStyle = 'black'
        ctx.fillRect(x, y, width, height)
        ctx.globalAlpha = 1

        ctx.fillStyle = '#fff'
        ctx.font = '12px sans-serif'
        ctx.fillText('HP', x + 6, y + 14)

        const barX = x + 6
        const barY = y + 18
        const barW = 120
        const barH = 12
        ctx.fillStyle = 'rgba(255,255,255,0.12)'
        ctx.fillRect(barX, barY, barW, barH)

        ctx.fillStyle = '#e74c3c'
        ctx.fillRect(barX, barY, barW * animatedPct, barH)

        ctx.fillStyle = '#fff'
        ctx.font = '11px sans-serif'
        ctx.fillText(`${animatedValue} / ${health.max}`, x + 6, y + 36)
        ctx.restore()
    }
}

// Combine multiple HudRenderer functions into one. Useful to render multiple
// component HUD elements (health, stamina, ammo) from a single render-system hook.
export const combineHudRenderers = (renderers: HudRenderer[]): HudRenderer => {
    return (ctx, world, camX, camY, viewW, viewH, dpr) => {
        for (const r of renderers) {
            try {
                r(ctx, world, camX, camY, viewW, viewH, dpr)
            } catch (e) { /* swallow to avoid breaking frame */
            }
        }
    }
}

// React HUD overlay — renders DOM HUD with smooth transitions.
export const HudOverlay: React.FC<{ world: TypedWorld | null; player: number | null }> = ({world, player}) => {
    const [displayValue, setDisplayValue] = useState<{ current: number; max: number } | null>(null)
    const targetRef = useRef<{ current: number; max: number } | null>(null)
    const animRef = useRef<number | null>(null)

    // Subscription to world Health events
    useEffect(() => {
        if (!world || player == null) return
        try {
            console.debug('[HUD] HudOverlay mounted for player', player)
        } catch {
        }
        // Initialize
        const init = world.getComponent(player, COMPONENTS.HEALTH)
        if (init) {
            targetRef.current = {current: init.current, max: init.max}
            setDisplayValue({current: init.current, max: init.max})
        }

        const unsub = world.onComponentEventFor(COMPONENTS.HEALTH, (ev) => {
            if (ev.entity !== player) return
            if (ev.type === EVENT_TYPES.ADD || ev.type === EVENT_TYPES.UPDATE) {
                targetRef.current = {current: ev.component.current, max: ev.component.max}
            } else {
                targetRef.current = null
            }
        })

        // Animation loop
        const tick = () => {
            const target = targetRef.current
            // Use functional updates to avoid stale closure over displayValue
            setDisplayValue((prev) => {
                if (!target) {
                    // If previously had a value, clear it; otherwise keep null
                    return prev !== null ? null : null
                }

                if (prev == null) {
                    // Immediately set to target when first available
                    return {current: target.current, max: target.max}
                }

                // Smoothly interpolate the numeric value
                const cur = prev.current
                const next = Math.round(lerp(cur, target.current, 0.12))
                if (next !== cur) return {current: next, max: target.max}
                return prev
            })

            animRef.current = requestAnimationFrame(tick)
        }
        animRef.current = requestAnimationFrame(tick)

        return () => {
            unsub()
            try {
                console.debug('[HUD] HudOverlay unmounted for player', player)
            } catch {
            }
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [world, player])

    // Don't render any DOM HUD until we have a health value; the canvas HUD
    // draws independently and prevents visual duplication.
    if (!displayValue) return null

    return (
        <div style={{minWidth: 140, padding: 6, background: 'rgba(0,0,0,0.4)', color: '#fff', borderRadius: 6}}>
            <div style={{fontSize: 12, marginBottom: 6}}>HP</div>
            <div style={{width: 120, height: 12, background: 'rgba(255,255,255,0.12)', borderRadius: 6}}>
                <div style={{
                    height: '100%',
                    width: `${(displayValue.current / displayValue.max) * 100}%`,
                    background: '#e74c3c',
                    borderRadius: 6,
                    transition: 'width 120ms linear'
                }}/>
            </div>
            <div style={{fontSize: 12, marginTop: 6}}>{displayValue.current} / {displayValue.max}</div>
        </div>
    )
}
