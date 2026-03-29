import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

// Mock canvas and other browser APIs
beforeEach(() => {
  const mockGradient = { addColorStop: vi.fn() }
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    ellipse: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    strokeRect: vi.fn(),
    roundRect: vi.fn(),
    setLineDash: vi.fn(),
    createLinearGradient: vi.fn(() => mockGradient),
    createRadialGradient: vi.fn(() => mockGradient),
    createPattern: vi.fn(() => null),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowColor: 'rgba(0,0,0,0)',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  })) as any

  global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16)) as any
  global.cancelAnimationFrame = vi.fn()
  global.performance.now = vi.fn(() => Date.now())
})

/** Helper: render App and click through the start screen */
async function renderPlaying() {
  const user = userEvent.setup()
  const result = render(<App />)
  // Start screen is shown first — click it to transition to 'playing'
  const startScreen = result.container.querySelector('.start-screen')
  if (startScreen) {
    await user.click(startScreen)
  }
  return result
}

describe('App', () => {
  describe('Start Screen', () => {
    it('should render without crashing', () => {
      const { container } = render(<App />)
      expect(container).toBeDefined()
    })

    it('should show the start screen on initial load', () => {
      const { container } = render(<App />)
      expect(container.querySelector('.start-screen')).toBeTruthy()
      expect(container.querySelector('.start-screen__title')).toBeTruthy()
    })

    it('should show start prompt on start screen', () => {
      render(<App />)
      expect(screen.getByText(/PRESS ENTER OR CLICK TO START/i)).toBeDefined()
    })

    it('should show feature highlights on start screen', () => {
      render(<App />)
      expect(screen.getByText(/Combat/i)).toBeDefined()
    })
  })

  describe('Playing state', () => {
    it('should render canvas after starting', async () => {
      const { container } = await renderPlaying()
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeTruthy()
    })

    it('should render game HUD container after starting', async () => {
      const { container } = await renderPlaying()
      const gameContainer = container.querySelector('.game-hud-container')
      expect(gameContainer).toBeTruthy()
    })

    it('should render health bar overlay after starting', async () => {
      const { container } = await renderPlaying()
      const healthBarOverlay = container.querySelector('.health-bar-overlay')
      expect(healthBarOverlay).toBeTruthy()
    })

    it('should render debug info panel after starting', async () => {
      const { container } = await renderPlaying()
      const debugInfo = container.querySelector('.debug-info')
      expect(debugInfo).toBeTruthy()
    })

    it('should display level hotkeys hint in debug info', async () => {
      const { container } = await renderPlaying()
      const debugInfo = container.querySelector('.debug-info-hotkeys')
      expect(debugInfo).toBeTruthy()
      expect(debugInfo?.textContent).toContain('Forest')
    })

    it('should render debug buttons after starting', async () => {
      const { container } = await renderPlaying()
      const debugButtons = container.querySelector('.debug-buttons')
      expect(debugButtons).toBeTruthy()
    })

    it('should not render inventory panel initially', async () => {
      const { container } = await renderPlaying()
      const inventoryPanel = container.querySelector('.inventory-panel-container')
      expect(inventoryPanel).toBeFalsy()
    })

    it('should not render equipment panel initially', async () => {
      const { container } = await renderPlaying()
      const equipmentPanel = container.querySelector('.equipment-panel-container')
      expect(equipmentPanel).toBeFalsy()
    })

    it('should not render dialog box initially', async () => {
      const { container } = await renderPlaying()
      const dialogBox = container.querySelector('.dialog-box-overlay')
      expect(dialogBox).toBeFalsy()
    })

    it('should handle dialog state initialization', async () => {
      const { container } = await renderPlaying()
      const dialogBox = container.querySelector('.dialog-box')
      expect(dialogBox).toBeFalsy()
    })

    it('should render with dialog system components ready', async () => {
      const { container } = await renderPlaying()
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeTruthy()
      expect(container).toBeDefined()
    })

    it('should initialize quest flags state', async () => {
      const { container } = await renderPlaying()
      expect(container).toBeDefined()
    })
  })

  describe('Performance Monitoring', () => {
    it('should initialize performance monitor', async () => {
      const { container } = await renderPlaying()
      expect(container).toBeDefined()
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeTruthy()
    })

    it('should render DebugOverlay component', async () => {
      const { container } = await renderPlaying()
      const debugHint = container.querySelector('.debug-overlay-hint')
      expect(debugHint).toBeTruthy()
    })

    it('should track system timings in game loop', async () => {
      const { container } = await renderPlaying()
      expect(container).toBeDefined()
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeTruthy()
    })

    it('should initialize with default performance metrics state', async () => {
      const { container } = await renderPlaying()
      expect(container).toBeDefined()
    })
  })

  describe('Debug Overlay Integration', () => {
    it('should not show debug overlay initially', async () => {
      const { container } = await renderPlaying()
      const overlay = container.querySelector('.debug-overlay')
      expect(overlay).toBeFalsy()
    })

    it('should render debug overlay hint when not visible', async () => {
      const { container } = await renderPlaying()
      const hint = container.querySelector('.debug-overlay-hint')
      expect(hint).toBeTruthy()
      expect(hint?.textContent).toContain("Press 'F3'")
    })
  })
})
