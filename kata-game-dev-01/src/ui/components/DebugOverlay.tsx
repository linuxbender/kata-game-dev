/**
 * Debug Overlay Component
 * 
 * Displays performance metrics and debug information in a toggleable overlay.
 * Shows FPS, entity count, system timings, memory usage, and QuadTree statistics.
 * 
 * @example
 * ```tsx
 * <DebugOverlay 
 *   metrics={performanceMetrics}
 *   isVisible={showDebug}
 *   onToggle={() => setShowDebug(!showDebug)}
 * />
 * ```
 */

import React from 'react'
import './DebugOverlay.css'
import type { PerformanceMetrics } from '@/debug/PerformanceMonitor'

/**
 * DebugOverlay props
 */
export interface DebugOverlayProps {
  /** Performance metrics to display */
  metrics: PerformanceMetrics
  
  /** Whether the overlay is visible */
  isVisible: boolean
  
  /** Toggle visibility callback */
  onToggle: () => void
  
  /** Show QuadTree visualization (optional) */
  showQuadTreeViz?: boolean
  
  /** Additional CSS class */
  className?: string
}

/**
 * Format milliseconds to readable string
 */
const formatMs = (ms: number): string => {
  return ms.toFixed(2) + 'ms'
}

/**
 * Format percentage to readable string
 */
const formatPercent = (percent: number): string => {
  return percent.toFixed(1) + '%'
}

/**
 * Format memory to readable string
 */
const formatMemory = (mb: number): string => {
  return mb.toFixed(2) + ' MB'
}

/**
 * Get FPS color based on performance
 */
const getFpsColor = (fps: number): string => {
  if (fps >= 55) return '#00ff00'
  if (fps >= 30) return '#ffff00'
  return '#ff0000'
}

/**
 * Get frame time color based on performance
 */
const getFrameTimeColor = (frameTime: number): string => {
  if (frameTime <= 20) return '#00ff00'
  if (frameTime <= 33) return '#ffff00'
  return '#ff0000'
}

/**
 * DebugOverlay Component
 * 
 * Displays comprehensive performance and debugging information.
 * Toggle visibility with the 'D' key.
 */
