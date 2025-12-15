import { useEffect, useRef, useState } from 'react'

export type Size = { width: number; height: number }

// Hook to manage a canvas ref and automatically resize it on window changes.
export const useCanvas = (initialWidth = 0, initialHeight = 0) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [canvasSize, setCanvasSize] = useState<Size>({
    width: initialWidth || (typeof window !== 'undefined' ? window.innerWidth : 300),
    height: initialHeight || (typeof window !== 'undefined' ? window.innerHeight : 150)
  })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setCanvasSize({ width, height })
      const c = canvasRef.current
      if (c) {
        c.width = width
        c.height = height
      }
      if (!ready) setReady(true)
    }

    // set initial size and attach listener
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return { canvasRef, canvasSize, ready }
}
