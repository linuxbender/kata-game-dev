import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { LevelTransition } from './LevelTransition'

describe('LevelTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('should render nothing when not active', () => {
    const { container } = render(
      <LevelTransition isActive={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render transition when active', () => {
    const { container } = render(
      <LevelTransition isActive={true} levelName="Test Level" />
    )
    expect(container.firstChild).toBeTruthy()
  })

  it('should display level name', () => {
    render(
      <LevelTransition isActive={true} levelName="Forest Clearing" />
    )
    expect(screen.getByText('Forest Clearing')).toBeTruthy()
  })

  it('should display level description', () => {
    render(
      <LevelTransition 
        isActive={true} 
        levelName="Forest Clearing"
        levelDescription="A peaceful forest with scattered goblin scouts"
      />
    )
    expect(screen.getByText('A peaceful forest with scattered goblin scouts')).toBeTruthy()
  })

  it('should call onComplete after transition duration', async () => {
    const onComplete = vi.fn()
    render(
      <LevelTransition 
        isActive={true} 
        levelName="Test Level"
        duration={2000}
        onComplete={onComplete}
      />
    )

    expect(onComplete).not.toHaveBeenCalled()

    // Fast-forward through the entire transition
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('should handle custom duration', async () => {
    const onComplete = vi.fn()
    const customDuration = 1000
    render(
      <LevelTransition 
        isActive={true} 
        levelName="Test Level"
        duration={customDuration}
        onComplete={onComplete}
      />
    )

    await act(async () => {
      vi.advanceTimersByTime(customDuration)
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('should not call onComplete if deactivated early', async () => {
    const onComplete = vi.fn()
    const { rerender } = render(
      <LevelTransition 
        isActive={true} 
        levelName="Test Level"
        duration={2000}
        onComplete={onComplete}
      />
    )

    // Advance time partially
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    // Deactivate
    rerender(
      <LevelTransition 
        isActive={false} 
        levelName="Test Level"
        duration={2000}
        onComplete={onComplete}
      />
    )

    // Advance rest of time
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(onComplete).not.toHaveBeenCalled()
  })

  it('should render with only level name (no description)', () => {
    render(
      <LevelTransition 
        isActive={true} 
        levelName="Test Level"
      />
    )
    expect(screen.getByText('Test Level')).toBeTruthy()
  })

  it('should have correct z-index for overlay', () => {
    const { container } = render(
      <LevelTransition isActive={true} levelName="Test Level" />
    )
    const overlay = container.firstChild as HTMLElement
    expect(overlay.style.zIndex).toBe('9999')
  })

  it('should have pointer-events none to not block interactions after fade', () => {
    const { container } = render(
      <LevelTransition isActive={true} levelName="Test Level" />
    )
    const overlay = container.firstChild as HTMLElement
    expect(overlay.style.pointerEvents).toBe('none')
  })
})
