import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import GameHUD from './GameHUD'

describe('GameHUD', () => {
  describe('Basic Rendering', () => {
    it('should render container', () => {
      const { container } = render(<GameHUD canvas={<div>Canvas</div>} />)
      
      const hudContainer = container.querySelector('.game-hud-container')
      expect(hudContainer).toBeDefined()
    })

    it('should render canvas layer', () => {
      const { container } = render(<GameHUD canvas={<div className="test-canvas">Canvas</div>} />)
      
      const canvasLayer = container.querySelector('.game-hud-canvas')
      expect(canvasLayer).toBeDefined()
      expect(canvasLayer?.querySelector('.test-canvas')).toBeDefined()
    })

    it('should render all layers when provided', () => {
      const { container } = render(
        <GameHUD
          canvas={<div>Canvas</div>}
          worldUI={<div>WorldUI</div>}
          hudBar={<div>HUDBar</div>}
          overlays={<div>Overlays</div>}
          modals={<div>Modals</div>}
          debugInfo={<div>Debug</div>}
        />
      )
      
      expect(container.querySelector('.game-hud-canvas')).toBeDefined()
      expect(container.querySelector('.game-hud-world-ui')).toBeDefined()
      expect(container.querySelector('.game-hud-bar')).toBeDefined()
      expect(container.querySelector('.game-hud-overlays')).toBeDefined()
      expect(container.querySelector('.game-hud-modals')).toBeDefined()
      expect(container.querySelector('.game-hud-debug')).toBeDefined()
    })
  })

  describe('Layer Rendering', () => {
    it('should not render worldUI layer when not provided', () => {
      const { container } = render(<GameHUD canvas={<div>Canvas</div>} />)
      
      expect(container.querySelector('.game-hud-world-ui')).toBeNull()
    })

    it('should not render hudBar layer when not provided', () => {
      const { container } = render(<GameHUD canvas={<div>Canvas</div>} />)
      
      expect(container.querySelector('.game-hud-bar')).toBeNull()
    })

    it('should not render overlays layer when not provided', () => {
      const { container } = render(<GameHUD canvas={<div>Canvas</div>} />)
      
      expect(container.querySelector('.game-hud-overlays')).toBeNull()
    })

    it('should not render modals layer when not provided', () => {
      const { container } = render(<GameHUD canvas={<div>Canvas</div>} />)
      
      expect(container.querySelector('.game-hud-modals')).toBeNull()
    })

    it('should not render debugInfo layer when not provided', () => {
      const { container } = render(<GameHUD canvas={<div>Canvas</div>} />)
      
      expect(container.querySelector('.game-hud-debug')).toBeNull()
    })
  })

  describe('Layer Content', () => {
    it('should render worldUI content correctly', () => {
      const { getByText } = render(
        <GameHUD
          canvas={<div>Canvas</div>}
          worldUI={<div>Health Bar Content</div>}
        />
      )
      
      expect(getByText('Health Bar Content')).toBeDefined()
    })

    it('should render hudBar content correctly', () => {
      const { getByText } = render(
        <GameHUD
          canvas={<div>Canvas</div>}
          hudBar={<div>Player Stats Content</div>}
        />
      )
      
      expect(getByText('Player Stats Content')).toBeDefined()
    })

    it('should render overlays content correctly', () => {
      const { getByText } = render(
        <GameHUD
          canvas={<div>Canvas</div>}
          overlays={<div>Inventory Panel</div>}
        />
      )
      
      expect(getByText('Inventory Panel')).toBeDefined()
    })

    it('should render modals content correctly', () => {
      const { getByText } = render(
        <GameHUD
          canvas={<div>Canvas</div>}
          modals={<div>Save Menu</div>}
        />
      )
      
      expect(getByText('Save Menu')).toBeDefined()
    })

    it('should render debugInfo content correctly', () => {
      const { getByText } = render(
        <GameHUD
          canvas={<div>Canvas</div>}
          debugInfo={<div>Debug Panel</div>}
        />
      )
      
      expect(getByText('Debug Panel')).toBeDefined()
    })
  })

  describe('Layer Structure', () => {
    it('should have correct layer class for canvas', () => {
      const { container } = render(
        <GameHUD canvas={<div className="test-canvas">Canvas</div>} />
      )
      
      const canvasLayer = container.querySelector('.game-hud-canvas')
      expect(canvasLayer?.classList.contains('game-hud-layer')).toBe(true)
    })

    it('should have correct layer classes for all layers', () => {
      const { container } = render(
        <GameHUD
          canvas={<div>Canvas</div>}
          worldUI={<div>WorldUI</div>}
          hudBar={<div>HUDBar</div>}
          overlays={<div>Overlays</div>}
          modals={<div>Modals</div>}
          debugInfo={<div>Debug</div>}
        />
      )
      
      expect(container.querySelector('.game-hud-layer.game-hud-canvas')).toBeDefined()
      expect(container.querySelector('.game-hud-layer.game-hud-world-ui')).toBeDefined()
      expect(container.querySelector('.game-hud-layer.game-hud-bar')).toBeDefined()
      expect(container.querySelector('.game-hud-layer.game-hud-overlays')).toBeDefined()
      expect(container.querySelector('.game-hud-layer.game-hud-modals')).toBeDefined()
      expect(container.querySelector('.game-hud-layer.game-hud-debug')).toBeDefined()
    })
  })

  describe('Multiple Elements in Layers', () => {
    it('should render multiple elements in worldUI layer', () => {
      const { getByText } = render(
        <GameHUD
          canvas={<div>Canvas</div>}
          worldUI={
            <>
              <div>Health Bar 1</div>
              <div>Health Bar 2</div>
            </>
          }
        />
      )
      
      expect(getByText('Health Bar 1')).toBeDefined()
      expect(getByText('Health Bar 2')).toBeDefined()
    })

    it('should render multiple elements in overlays layer', () => {
      const { getByText } = render(
        <GameHUD
          canvas={<div>Canvas</div>}
          overlays={
            <>
              <div>Inventory Panel</div>
              <div>Equipment Panel</div>
            </>
          }
        />
      )
      
      expect(getByText('Inventory Panel')).toBeDefined()
      expect(getByText('Equipment Panel')).toBeDefined()
    })

    it('should render multiple elements in modals layer', () => {
      const { getByText } = render(
        <GameHUD
          canvas={<div>Canvas</div>}
          modals={
            <>
              <div>Save Menu</div>
              <div>Settings Dialog</div>
            </>
          }
        />
      )
      
      expect(getByText('Save Menu')).toBeDefined()
      expect(getByText('Settings Dialog')).toBeDefined()
    })
  })
})
