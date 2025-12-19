import {useEffect, useRef, useState} from 'react'

/**
 * Represents canvas or window dimensions
 * @property width Canvas width in logical pixels
 * @property height Canvas height in logical pixels
 */
export type Size = { width: number; height: number }

/**
 * React Hook for managing a canvas element with responsive behavior and high-DPI support
 *
 * Features:
 * - Automatic canvas resizing to match window dimensions
 * - High-DPI support via devicePixelRatio (retina displays)
 * - Debounced resize handling to reduce excessive updates
 * - Orientation change detection for mobile devices
 * - Media query monitoring for DPR changes
 * - Proper cleanup of event listeners and timeouts
 * - SSR-safe (checks for window before accessing)
 *
 * The canvas backing store is scaled by devicePixelRatio to ensure crisp rendering
 * on high-DPI displays while CSS styling uses logical pixels.
 *
 * @param initialWidth - Initial canvas width in pixels (defaults to window.innerWidth)
 * @param initialHeight - Initial canvas height in pixels (defaults to window.innerHeight)
 *
 * @returns Object containing:
 *   - canvasRef: React ref to attach to canvas element
 *   - canvasSize: Current canvas dimensions in logical pixels
 *   - ready: Flag indicating canvas is configured and ready
 *   - dpr: Current device pixel ratio (for renderer context scaling)
 *
 * @example
 * ```tsx
 * const CanvasComponent = () => {
 *   const { canvasRef, canvasSize, ready, dpr } = useCanvas(800, 600)
 *
 *   useEffect(() => {
 *     if (!ready) return
 *     const ctx = canvasRef.current?.getContext('2d')
 *     if (!ctx) return
 *
 *     // Scale context for high-DPI displays
 *     ctx.scale(dpr, dpr)
 *
 *     // Draw using logical pixels
 *     ctx.fillStyle = 'blue'
 *     ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)
 *   }, [ready, canvasSize, dpr])
 *
 *   return <canvas ref={canvasRef} />
 * }
 * ```
 */
export const useCanvas = (initialWidth = 0, initialHeight = 0) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    // Canvas dimensions in logical pixels (CSS size)
    const [canvasSize, setCanvasSize] = useState<Size>({
        width: initialWidth || (typeof window !== 'undefined' ? window.innerWidth : 300),
        height: initialHeight || (typeof window !== 'undefined' ? window.innerHeight : 150)
    })

    // Flag indicating canvas is fully configured and ready to render
    const [ready, setReady] = useState(false)

    // Device pixel ratio used at time of last resize
    // Used by renderer to scale drawing context for high-DPI displays
    const [dpr, setDpr] = useState<number>(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)

    useEffect(() => {
        let mq: MediaQueryList | null = null
        let resizeTimeout: number | null = null

        /**
         * Debounced handler for resize events
         * Prevents excessive canvas reconfigurations during continuous window resizing
         * Uses 100ms debounce delay for smooth transitions
         */
        const debouncedConfigure = () => {
            if (resizeTimeout !== null) {
                clearTimeout(resizeTimeout)
            }
            resizeTimeout = window.setTimeout(configure, 100) as unknown as number
        }

        /**
         * Main configuration function
         * - Updates canvas dimensions to match current viewport
         * - Scales canvas backing store for high-DPI displays
         * - Sets CSS styling for absolute positioning
         * - Monitors DPR changes via media queries
         */
        const configure = () => {
            const width = window.innerWidth
            const height = window.innerHeight
            const devicePixelRatio = window.devicePixelRatio || 1

            setCanvasSize({width, height})
            setDpr(devicePixelRatio)

            const c = canvasRef.current
            if (c) {
                // Position and visibility styling
                c.style.display = 'block'
                c.style.position = 'absolute'
                c.style.top = '0'
                c.style.left = '0'
                if (!c.style.backgroundColor) c.style.backgroundColor = '#07121a'

                // CSS size (logical pixels) - how the canvas appears on screen
                c.style.width = `${width}px`
                c.style.height = `${height}px`

                // Backing store size (physical pixels) - internal resolution for high-DPI
                c.width = Math.max(1, Math.floor(width * devicePixelRatio))
                c.height = Math.max(1, Math.floor(height * devicePixelRatio))
            }

            if (!ready) setReady(true)

            // Update media query listener for current DPR
            if (mq) {
                try {
                    mq.removeEventListener('change', configure)
                } catch (e) { /* old browsers */
                }
                mq = null
            }
            try {
                mq = window.matchMedia(`(resolution: ${devicePixelRatio}dppx)`)
                mq.addEventListener('change', configure)
            } catch (e) {
                // matchMedia may not support addEventListener in older browsers; ignore
            }
        }

        // Initial setup and attach event listeners
        configure()
        window.addEventListener('resize', debouncedConfigure)
        window.addEventListener('orientationchange', debouncedConfigure)

        // Cleanup function: remove listeners and cancel pending timeouts
        return () => {
            window.removeEventListener('resize', debouncedConfigure)
            window.removeEventListener('orientationchange', debouncedConfigure)
            if (resizeTimeout !== null) {
                clearTimeout(resizeTimeout)
            }
            if (mq) {
                try {
                    mq.removeEventListener('change', configure)
                } catch (e) { /* ignore */
                }
            }
        }
    }, [])

    return {canvasRef, canvasSize, ready, dpr}
}
