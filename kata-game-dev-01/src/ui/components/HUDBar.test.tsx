import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { ReactiveWorld } from '@engine/ReactiveWorld'
import { GameStateProvider } from '@/contexts/GameStateContext'
import HUDBar from './HUDBar'
import type { Entity } from '@engine/ECS'
import { COMPONENTS } from '@engine/constants'

describe('HUDBar', () => {
  let world: ReactiveWorld
  let entity: Entity

  beforeEach(() => {
    world = new ReactiveWorld()
    entity = world.createEntity()
  })

  afterEach(() => {
    cleanup()
    world.clearAllListeners()
  })

  const renderWithProvider = (component: React.ReactElement) => {
    let result: ReturnType<typeof render>
    act(() => {
      result = render(
        <GameStateProvider world={world} playerId={entity}>
          {component}
        </GameStateProvider>
      )
    })
    return result!
  }

  describe('Basic Rendering', () => {
    it('should render HUD bar container', () => {
      const { container } = renderWithProvider(<HUDBar playerId={entity} />)
      
      const hudBar = container.querySelector('.hud-bar')
      expect(hudBar).toBeDefined()
    })

    it('should render without player stats when components missing', () => {
      const { container } = renderWithProvider(<HUDBar playerId={entity} />)
      
      const hudBar = container.querySelector('.hud-bar')
      expect(hudBar).toBeDefined()
    })

    it('should render with null player', () => {
      const { container } = renderWithProvider(<HUDBar playerId={null} />)
      
      const hudBar = container.querySelector('.hud-bar')
      expect(hudBar).toBeDefined()
    })
  })

  describe('Health Display', () => {
    it('should display health bar when health component exists', () => {
      world.addComponent(entity, COMPONENTS.HEALTH, { current: 100, max: 100 })

      renderWithProvider(<HUDBar playerId={entity} />)

      expect(screen.getByText('100 / 100')).toBeDefined()
    })

    it('should display current and max health correctly', () => {
      world.addComponent(entity, COMPONENTS.HEALTH, { current: 75, max: 150 })

      renderWithProvider(<HUDBar playerId={entity} />)

      expect(screen.getByText('75 / 150')).toBeDefined()
    })

    it('should display N/A when no health component', () => {
      renderWithProvider(<HUDBar playerId={entity} />)

      expect(screen.getByText('N/A')).toBeDefined()
    })

    it('should show correct health percentage in progress bar', () => {
      world.addComponent(entity, COMPONENTS.HEALTH, { current: 50, max: 100 })

      const { container } = renderWithProvider(<HUDBar playerId={entity} />)

      const healthFill = container.querySelector('.health-fill') as HTMLElement
      expect(healthFill?.style.width).toBe('50%')
    })
  })

  describe('Experience Display', () => {
    it('should display experience bar when stats exist and showExperience is true', () => {
      world.addComponent(entity, COMPONENTS.CHARACTER_STATS, {
        level: 5,
        experience: 250,
        experienceToNextLevel: 500,
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        vitality: 10
      })

      renderWithProvider(<HUDBar playerId={entity} showExperience={true} />)

      expect(screen.getByText('Level 5')).toBeDefined()
      expect(screen.getByText('250 / 500 XP')).toBeDefined()
    })

    it('should not display experience bar when showExperience is false', () => {
      world.addComponent(entity, COMPONENTS.CHARACTER_STATS, {
        level: 5,
        experience: 250,
        experienceToNextLevel: 500,
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        vitality: 10
      })

      renderWithProvider(<HUDBar playerId={entity} showExperience={false} />)

      expect(screen.queryByText('Level 5')).toBeNull()
    })

    it('should show correct experience percentage in progress bar', () => {
      world.addComponent(entity, COMPONENTS.CHARACTER_STATS, {
        level: 5,
        experience: 250,
        experienceToNextLevel: 1000,
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        vitality: 10
      })

      const { container } = renderWithProvider(<HUDBar playerId={entity} showExperience={true} />)

      const expFill = container.querySelector('.exp-fill') as HTMLElement
      expect(expFill?.style.width).toBe('25%')
    })
  })

  describe('Level Display', () => {
    it('should display level name when provided', () => {
      renderWithProvider(<HUDBar playerId={entity} levelName="Forest Clearing" />)

      expect(screen.getByText('Forest Clearing')).toBeDefined()
    })

    it('should not display level info when levelName is not provided', () => {
      const { container } = renderWithProvider(<HUDBar playerId={entity} />)

      const levelDisplay = container.querySelector('.level-display')
      expect(levelDisplay).toBeNull()
    })

    it('should display level icon', () => {
      renderWithProvider(<HUDBar playerId={entity} levelName="Dark Cave" />)

      const { container } = renderWithProvider(<HUDBar playerId={entity} levelName="Dark Cave" />)
      const levelIcon = container.querySelector('.level-icon')
      expect(levelIcon).toBeDefined()
    })
  })

  describe('Time Display', () => {
    it('should display time when showTime is true', () => {
      const { container } = renderWithProvider(<HUDBar playerId={entity} showTime={true} />)

      const timeDisplay = container.querySelector('.time-display')
      expect(timeDisplay).toBeDefined()
    })

    it('should not display time when showTime is false', () => {
      const { container } = renderWithProvider(<HUDBar playerId={entity} showTime={false} />)

      const timeDisplay = container.querySelector('.time-display')
      expect(timeDisplay).toBeNull()
    })

    it('should format time correctly (MM:SS)', () => {
      // Advance world time to 125 seconds (2:05)
      world.updateTime(125)
      
      renderWithProvider(<HUDBar playerId={entity} showTime={true} />)

      expect(screen.getByText('02:05')).toBeDefined()
    })

    it('should pad single digit minutes and seconds', () => {
      // Advance world time to 5 seconds (0:05)
      world.updateTime(5)
      
      renderWithProvider(<HUDBar playerId={entity} showTime={true} />)

      expect(screen.getByText('00:05')).toBeDefined()
    })
  })

  describe('Layout Sections', () => {
    it('should render left section for player stats', () => {
      const { container } = renderWithProvider(<HUDBar playerId={entity} />)

      const leftSection = container.querySelector('.hud-bar-left')
      expect(leftSection).toBeDefined()
    })

    it('should render center section for level info', () => {
      const { container } = renderWithProvider(<HUDBar playerId={entity} />)

      const centerSection = container.querySelector('.hud-bar-center')
      expect(centerSection).toBeDefined()
    })

    it('should render right section for time display', () => {
      const { container } = renderWithProvider(<HUDBar playerId={entity} />)

      const rightSection = container.querySelector('.hud-bar-right')
      expect(rightSection).toBeDefined()
    })
  })

  describe('Integration', () => {
    it('should display all components together', () => {
      world.addComponent(entity, COMPONENTS.HEALTH, { current: 80, max: 100 })
      world.addComponent(entity, COMPONENTS.CHARACTER_STATS, {
        level: 3,
        experience: 150,
        experienceToNextLevel: 300,
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        vitality: 10
      })
      world.updateTime(60) // 1 minute

      renderWithProvider(
        <HUDBar 
          playerId={entity} 
          levelName="Forest Clearing"
          showExperience={true}
          showTime={true}
        />
      )

      // Health
      expect(screen.getByText('80 / 100')).toBeDefined()
      // Experience
      expect(screen.getByText('Level 3')).toBeDefined()
      expect(screen.getByText('150 / 300 XP')).toBeDefined()
      // Level
      expect(screen.getByText('Forest Clearing')).toBeDefined()
      // Time
      expect(screen.getByText('01:00')).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero health gracefully', () => {
      world.addComponent(entity, COMPONENTS.HEALTH, { current: 0, max: 100 })

      renderWithProvider(<HUDBar playerId={entity} />)

      expect(screen.getByText('0 / 100')).toBeDefined()
    })

    it('should handle zero experience gracefully', () => {
      world.addComponent(entity, COMPONENTS.CHARACTER_STATS, {
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        vitality: 10
      })

      renderWithProvider(<HUDBar playerId={entity} showExperience={true} />)

      expect(screen.getByText('0 / 100 XP')).toBeDefined()
    })

    it('should handle long level names', () => {
      const longName = "The Ancient Forest Clearing of the Elder Dragons"
      
      renderWithProvider(<HUDBar playerId={entity} levelName={longName} />)

      expect(screen.getByText(longName)).toBeDefined()
    })

    it('should handle large time values', () => {
      // 99 minutes, 59 seconds
      world.updateTime(5999)
      
      renderWithProvider(<HUDBar playerId={entity} showTime={true} />)

      expect(screen.getByText('99:59')).toBeDefined()
    })
  })
})
