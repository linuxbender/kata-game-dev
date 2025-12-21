import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
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

  it('should render game container with correct class', () => {
    const { container } = render(<App />)
    const gameContainer = container.querySelector('.app-container')
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
})
