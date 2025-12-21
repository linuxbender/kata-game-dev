/**
 * Performance Monitor Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPerformanceMonitor, type QuadTreeStats } from './PerformanceMonitor'

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Mock performance.now
    vi.spyOn(performance, 'now').mockReturnValue(0)
  })

  describe('createPerformanceMonitor', () => {
    it('should create a performance monitor with default sample size', () => {
      const monitor = createPerformanceMonitor()
      
      expect(monitor).toBeDefined()
      expect(typeof monitor.startFrame).toBe('function')
      expect(typeof monitor.endFrame).toBe('function')
      expect(typeof monitor.recordSystemTime).toBe('function')
      expect(typeof monitor.getMetrics).toBe('function')
      expect(typeof monitor.reset).toBe('function')
    })

    it('should create a performance monitor with custom sample size', () => {
      const monitor = createPerformanceMonitor(120)
      
      expect(monitor).toBeDefined()
    })

    it('should return initial metrics with zero values', () => {
      const monitor = createPerformanceMonitor()
      const metrics = monitor.getMetrics()
      
      expect(metrics.fps).toBe(0)
      expect(metrics.avgFps).toBe(0)
      expect(metrics.minFps).toBe(0)
      expect(metrics.maxFps).toBe(0)
      expect(metrics.frameTime).toBe(0)
      expect(metrics.avgFrameTime).toBe(0)
      expect(metrics.entityCount).toBe(0)
      expect(metrics.systemTimings).toEqual([])
      expect(metrics.totalFrames).toBe(0)
    })
  })

  describe('Frame Tracking', () => {
    it('should track a single frame', () => {
      const monitor = createPerformanceMonitor()
      
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)    // startFrame
        .mockReturnValueOnce(16.67) // endFrame (60 FPS)
      
      monitor.startFrame()
      monitor.endFrame(10)
      
      const metrics = monitor.getMetrics()
      expect(metrics.fps).toBe(60)
      expect(metrics.frameTime).toBe(16.67)
      expect(metrics.entityCount).toBe(10)
      expect(metrics.totalFrames).toBe(1)
    })

    it('should track multiple frames', () => {
      const monitor = createPerformanceMonitor()
      
      // Frame 1: 16.67ms (60 FPS)
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67)
      monitor.startFrame()
      monitor.endFrame(10)
      
      // Frame 2: 16.67ms (60 FPS)
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(16.67)
        .mockReturnValueOnce(33.34)
      monitor.startFrame()
      monitor.endFrame(12)
      
      const metrics = monitor.getMetrics()
      expect(metrics.totalFrames).toBe(2)
      expect(metrics.avgFps).toBe(60)
    })

    it('should calculate average FPS over multiple frames', () => {
      const monitor = createPerformanceMonitor(3)
      
      // Frame 1: 16.67ms (60 FPS)
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67)
      monitor.startFrame()
      monitor.endFrame(10)
      
      // Frame 2: 33.34ms (30 FPS)
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(16.67)
        .mockReturnValueOnce(50.01)
      monitor.startFrame()
      monitor.endFrame(10)
      
      // Frame 3: 16.67ms (60 FPS)
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(50.01)
        .mockReturnValueOnce(66.68)
      monitor.startFrame()
      monitor.endFrame(10)
      
      const metrics = monitor.getMetrics()
      // Average frame time: (16.67 + 33.34 + 16.67) / 3 = 22.23ms
      // Average FPS: 1000 / 22.23 = ~45 FPS
      expect(metrics.avgFps).toBeGreaterThan(40)
      expect(metrics.avgFps).toBeLessThan(50)
    })

    it('should track min and max FPS', () => {
      const monitor = createPerformanceMonitor()
      
      // Frame 1: 16.67ms (60 FPS)
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67)
      monitor.startFrame()
      monitor.endFrame(10)
      
      // Frame 2: 33.34ms (30 FPS)
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(16.67)
        .mockReturnValueOnce(50.01)
      monitor.startFrame()
      monitor.endFrame(10)
      
      // Frame 3: 10ms (100 FPS)
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(50.01)
        .mockReturnValueOnce(60.01)
      monitor.startFrame()
      monitor.endFrame(10)
      
      const metrics = monitor.getMetrics()
      expect(metrics.minFps).toBe(30)
      expect(metrics.maxFps).toBe(100)
    })

    it('should limit frame time samples to sample size', () => {
      const monitor = createPerformanceMonitor(2)
      
      // Frame 1
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67)
      monitor.startFrame()
      monitor.endFrame(10)
      
      // Frame 2
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(16.67)
        .mockReturnValueOnce(33.34)
      monitor.startFrame()
      monitor.endFrame(10)
      
      // Frame 3 (should drop frame 1)
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(33.34)
        .mockReturnValueOnce(50.01)
      monitor.startFrame()
      monitor.endFrame(10)
      
      const metrics = monitor.getMetrics()
      // Only last 2 frames should be averaged
      expect(metrics.totalFrames).toBe(3)
    })
  })

  describe('System Timing', () => {
    it('should record system timings', () => {
      const monitor = createPerformanceMonitor()
      
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67)
      
      monitor.startFrame()
      monitor.recordSystemTime('movement', 2.5)
      monitor.recordSystemTime('render', 8.0)
      monitor.recordSystemTime('physics', 3.2)
      monitor.endFrame(10)
      
      const metrics = monitor.getMetrics()
      expect(metrics.systemTimings).toHaveLength(3)
      
      // Should be sorted by duration descending
      expect(metrics.systemTimings[0].name).toBe('render')
      expect(metrics.systemTimings[0].duration).toBe(8.0)
      expect(metrics.systemTimings[1].name).toBe('physics')
      expect(metrics.systemTimings[2].name).toBe('movement')
    })

    it('should calculate system timing percentages', () => {
      const monitor = createPerformanceMonitor()
      
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67)
      
      monitor.startFrame()
      monitor.recordSystemTime('movement', 5)
      monitor.recordSystemTime('render', 10)
      monitor.endFrame(10)
      
      const metrics = monitor.getMetrics()
      
      // Total: 15ms
      // render: 10/15 = 66.67%
      // movement: 5/15 = 33.33%
      expect(metrics.systemTimings[0].percentage).toBeCloseTo(66.67, 1)
      expect(metrics.systemTimings[1].percentage).toBeCloseTo(33.33, 1)
    })

    it('should clear system timings each frame', () => {
      const monitor = createPerformanceMonitor()
      
      // Frame 1
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67)
      monitor.startFrame()
      monitor.recordSystemTime('movement', 2.5)
      monitor.endFrame(10)
      
      // Frame 2 - no system timings
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(16.67)
        .mockReturnValueOnce(33.34)
      monitor.startFrame()
      monitor.endFrame(10)
      
      const metrics = monitor.getMetrics()
      expect(metrics.systemTimings).toHaveLength(0)
    })
  })

  describe('Entity Count', () => {
    it('should track entity count', () => {
      const monitor = createPerformanceMonitor()
      
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67)
      
      monitor.startFrame()
      monitor.endFrame(42)
      
      const metrics = monitor.getMetrics()
      expect(metrics.entityCount).toBe(42)
    })

    it('should update entity count each frame', () => {
      const monitor = createPerformanceMonitor()
      
      // Frame 1: 10 entities
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67)
      monitor.startFrame()
      monitor.endFrame(10)
      
      // Frame 2: 20 entities
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(16.67)
        .mockReturnValueOnce(33.34)
      monitor.startFrame()
      monitor.endFrame(20)
      
      const metrics = monitor.getMetrics()
      expect(metrics.entityCount).toBe(20)
    })
  })

  describe('QuadTree Stats', () => {
    it('should track QuadTree statistics', () => {
      const monitor = createPerformanceMonitor()
      
      const quadStats: QuadTreeStats = {
        nodes: 5,
        items: 42,
        avgItemsPerNode: 8.4,
        splits: 2,
        merges: 1,
        opCounter: 100,
        avgChildOccupancy: 0.75
      }
      
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67)
      
      monitor.startFrame()
      monitor.endFrame(42, quadStats)
      
      const metrics = monitor.getMetrics()
      expect(metrics.quadTreeStats).toEqual(quadStats)
    })

    it('should handle missing QuadTree stats', () => {
      const monitor = createPerformanceMonitor()
      
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67)
      
      monitor.startFrame()
      monitor.endFrame(10)
      
      const metrics = monitor.getMetrics()
      expect(metrics.quadTreeStats).toBeUndefined()
    })
  })

  describe('Memory Usage', () => {
    it('should get memory usage if available', () => {
      const monitor = createPerformanceMonitor()
      
      // Mock performance.memory
      const mockMemory = {
        usedJSHeapSize: 50 * 1024 * 1024, // 50 MB
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 2048 * 1024 * 1024
      }
      
      Object.defineProperty(performance, 'memory', {
        configurable: true,
        value: mockMemory
      })
      
      const memory = monitor.getMemoryUsage()
      expect(memory).toBe(50)
    })

    it('should return undefined if memory API not available', () => {
      const monitor = createPerformanceMonitor()
      
      // Ensure performance.memory is undefined
      Object.defineProperty(performance, 'memory', {
        configurable: true,
        value: undefined
      })
      
      const memory = monitor.getMemoryUsage()
      expect(memory).toBeUndefined()
    })
  })

  describe('Reset', () => {
    it('should reset all metrics', () => {
      const monitor = createPerformanceMonitor()
      
      // Record some data
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67)
      monitor.startFrame()
      monitor.recordSystemTime('movement', 2.5)
      monitor.endFrame(10)
      
      // Reset
      monitor.reset()
      
      const metrics = monitor.getMetrics()
      expect(metrics.fps).toBe(0)
      expect(metrics.avgFps).toBe(0)
      expect(metrics.minFps).toBe(0)
      expect(metrics.maxFps).toBe(0)
      expect(metrics.frameTime).toBe(0)
      expect(metrics.entityCount).toBe(0)
      expect(metrics.systemTimings).toEqual([])
      expect(metrics.totalFrames).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero frame time gracefully', () => {
      const monitor = createPerformanceMonitor()
      
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0) // Same time
      
      monitor.startFrame()
      monitor.endFrame(10)
      
      const metrics = monitor.getMetrics()
      expect(metrics.fps).toBe(0)
      expect(metrics.frameTime).toBe(0)
    })

    it('should handle very high FPS', () => {
      const monitor = createPerformanceMonitor()
      
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1) // 1ms frame = 1000 FPS
      
      monitor.startFrame()
      monitor.endFrame(10)
      
      const metrics = monitor.getMetrics()
      expect(metrics.fps).toBe(1000)
    })

    it('should handle very low FPS', () => {
      const monitor = createPerformanceMonitor()
      
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1000) // 1000ms frame = 1 FPS
      
      monitor.startFrame()
      monitor.endFrame(10)
      
      const metrics = monitor.getMetrics()
      expect(metrics.fps).toBe(1)
    })

    it('should handle no system timings', () => {
      const monitor = createPerformanceMonitor()
      
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67)
      
      monitor.startFrame()
      // No recordSystemTime calls
      monitor.endFrame(10)
      
      const metrics = monitor.getMetrics()
      expect(metrics.systemTimings).toEqual([])
    })
  })
})
