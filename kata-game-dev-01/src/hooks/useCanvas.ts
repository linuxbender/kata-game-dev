import { useEffect, useRef, useState } from 'react'

export type Size = { width: number; height: number }

// Hook to manage a canvas ref and automatically resize it on window changes.
// Also supports high-DPI by adjusting the backing buffer using devicePixelRatio.
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
    const resize = () => {
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
    }

    // set initial size and attach listener
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return { canvasRef, canvasSize, ready, dpr }
}
