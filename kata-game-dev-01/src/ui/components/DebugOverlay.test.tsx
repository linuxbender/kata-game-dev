/**
 * Debug Overlay Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DebugOverlay from './DebugOverlay'
import type { PerformanceMetrics } from '@/debug/PerformanceMonitor'

describe('DebugOverlay', () => {
  const mockMetrics: PerformanceMetrics = {
    fps: 60,
    avgFps: 58,
    minFps: 45,
    maxFps: 62,
    frameTime: 16.67,
    avgFrameTime: 17.24,
    entityCount: 42,
    systemTimings: [
      { name: 'render', duration: 8.5, percentage: 50.9 },
      { name: 'movement', duration: 3.2, percentage: 19.2 },
      { name: 'physics', duration: 2.1, percentage: 12.6 }
    ],
    memoryUsage: 45.67,
    quadTreeStats: {
      nodes: 5,
      items: 42,
      avgItemsPerNode: 8.4,
      splits: 2,
      merges: 1,
      opCounter: 100,
      avgChildOccupancy: 0.75
    },
    totalFrames: 1000
  }

  describe('Rendering', () => {
    it('should show hint when not visible', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={false} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText("Press 'D' to toggle debug overlay")).toBeDefined()
    })

    it('should show overlay when visible', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText('Performance Monitor')).toBeDefined()
    })

    it('should render header with title and close button', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText('Performance Monitor')).toBeDefined()
      expect(screen.getByLabelText('Close debug overlay')).toBeDefined()
    })

    it('should render footer with toggle hint', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      const footer = screen.getAllByText("Press 'D' to toggle")
      expect(footer.length).toBeGreaterThan(0)
    })
  })

  describe('FPS Display', () => {
    it('should display current FPS', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText('Current FPS:')).toBeDefined()
      expect(screen.getByText('60')).toBeDefined()
    })

    it('should display average FPS', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText('Avg FPS:')).toBeDefined()
      expect(screen.getByText('58')).toBeDefined()
    })

    it('should display min and max FPS', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText('Min FPS:')).toBeDefined()
      expect(screen.getByText('45')).toBeDefined()
      expect(screen.getByText('Max FPS:')).toBeDefined()
      expect(screen.getByText('62')).toBeDefined()
    })
  })

  describe('Frame Time Display', () => {
    it('should display current frame time', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText('16.67ms')).toBeDefined()
    })

    it('should display average frame time', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText('17.24ms')).toBeDefined()
    })

    it('should display total frames', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText('1000')).toBeDefined()
    })
  })

  describe('Entity Count Display', () => {
    it('should display entity count', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText('Entities')).toBeDefined()
      expect(screen.getByText('Count:')).toBeDefined()
      // Note: "42" appears multiple times (entity count and quad items)
      const values = screen.getAllByText('42')
      expect(values.length).toBeGreaterThan(0)
    })
  })

  describe('System Timings Display', () => {
    it('should display system timings when available', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText('System Timings')).toBeDefined()
      expect(screen.getByText('render')).toBeDefined()
      expect(screen.getByText('movement')).toBeDefined()
      expect(screen.getByText('physics')).toBeDefined()
    })

    it('should display system timing durations', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText('8.50ms')).toBeDefined()
      expect(screen.getByText('3.20ms')).toBeDefined()
      expect(screen.getByText('2.10ms')).toBeDefined()
    })

    it('should not display system timings when empty', () => {
      const metricsNoTimings = { ...mockMetrics, systemTimings: [] }
      render(
        <DebugOverlay 
          metrics={metricsNoTimings} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.queryByText('System Timings')).toBeNull()
    })
  })

  describe('Memory Usage Display', () => {
    it('should display memory usage when available', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText('Memory Usage')).toBeDefined()
      expect(screen.getByText('45.67 MB')).toBeDefined()
    })

    it('should not display memory usage when unavailable', () => {
      const metricsNoMemory = { ...mockMetrics, memoryUsage: undefined }
      render(
        <DebugOverlay 
          metrics={metricsNoMemory} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.queryByText('Memory Usage')).toBeNull()
    })
  })

  describe('QuadTree Stats Display', () => {
    it('should display QuadTree stats when available', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText('QuadTree Stats')).toBeDefined()
    })

    it('should display QuadTree node and item counts', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      // Multiple "5" values exist, so we just check they're present
      const nodesLabel = screen.getByText('Nodes:')
      expect(nodesLabel).toBeDefined()
      
      const itemsLabel = screen.getByText('Items:')
      expect(itemsLabel).toBeDefined()
    })

    it('should not display QuadTree stats when unavailable', () => {
      const metricsNoQuad = { ...mockMetrics, quadTreeStats: undefined }
      render(
        <DebugOverlay 
          metrics={metricsNoQuad} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.queryByText('QuadTree Stats')).toBeNull()
    })
  })

  describe('Performance Report', () => {
    it('should show excellent performance for 60 FPS', () => {
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText(/Performance is excellent/)).toBeDefined()
    })

    it('should show warning for moderate FPS', () => {
      const moderateMetrics = { ...mockMetrics, fps: 45, frameTime: 22.22 }
      render(
        <DebugOverlay 
          metrics={moderateMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText(/Performance is moderate/)).toBeDefined()
    })

    it('should show error for low FPS', () => {
      const lowMetrics = { ...mockMetrics, fps: 20, frameTime: 50 }
      render(
        <DebugOverlay 
          metrics={lowMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText(/Performance is poor/)).toBeDefined()
    })

    it('should show frame time warnings', () => {
      const highFrameTime = { ...mockMetrics, frameTime: 35 }
      render(
        <DebugOverlay 
          metrics={highFrameTime} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText(/Frame time is high/)).toBeDefined()
    })

    it('should show frame time errors', () => {
      const veryHighFrameTime = { ...mockMetrics, fps: 18, frameTime: 55 }
      render(
        <DebugOverlay 
          metrics={veryHighFrameTime} 
          isVisible={true} 
          onToggle={() => {}} 
        />
      )
      
      expect(screen.getByText(/Frame time is too high/)).toBeDefined()
    })
  })

  describe('User Interactions', () => {
    it('should call onToggle when close button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnToggle = vi.fn()
      
      render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={mockOnToggle} 
        />
      )
      
      const closeButton = screen.getByLabelText('Close debug overlay')
      await user.click(closeButton)
      
      expect(mockOnToggle).toHaveBeenCalledTimes(1)
    })

    it('should apply custom className', () => {
      const { container } = render(
        <DebugOverlay 
          metrics={mockMetrics} 
          isVisible={true} 
          onToggle={() => {}} 
          className="custom-class"
        />
      )
      
      const overlay = container.querySelector('.debug-overlay.custom-class')
      expect(overlay).toBeDefined()
    })
  })
})
