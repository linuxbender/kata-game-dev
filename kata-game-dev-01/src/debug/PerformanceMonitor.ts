/**
 * Performance Monitor
 * 
 * Tracks and reports game performance metrics including FPS,
 * entity count, system timings, memory usage, and QuadTree stats.
 * 
 * @example
 * ```ts
 * const monitor = createPerformanceMonitor()
 * 
 * // In game loop
 * monitor.startFrame()
 * monitor.recordSystemTime('movement', movementDuration)
 * monitor.recordSystemTime('render', renderDuration)
 * monitor.endFrame(entityCount, quadTreeStats)
 * 
 * // Get metrics
 * const metrics = monitor.getMetrics()
 * console.log(`FPS: ${metrics.fps}`)
 * ```
 */

export interface SystemTiming {
  /** System name */
  name: string
  /** Duration in milliseconds */
  duration: number
  /** Percentage of frame time */
  percentage: number
}

export interface QuadTreeStats {
  /** Number of nodes in the tree */
  nodes: number
  /** Number of items in the tree */
  items: number
  /** Average items per node */
  avgItemsPerNode: number
  /** Number of splits performed */
  splits: number
  /** Number of merges performed */
  merges: number
  /** Total operations counter */
  opCounter: number
  /** Average child occupancy */
  avgChildOccupancy: number
}

export interface PerformanceMetrics {
  /** Current frames per second */
  fps: number
  /** Average FPS over last N frames */
  avgFps: number
  /** Minimum FPS recorded */
  minFps: number
  /** Maximum FPS recorded */
  maxFps: number
  /** Current frame time in milliseconds */
  frameTime: number
  /** Average frame time in milliseconds */
  avgFrameTime: number
  /** Number of entities in the world */
  entityCount: number
  /** System timings breakdown */
  systemTimings: SystemTiming[]
  /** Memory usage in MB (if available) */
  memoryUsage?: number
  /** QuadTree statistics */
  quadTreeStats?: QuadTreeStats
  /** Total frames recorded */
  totalFrames: number
}

export interface PerformanceMonitor {
  /** Start tracking a new frame */
  startFrame: () => void
  
  /** End frame tracking and update metrics */
  endFrame: (entityCount: number, quadTreeStats?: QuadTreeStats) => void
  
  /** Record timing for a system */
  recordSystemTime: (systemName: string, duration: number) => void
  
  /** Get current performance metrics */
  getMetrics: () => PerformanceMetrics
  
  /** Reset all metrics */
  reset: () => void
  
  /** Get memory usage if available */
  getMemoryUsage: () => number | undefined
}

/**
 * Create a performance monitor
 * 
 * @param sampleSize - Number of frames to average (default: 60)
 * @returns Performance monitor instance
 * 
 * @example
 * ```ts
 * const monitor = createPerformanceMonitor(120) // Average over 120 frames
 * ```
 */
export const createPerformanceMonitor = (sampleSize: number = 60): PerformanceMonitor => {
  let frameStartTime = 0
  let lastFrameTime = 0
  let frameCount = 0
  let totalFrames = 0
  
  // Rolling window for FPS calculation
  const frameTimes: number[] = []
  let minFps = Infinity
  let maxFps = 0
  
  // System timings for current frame
  const currentSystemTimings: Map<string, number> = new Map()
  
  // Current metrics
  let currentEntityCount = 0
  let currentQuadTreeStats: QuadTreeStats | undefined
  
  /**
   * Start tracking a new frame
   */
  const startFrame = () => {
    frameStartTime = performance.now()
    currentSystemTimings.clear()
  }
  
  /**
   * End frame tracking and update metrics
   */
  const endFrame = (entityCount: number, quadTreeStats?: QuadTreeStats) => {
    const frameEndTime = performance.now()
    const frameTime = frameEndTime - frameStartTime
    
    // Update frame times
    frameTimes.push(frameTime)
    if (frameTimes.length > sampleSize) {
      frameTimes.shift()
    }
    
    // Calculate FPS
    const fps = frameTime > 0 ? 1000 / frameTime : 0
    minFps = Math.min(minFps, fps)
    maxFps = Math.max(maxFps, fps)
    
    // Update metrics
    currentEntityCount = entityCount
    currentQuadTreeStats = quadTreeStats
    lastFrameTime = frameTime
    frameCount++
    totalFrames++
  }
  
  /**
   * Record timing for a system
   */
  const recordSystemTime = (systemName: string, duration: number) => {
    currentSystemTimings.set(systemName, duration)
  }
  
  /**
   * Get memory usage if available (in MB)
   */
  const getMemoryUsage = (): number | undefined => {
    // @ts-ignore - performance.memory is not standard
    if (performance.memory) {
      // @ts-ignore
      return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100
    }
    return undefined
  }
  
  /**
   * Get current performance metrics
   */
  const getMetrics = (): PerformanceMetrics => {
    // Calculate average FPS
    const avgFrameTime = frameTimes.length > 0
      ? frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length
      : 0
    const avgFps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0
    const currentFps = lastFrameTime > 0 ? 1000 / lastFrameTime : 0
    
    // Build system timings with percentages
    const systemTimings: SystemTiming[] = []
    const totalSystemTime = Array.from(currentSystemTimings.values())
      .reduce((sum, time) => sum + time, 0)
    
    for (const [name, duration] of currentSystemTimings) {
      systemTimings.push({
        name,
        duration,
        percentage: totalSystemTime > 0 ? (duration / totalSystemTime) * 100 : 0
      })
    }
    
    // Sort by duration descending
    systemTimings.sort((a, b) => b.duration - a.duration)
    
    return {
      fps: Math.round(currentFps),
      avgFps: Math.round(avgFps),
      minFps: Math.round(minFps === Infinity ? 0 : minFps),
      maxFps: Math.round(maxFps),
      frameTime: Math.round(lastFrameTime * 100) / 100,
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      entityCount: currentEntityCount,
      systemTimings,
      memoryUsage: getMemoryUsage(),
      quadTreeStats: currentQuadTreeStats,
      totalFrames
    }
  }
  
  /**
   * Reset all metrics
   */
  const reset = () => {
    frameStartTime = 0
    lastFrameTime = 0
    frameCount = 0
    totalFrames = 0
    frameTimes.length = 0
    minFps = Infinity
    maxFps = 0
    currentSystemTimings.clear()
    currentEntityCount = 0
    currentQuadTreeStats = undefined
  }
  
  return {
    startFrame,
    endFrame,
    recordSystemTime,
    getMetrics,
    reset,
    getMemoryUsage
  }
}
