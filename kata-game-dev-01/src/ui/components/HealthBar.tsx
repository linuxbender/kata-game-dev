/**
 * HealthBar Component
 *
 * Displays a health bar with current/max health values.
 * Automatically updates when health changes using useComponentWatch.
 *
 * @example
 * ```tsx
 * <HealthBar entity={playerId} />
 * ```
 */

import React, { useEffect, useState } from 'react'
import { useWorld } from '@/contexts/GameStateContext'
import { useComponentWatch } from '../hooks'
import type { Entity } from '@engine/ECS'
import './HealthBar.css'

/**
 * HealthBar Props Interface.
 */
export interface HealthBarProps {
  /** Entity to display health for */
  entity: Entity | null

  /** Optional: Show numeric values (default: true) */
  showValues?: boolean

  /** Optional: Width in pixels (default: 200) */
  width?: number

  /** Optional: Height in pixels (default: 30) */
  height?: number

  /** Optional: Custom className */
  className?: string
}

/**
 * Health component type.
 */
interface Health {
  current: number
  max: number
}

/**
 * HealthBar Component.
 *
 * Displays player health with real-time updates.
 * Uses useComponentWatch to automatically re-render on health changes.
 *
 * @param props - HealthBar props
 * @returns HealthBar component
 *
 * @example
 * ```tsx
 * function PlayerHUD() {
 *   const playerId = usePlayerId()
 *   return <HealthBar entity={playerId} />
 * }
 * ```
 */
export function HealthBar({
  entity,
  showValues = true,
  width = 200,
  height = 30,
  className = '',
}: HealthBarProps) {
  const world = useWorld()
  const health = useComponentWatch<Health>(world, entity, 'Health')

  // Responsive: compact on small viewports
  const [isCompact, setIsCompact] = useState<boolean>(
    () => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
  )
  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Don't render if no health component
  if (!health) {
    return null
  }

  // Calculate percentage
  const percentage = Math.max(0, Math.min(100, (health.current / health.max) * 100))

  // Determine color based on health percentage
  const getHealthColor = (pct: number): string => {
    if (pct > 60) return '#4caf50' // Green
    if (pct > 30) return '#ff9800' // Orange
    return '#f44336' // Red
  }

  const healthColor = getHealthColor(percentage)

  // Determine state classes for animation and semantics
  const isLow = percentage <= 30
  const isEmpty = percentage === 0

  const fillClass = `health-bar-fill${isLow ? ' low' : ''}${isEmpty ? ' empty' : ''}`

  const containerClass = `health-bar ${isCompact ? 'compact' : ''} ${className}`.trim()

  return (
    <div
      className={containerClass}
      style={{ width: `${width}px`, height: `${height}px` }}
      role="status"
      aria-label={`Health: ${Math.ceil(health.current)} of ${health.max}`}
      aria-live="polite"
    >
      <div className="health-bar-background" />

      <div
        className={fillClass}
        style={{
          width: `${percentage}%`,
          backgroundColor: healthColor,
        }}
      />

      {showValues && (
        <div className="health-bar-text">
          {Math.ceil(health.current)} / {health.max}
        </div>
      )}
    </div>
  )
}

/**
 * Compact HealthBar variant for smaller displays.
 *
 * @param props - HealthBar props
 * @returns Compact HealthBar
 *
 * @example
 * ```tsx
 * <CompactHealthBar entity={enemyId} />
 * ```
 */
export function CompactHealthBar({
  entity,
  className = '',
}: Omit<HealthBarProps, 'showValues' | 'width' | 'height'>) {
  return (
    <HealthBar
      entity={entity}
      showValues={false}
      width={100}
      height={8}
      className={`compact ${className}`}
    />
  )
}
