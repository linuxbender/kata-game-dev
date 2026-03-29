/**
 * HUDBar Component
 *
 * Bottom HUD bar displaying player stats, level info, and game time.
 * Uses useComponentWatch so health and XP update reactively.
 */

import React from 'react'
import './HUDBar.css'
import { useGameState } from '@/contexts/GameStateContext'
import { useComponentWatch } from '@ui/hooks'
import { COMPONENTS } from '@engine/constants'

interface Health {
  current: number
  max: number
}

interface CharacterStats {
  level: number
  experience: number
  experienceToNextLevel: number
}

export interface HUDBarProps {
  /** Current level name */
  levelName?: string
  /** Show experience bar (default: true) */
  showExperience?: boolean
  /** Show time display (default: true) */
  showTime?: boolean
}

/**
 * @example
 * ```tsx
 * <HUDBar levelName="Forest Clearing" />
 * ```
 */
const HUDBar: React.FC<HUDBarProps> = ({
  levelName,
  showExperience = true,
  showTime = true,
}) => {
  const { world, playerId } = useGameState()

  // Reactive: re-renders automatically when health or stats change
  const health = useComponentWatch<Health>(world, playerId, COMPONENTS.HEALTH)
  const stats = useComponentWatch<CharacterStats>(world, playerId, COMPONENTS.CHARACTER_STATS)

  const healthPercent = health ? Math.round((health.current / health.max) * 100) : 0
  const expPercent = stats ? Math.round((stats.experience / stats.experienceToNextLevel) * 100) : 0

  const worldTime = world ? world.getTime() : 0
  const minutes = Math.floor(worldTime / 60)
  const seconds = Math.floor(worldTime % 60)
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="hud-bar">
      {/* Left: player stats */}
      <div className="hud-bar-section hud-bar-left">
        <div className="hud-stat health-stat">
          <div className="stat-label">HP</div>
          <div className="stat-bar">
            <div className="stat-bar-fill health-fill" style={{ width: `${healthPercent}%` }} />
            <div className="stat-text">
              {health ? `${health.current} / ${health.max}` : 'N/A'}
            </div>
          </div>
        </div>

        {showExperience && stats && (
          <div className="hud-stat exp-stat">
            <div className="stat-label">Level {stats.level}</div>
            <div className="stat-bar">
              <div className="stat-bar-fill exp-fill" style={{ width: `${expPercent}%` }} />
              <div className="stat-text">
                {stats.experience} / {stats.experienceToNextLevel} XP
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Center: level name */}
      <div className="hud-bar-section hud-bar-center">
        {levelName && (
          <div className="level-display">
            <div className="level-icon">📍</div>
            <div className="level-name">{levelName}</div>
          </div>
        )}
      </div>

      {/* Right: game time */}
      <div className="hud-bar-section hud-bar-right">
        {showTime && (
          <div className="time-display">
            <div className="time-icon">⏱️</div>
            <div className="time-value">{timeString}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HUDBar
