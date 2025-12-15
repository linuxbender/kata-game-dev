// Debug overlay system: visualizes QuadTree structure and metrics

import type { World } from '../ECS'

export type DebugOverlayConfig = {
  enabled?: boolean
  drawNodeBounds?: boolean
  drawNodeLabels?: boolean
  textColor?: string
  lineColor?: string
  fontSize?: number
}

// Debug overlay for visualizing QuadTree and metrics
export const createDebugOverlay = (canvas: HTMLCanvasElement, config?: DebugOverlayConfig) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D context not available')

  const cfg = {
    enabled: config?.enabled ?? false,
    drawNodeBounds: config?.drawNodeBounds ?? true,
    drawNodeLabels: config?.drawNodeLabels ?? true,
    textColor: config?.textColor ?? '#00FF00',
    lineColor: config?.lineColor ?? '#00FF0080',
    fontSize: config?.fontSize ?? 12
  }

  // Toggle debug overlay on/off
  const toggle = () => {
    cfg.enabled = !cfg.enabled
    return cfg.enabled
  }

  // Update debug display with live metrics
  const update = (world: World, camX: number, camY: number, viewW: number, viewH: number, spatialIndex?: any) => {
    if (!cfg.enabled) return

    // Get metrics from spatial index (QuadTree) if available
    const metrics = spatialIndex && spatialIndex.getMetrics ? spatialIndex.getMetrics() : { nodes: 0, items: 0 }

    drawMetrics(ctx, canvas.width, canvas.height, metrics)
  }

  // Draw metrics on screen
  const drawMetrics = (
    context: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    metrics: any
  ) => {
    const padding = 10
    const lineHeight = 16
    const x = padding
    let y = padding

    // Draw semi-transparent background for readability
    context.fillStyle = 'rgba(0, 0, 0, 0.7)'
    const boxWidth = 280
    const boxHeight = 180
    context.fillRect(x, y, boxWidth, boxHeight)

    // Draw metrics text
    context.fillStyle = cfg.textColor
    context.font = '12px monospace'

    const metricsData = [
      `Nodes: ${metrics.nodes || 0}`,
      `Items: ${metrics.items || 0}`,
      `Avg Items/Node: ${metrics.avgItemsPerNode ? metrics.avgItemsPerNode.toFixed(2) : '0.00'}`,
      `Splits: ${metrics.splits || 0}`,
      `Merges: ${metrics.merges || 0}`,
      `Operations: ${metrics.opCounter || 0}`,
      `Avg Child Occ: ${metrics.avgChildOccupancy ? metrics.avgChildOccupancy.toFixed(2) : '0.00'}`
    ]

    metricsData.forEach((line, idx) => {
      context.fillText(line, x + 8, y + 20 + idx * lineHeight)
    })

    // Draw toggle hint at bottom
    context.fillStyle = '#FFFFFF'
    context.font = '10px monospace'
    context.fillText('Shift+D to toggle', x + 8, y + boxHeight - 10)
  }

  return {
    toggle,
    update,
    isEnabled: () => cfg.enabled
  }
}
