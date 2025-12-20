import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { ReactiveWorld } from '@engine/ReactiveWorld'
import { GameStateProvider } from '@/contexts/GameStateContext'
import { HealthBar, CompactHealthBar } from './HealthBar'
import type { Entity } from '@engine/ECS'

describe('HealthBar', () => {
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
    it('should render health bar with health component', () => {
      world.addComponent(entity, 'Health', { current: 100, max: 100 })

      renderWithProvider(<HealthBar entity={entity} />)

      expect(screen.getByText('100 / 100')).toBeDefined()
    })

    it('should not render when no health component', () => {
      const { container } = renderWithProvider(<HealthBar entity={entity} />)

      expect(container.querySelector('.health-bar')).toBeNull()
    })

    it('should not render when entity is null', () => {
      const { container } = renderWithProvider(<HealthBar entity={null} />)

      expect(container.querySelector('.health-bar')).toBeNull()
    })
  })

  describe('Health Display', () => {
    it('should show correct health values', () => {
      world.addComponent(entity, 'Health', { current: 75, max: 100 })

      renderWithProvider(<HealthBar entity={entity} />)

      expect(screen.getByText('75 / 100')).toBeDefined()
    })

    it('should round up decimal health values', () => {
      world.addComponent(entity, 'Health', { current: 75.4, max: 100 })

      renderWithProvider(<HealthBar entity={entity} />)

      expect(screen.getByText('76 / 100')).toBeDefined()
    })

    it('should hide values when showValues is false', () => {
      world.addComponent(entity, 'Health', { current: 100, max: 100 })

      renderWithProvider(<HealthBar entity={entity} showValues={false} />)

      expect(screen.queryByText('100 / 100')).toBeNull()
    })
  })

  describe('Health Percentage', () => {
    it('should show full width when at max health', () => {
      world.addComponent(entity, 'Health', { current: 100, max: 100 })

      const { container } = renderWithProvider(<HealthBar entity={entity} />)

      const fill = container.querySelector('.health-bar-fill') as HTMLElement
      expect(fill?.style.width).toBe('100%')
    })

    it('should show half width when at 50% health', () => {
      world.addComponent(entity, 'Health', { current: 50, max: 100 })

      const { container } = renderWithProvider(<HealthBar entity={entity} />)

      const fill = container.querySelector('.health-bar-fill') as HTMLElement
      expect(fill?.style.width).toBe('50%')
    })

    it('should show 0% width when at 0 health', () => {
      world.addComponent(entity, 'Health', { current: 0, max: 100 })

      const { container } = renderWithProvider(<HealthBar entity={entity} />)

      const fill = container.querySelector('.health-bar-fill') as HTMLElement
      expect(fill?.style.width).toBe('0%')
    })

    it('should cap at 100% even if current exceeds max', () => {
      world.addComponent(entity, 'Health', { current: 150, max: 100 })

      const { container } = renderWithProvider(<HealthBar entity={entity} />)

      const fill = container.querySelector('.health-bar-fill') as HTMLElement
      expect(fill?.style.width).toBe('100%')
    })
  })

  describe('Health Colors', () => {
    it('should use green color when health > 60%', () => {
      world.addComponent(entity, 'Health', { current: 80, max: 100 })

      const { container } = renderWithProvider(<HealthBar entity={entity} />)

      const fill = container.querySelector('.health-bar-fill') as HTMLElement
      expect(fill?.style.backgroundColor).toBe('rgb(76, 175, 80)') // #4caf50
    })

    it('should use orange color when health is 31-60%', () => {
      world.addComponent(entity, 'Health', { current: 50, max: 100 })

      const { container } = renderWithProvider(<HealthBar entity={entity} />)

      const fill = container.querySelector('.health-bar-fill') as HTMLElement
      expect(fill?.style.backgroundColor).toBe('rgb(255, 152, 0)') // #ff9800
    })

    it('should use red color when health <= 30%', () => {
      world.addComponent(entity, 'Health', { current: 25, max: 100 })

      const { container } = renderWithProvider(<HealthBar entity={entity} />)

      const fill = container.querySelector('.health-bar-fill') as HTMLElement
      expect(fill?.style.backgroundColor).toBe('rgb(244, 67, 54)') // #f44336
    })
  })

  describe('Custom Dimensions', () => {
    it('should apply custom width', () => {
      world.addComponent(entity, 'Health', { current: 100, max: 100 })

      const { container } = renderWithProvider(
        <HealthBar entity={entity} width={300} />
      )

      const bar = container.querySelector('.health-bar') as HTMLElement
      expect(bar?.style.width).toBe('300px')
    })

    it('should apply custom height', () => {
      world.addComponent(entity, 'Health', { current: 100, max: 100 })

      const { container } = renderWithProvider(
        <HealthBar entity={entity} height={50} />
      )

      const bar = container.querySelector('.health-bar') as HTMLElement
      expect(bar?.style.height).toBe('50px')
    })
  })

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      world.addComponent(entity, 'Health', { current: 100, max: 100 })

      const { container } = renderWithProvider(
        <HealthBar entity={entity} className="custom-class" />
      )

      const bar = container.querySelector('.health-bar')
      expect(bar?.classList.contains('custom-class')).toBe(true)
    })
  })

  describe('CompactHealthBar', () => {
    it('should render compact variant', () => {
      world.addComponent(entity, 'Health', { current: 75, max: 100 })

      const { container } = renderWithProvider(<CompactHealthBar entity={entity} />)

      const bar = container.querySelector('.health-bar') as HTMLElement
      expect(bar).toBeDefined()
      expect(bar?.classList.contains('compact')).toBe(true)
    })

    it('should have smaller dimensions', () => {
      world.addComponent(entity, 'Health', { current: 75, max: 100 })

      const { container } = renderWithProvider(<CompactHealthBar entity={entity} />)

      const bar = container.querySelector('.health-bar') as HTMLElement
      expect(bar?.style.width).toBe('100px')
      expect(bar?.style.height).toBe('8px')
    })

    it('should not show values', () => {
      world.addComponent(entity, 'Health', { current: 75, max: 100 })

      renderWithProvider(<CompactHealthBar entity={entity} />)

      expect(screen.queryByText('75 / 100')).toBeNull()
    })
  })

  describe('Integration with ReactiveWorld', () => {
    it('should update when health changes', async () => {
      world.addComponent(entity, 'Health', { current: 100, max: 100 })

      const { container, rerender } = renderWithProvider(<HealthBar entity={entity} />)

      expect(screen.getByText('100 / 100')).toBeDefined()

      // Update health
      act(() => {
        world.addComponent(entity, 'Health', { current: 50, max: 100 })
      })

      // Force re-render (in real app, this happens automatically via hooks)
      act(() => {
        rerender(
          <GameStateProvider world={world} playerId={entity}>
            <HealthBar entity={entity} />
          </GameStateProvider>
        )
      })

      const fill = container.querySelector('.health-bar-fill') as HTMLElement
      expect(fill?.style.width).toBe('50%')
    })
  })

  describe('Edge Cases', () => {
    it('should handle negative health gracefully', () => {
      world.addComponent(entity, 'Health', { current: -10, max: 100 })

      const { container } = renderWithProvider(<HealthBar entity={entity} />)

      const fill = container.querySelector('.health-bar-fill') as HTMLElement
      expect(fill?.style.width).toBe('0%')
    })

    it('should handle zero max health', () => {
      world.addComponent(entity, 'Health', { current: 0, max: 0 })

      renderWithProvider(<HealthBar entity={entity} />)

      // Should not crash, percentage will be NaN but clamped to 0
      expect(screen.getByText('0 / 0')).toBeDefined()
    })

    it('should handle very large health values', () => {
      world.addComponent(entity, 'Health', { current: 9999999, max: 10000000 })

      renderWithProvider(<HealthBar entity={entity} />)

      expect(screen.getByText('9999999 / 10000000')).toBeDefined()
    })
  })
})

