/**
 * HUDBar Component
 * 
 * Bottom HUD bar displaying player stats, hotbar, and level info
 */

import React from 'react'
import './HUDBar.css'
import { useGameState } from '@/contexts/GameStateContext'
import { COMPONENTS } from '@engine/constants'

/**
 * HUDBar props
 */
export interface HUDBarProps {
  /** Player entity ID */
  playerId: number | null
  /** Current level name */
  levelName?: string
  /** Show experience bar */
  showExperience?: boolean
  /** Show time display */
  showTime?: boolean
}

/**
 * HUDBar Component
 * 
 * Displays player health, experience, level info, and game time
 * 
 * @example
 * ```tsx
 * <HUDBar playerId={player} levelName="Forest Clearing" />
 * ```
 */
const HUDBar: React.FC<HUDBarProps> = ({
  playerId,
  levelName,
  showExperience = true,
  showTime = true
}) => {
  const { world } = useGameState()
  
  // Get player components
  const health = playerId && world ? world.getComponent(playerId, COMPONENTS.HEALTH) : null
  const stats = playerId && world ? world.getComponent(playerId, COMPONENTS.CHARACTER_STATS) : null
  
  // Calculate health percentage
  const healthPercent = health ? Math.round((health.current / health.max) * 100) : 0
  
  // Calculate experience percentage
  const expPercent = stats ? Math.round((stats.experience / stats.experienceToNextLevel) * 100) : 0
  
  // Format time display (world time in seconds)
  const worldTime = world ? world.getTime() : 0
  const minutes = Math.floor(worldTime / 60)
  const seconds = Math.floor(worldTime % 60)
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  
  return (
    <div className="hud-bar">
      {/* Left section: Player stats */}
      <div className="hud-bar-section hud-bar-left">
        {/* Health */}
        <div className="hud-stat health-stat">
          <div className="stat-label">HP</div>
          <div className="stat-bar">
            <div 
              className="stat-bar-fill health-fill"
              style={{ width: `${healthPercent}%` }}
            />
            <div className="stat-text">
              {health ? `${health.current} / ${health.max}` : 'N/A'}
            </div>
          </div>
        </div>
        
        {/* Experience (if enabled and stats available) */}
        {showExperience && stats && (
          <div className="hud-stat exp-stat">
            <div className="stat-label">Level {stats.level}</div>
            <div className="stat-bar">
              <div 
                className="stat-bar-fill exp-fill"
                style={{ width: `${expPercent}%` }}
              />
              <div className="stat-text">
                {stats.experience} / {stats.experienceToNextLevel} XP
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Center section: Level info */}
      <div className="hud-bar-section hud-bar-center">
        {levelName && (
          <div className="level-display">
            <div className="level-icon">📍</div>
            <div className="level-name">{levelName}</div>
          </div>
        )}
      </div>
      
      {/* Right section: Time and mini-stats */}
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