export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  metrics,
  isVisible,
  onToggle,
  showQuadTreeViz = false,
  className = ''
}) => {
  if (!isVisible) {
    return (
      <div className="debug-overlay-hint">
        <span>Press 'D' to toggle debug overlay</span>
      </div>
    )
  }

  const fpsColor = getFpsColor(metrics.fps)
  const frameTimeColor = getFrameTimeColor(metrics.frameTime)

  return (
    <div className={`debug-overlay ${className}`}>
      <div className="debug-overlay-header">
        <h3>Performance Monitor</h3>
        <button 
          className="debug-overlay-close"
          onClick={onToggle}
          aria-label="Close debug overlay"
        >
          ×
        </button>
      </div>

      <div className="debug-overlay-content">
        {/* FPS Section */}
        <div className="debug-section">
          <h4>Frame Rate</h4>
          <div className="debug-metrics">
            <div className="debug-metric">
              <span className="metric-label">Current FPS:</span>
              <span className="metric-value" style={{ color: fpsColor }}>
                {metrics.fps}
              </span>
            </div>
            <div className="debug-metric">
              <span className="metric-label">Avg FPS:</span>
              <span className="metric-value">{metrics.avgFps}</span>
            </div>
            <div className="debug-metric">
              <span className="metric-label">Min FPS:</span>
              <span className="metric-value">{metrics.minFps}</span>
            </div>
            <div className="debug-metric">
              <span className="metric-label">Max FPS:</span>
              <span className="metric-value">{metrics.maxFps}</span>
            </div>
          </div>
        </div>

        {/* Frame Time Section */}
        <div className="debug-section">
          <h4>Frame Time</h4>
          <div className="debug-metrics">
            <div className="debug-metric">
              <span className="metric-label">Current:</span>
              <span className="metric-value" style={{ color: frameTimeColor }}>
                {formatMs(metrics.frameTime)}
              </span>
            </div>
            <div className="debug-metric">
              <span className="metric-label">Average:</span>
              <span className="metric-value">{formatMs(metrics.avgFrameTime)}</span>
            </div>
            <div className="debug-metric">
              <span className="metric-label">Total Frames:</span>
              <span className="metric-value">{metrics.totalFrames}</span>
            </div>
          </div>
        </div>

        {/* Entity Count Section */}
        <div className="debug-section">
          <h4>Entities</h4>
          <div className="debug-metrics">
            <div className="debug-metric">
              <span className="metric-label">Count:</span>
              <span className="metric-value">{metrics.entityCount}</span>
            </div>
          </div>
        </div>

        {/* System Timings Section */}
        {metrics.systemTimings.length > 0 && (
          <div className="debug-section">
            <h4>System Timings</h4>
            <div className="debug-timings">
              {metrics.systemTimings.map((timing, index) => (
                <div key={index} className="debug-timing-item">
                  <div className="timing-header">
                    <span className="timing-name">{timing.name}</span>
                    <span className="timing-values">
                      <span className="timing-duration">{formatMs(timing.duration)}</span>
                      <span className="timing-percentage">({formatPercent(timing.percentage)})</span>
                    </span>
                  </div>
                  <div className="timing-bar">
                    <div 
                      className="timing-bar-fill"
                      style={{ width: `${timing.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memory Usage Section */}
        {metrics.memoryUsage !== undefined && (
          <div className="debug-section">
            <h4>Memory Usage</h4>
            <div className="debug-metrics">
              <div className="debug-metric">
                <span className="metric-label">Heap Used:</span>
                <span className="metric-value">{formatMemory(metrics.memoryUsage)}</span>
              </div>
            </div>
          </div>
        )}

        {/* QuadTree Stats Section */}
        {metrics.quadTreeStats && (
          <div className="debug-section">
            <h4>QuadTree Stats</h4>
            <div className="debug-metrics">
              <div className="debug-metric">
                <span className="metric-label">Nodes:</span>
                <span className="metric-value">{metrics.quadTreeStats.nodes}</span>
              </div>
              <div className="debug-metric">
                <span className="metric-label">Items:</span>
                <span className="metric-value">{metrics.quadTreeStats.items}</span>
              </div>
              <div className="debug-metric">
                <span className="metric-label">Avg Items/Node:</span>
                <span className="metric-value">
                  {metrics.quadTreeStats.avgItemsPerNode.toFixed(2)}
                </span>
              </div>
              <div className="debug-metric">
                <span className="metric-label">Splits:</span>
                <span className="metric-value">{metrics.quadTreeStats.splits}</span>
              </div>
              <div className="debug-metric">
                <span className="metric-label">Merges:</span>
                <span className="metric-value">{metrics.quadTreeStats.merges}</span>
              </div>
              <div className="debug-metric">
                <span className="metric-label">Operations:</span>
                <span className="metric-value">{metrics.quadTreeStats.opCounter}</span>
              </div>
              <div className="debug-metric">
                <span className="metric-label">Avg Child Occ:</span>
                <span className="metric-value">
                  {formatPercent(metrics.quadTreeStats.avgChildOccupancy * 100)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Performance Report */}
        <div className="debug-section debug-report">
          <h4>Performance Report</h4>
          <div className="debug-report-content">
            {metrics.fps >= 55 && metrics.frameTime < 20 && (
              <div className="report-item report-good">
                ✓ Performance is excellent (60 FPS target met)
              </div>
            )}
            {metrics.fps >= 30 && metrics.fps < 55 && (
              <div className="report-item report-warning">
                ⚠ Performance is moderate (below 60 FPS target)
              </div>
            )}
            {metrics.fps < 30 && (
              <div className="report-item report-bad">
                ✗ Performance is poor (below 30 FPS)
              </div>
            )}
            {metrics.frameTime < 20 && (
              <div className="report-item report-good">
                ✓ Frame time is excellent ({'<'}20ms)
              </div>
            )}
            {metrics.frameTime >= 33 && (
              <div className="report-item report-warning">
                ⚠ Frame time is high ({'>'}33ms)
              </div>
            )}
            {metrics.frameTime >= 50 && (
              <div className="report-item report-bad">
                ✗ Frame time is too high ({'>'}50ms)
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="debug-overlay-footer">
        <span>Press 'D' to toggle</span>
      </div>
    </div>
  )
}

export default DebugOverlay
