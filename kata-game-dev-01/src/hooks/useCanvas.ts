import { useEffect, useRef, useState } from 'react'

export type Size = { width: number; height: number }

// Hook to manage a canvas ref with automatic resize, high-DPI support, and debounced updates.
// Handles window resize events, DPR changes, and orientation changes with proper cleanup.
export const useCanvas = (initialWidth = 0, initialHeight = 0) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [canvasSize, setCanvasSize] = useState<Size>({
    width: initialWidth || (typeof window !== 'undefined' ? window.innerWidth : 300),
    height: initialHeight || (typeof window !== 'undefined' ? window.innerHeight : 150)
  })
  const [ready, setReady] = useState(false)

  // device pixel ratio at time of resize; returned so renderer can set context transform
  const [dpr, setDpr] = useState<number>(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)

  useEffect(() => {
    let mq: MediaQueryList | null = null
    let resizeTimeout: number | null = null

    // Debounced resize handler to avoid excessive reconfigurations
    const debouncedConfigure = () => {
      if (resizeTimeout !== null) {
        clearTimeout(resizeTimeout)
      }
      resizeTimeout = window.setTimeout(configure, 100) as unknown as number
    }

    const configure = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const devicePixelRatio = window.devicePixelRatio || 1

      setCanvasSize({ width, height })
      setDpr(devicePixelRatio)

      const c = canvasRef.current
      if (c) {
        // Set CSS size (logical pixels)
        c.style.width = `${width}px`
        c.style.height = `${height}px`
        // Set backing store size (physical pixels)
        c.width = Math.max(1, Math.floor(width * devicePixelRatio))
        c.height = Math.max(1, Math.floor(height * devicePixelRatio))
      }

      if (!ready) setReady(true)

      // Remove previous media query listener and create a new one for current DPR
      if (mq) {
        try { mq.removeEventListener('change', configure) } catch (e) { /* old browsers */ }
        mq = null
      }
      try {
        mq = window.matchMedia(`(resolution: ${devicePixelRatio}dppx)`)
        mq.addEventListener('change', configure)
      } catch (e) {
        // matchMedia may not support addEventListener in older browsers; ignore
      }
    }

    // initial configuration and attach window resize
    configure()
    // Use debounced resize to avoid excessive updates during window dragging
    window.addEventListener('resize', debouncedConfigure)
    // Listen for orientation changes (important on mobile)
    window.addEventListener('orientationchange', debouncedConfigure)

    return () => {
      window.removeEventListener('resize', debouncedConfigure)
      window.removeEventListener('orientationchange', debouncedConfigure)
      if (resizeTimeout !== null) {
        clearTimeout(resizeTimeout)
      }
      if (mq) {
        try { mq.removeEventListener('change', configure) } catch (e) { /* ignore */ }
      }
    }
  }, [])

  return { canvasRef, canvasSize, ready, dpr }
}
