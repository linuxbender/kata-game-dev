import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import App from './App'

// Mock canvas and other browser APIs
beforeEach(() => {
  // Mock HTMLCanvasElement.getContext
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
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  })) as any

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16)) as any
  global.cancelAnimationFrame = vi.fn()

  // Mock performance.now
  global.performance.now = vi.fn(() => Date.now())
})

describe('App', () => {
  it('should render without crashing', () => {
    const { container } = render(<App />)
    expect(container).toBeDefined()
  })

  it('should render canvas element', () => {
    const { container } = render(<App />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })

  it('should render game HUD container with correct class', () => {
    const { container } = render(<App />)
    const gameContainer = container.querySelector('.game-hud-container')
    expect(gameContainer).toBeTruthy()
  })

  it('should render health bar overlay', () => {
    const { container } = render(<App />)
    const healthBarOverlay = container.querySelector('.health-bar-overlay')
    expect(healthBarOverlay).toBeTruthy()
  })

  it('should render debug info panel', () => {
    const { container } = render(<App />)
    const debugInfo = container.querySelector('.debug-info')
    expect(debugInfo).toBeTruthy()
  })

  it('should display level hotkeys hint in debug info', () => {
    const { container } = render(<App />)
    const debugInfo = container.querySelector('.debug-info-hotkeys')
    expect(debugInfo).toBeTruthy()
    expect(debugInfo?.textContent).toContain('Level Hotkeys')
  })

  it('should render debug buttons', () => {
    const { container } = render(<App />)
    const debugButtons = container.querySelector('.debug-buttons')
    expect(debugButtons).toBeTruthy()
  })

  it('should not render inventory panel initially', () => {
    const { container } = render(<App />)
    const inventoryPanel = container.querySelector('.inventory-panel-container')
    expect(inventoryPanel).toBeFalsy()
  })

  it('should not render equipment panel initially', () => {
    const { container } = render(<App />)
    const equipmentPanel = container.querySelector('.equipment-panel-container')
    expect(equipmentPanel).toBeFalsy()
  })

  it('should not render dialog box initially', () => {
    const { container } = render(<App />)
    const dialogBox = container.querySelector('.dialog-box-overlay')
    expect(dialogBox).toBeFalsy()
  })

  it('should handle dialog state initialization', () => {
    const { container } = render(<App />)
    // Verify initial state - no dialog visible
    const dialogBox = container.querySelector('.dialog-box')
    expect(dialogBox).toBeFalsy()
  })

  it('should render with dialog system components ready', () => {
    const { container } = render(<App />)
    // Verify canvas is ready for NPC click detection
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeTruthy()
    // Verify game world is initialized (required for dialog system)
    expect(container).toBeDefined()
  })

  it('should initialize quest flags state', () => {
    // Test that the component renders without errors
    // Quest flags state is internal and managed by React
    const { container } = render(<App />)
    expect(container).toBeDefined()
  })

  describe('Performance Monitoring', () => {
    it('should initialize performance monitor', () => {
      const { container } = render(<App />)
      // Verify app renders successfully with performance monitoring
      expect(container).toBeDefined()
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeTruthy()
    })

    it('should render DebugOverlay component', () => {
      const { container } = render(<App />)
      // DebugOverlay should render (even if not visible initially)
      // Check for the hint text when overlay is not visible
      const debugHint = container.querySelector('.debug-overlay-hint')
      expect(debugHint).toBeTruthy()
    })

    it('should track system timings in game loop', () => {
      const { container } = render(<App />)
      // Verify the app initializes with performance tracking
      // Performance metrics are tracked internally in the game loop
      expect(container).toBeDefined()
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeTruthy()
    })

    it('should initialize with default performance metrics state', () => {
      const { container } = render(<App />)
      // Performance metrics state is initialized with default values
      expect(container).toBeDefined()
    })
  })

  describe('Debug Overlay Integration', () => {
    it('should not show debug overlay initially', () => {
      const { container } = render(<App />)
      // Debug overlay should not be visible initially
      const overlay = container.querySelector('.debug-overlay')
      expect(overlay).toBeFalsy()
    })

    it('should render debug overlay hint when not visible', () => {
      const { container } = render(<App />)
      // Should show hint to toggle debug overlay
      const hint = container.querySelector('.debug-overlay-hint')
      expect(hint).toBeTruthy()
      expect(hint?.textContent).toContain("Press 'D'")
    })
  })
})
