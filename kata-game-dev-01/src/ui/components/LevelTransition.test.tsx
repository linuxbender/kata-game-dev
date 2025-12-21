import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import LevelTransition, { type LevelTransitionProps } from './LevelTransition'

 const renderTransition = (props: LevelTransitionProps) => {
   let result!: ReturnType<typeof render>

   act(() => {
     result = render(<LevelTransition {...props} />)
   })

   return result
 }

 const rerenderTransition = (result: ReturnType<typeof render>, props: LevelTransitionProps) => {
   act(() => {
     result.rerender(<LevelTransition {...props} />)
   })
 }

 describe('LevelTransition', () => {
   beforeEach(() => {
     vi.useFakeTimers()
   })

   afterEach(() => {
     vi.runOnlyPendingTimers()
     vi.useRealTimers()
   })

   it('should render nothing when not active', async () => {
     let container: HTMLElement | null = null
     await act(async () => {
       const result = renderTransition({ isActive: false })
       container = result.container
       await Promise.resolve()
     })
     expect(container!.firstChild).toBeNull()
   })

   it('should render transition when active', async () => {
     let container: HTMLElement | null = null
     await act(async () => {
       const result = renderTransition({
         isActive: true,
         levelName: 'Test Level'
       })
       container = result.container
       await Promise.resolve()
     })
     expect(container!.firstChild).toBeTruthy()
   })

   it('should display level name', async () => {
     await act(async () => {
       renderTransition({ isActive: true, levelName: 'Forest Clearing' })
       await Promise.resolve()
     })
     expect(screen.getByText('Forest Clearing')).toBeTruthy()
   })

   it('should display level description', async () => {
     await act(async () => {
       renderTransition({
         isActive: true,
         levelName: 'Forest Clearing',
         levelDescription: 'A peaceful forest with scattered goblin scouts'
       })
       await Promise.resolve()
     })
     expect(screen.getByText('A peaceful forest with scattered goblin scouts')).toBeTruthy()
   })

   it('should call onComplete after transition duration', async () => {
     const onComplete = vi.fn()
     await act(async () => {
       renderTransition({
         isActive: true,
         levelName: 'Test Level',
         duration: 2000,
         onComplete
       })
       await Promise.resolve()
     })
     expect(onComplete).not.toHaveBeenCalled()
     await act(async () => {
       vi.advanceTimersByTime(2000)
     })
     expect(onComplete).toHaveBeenCalledTimes(1)
   })

   it('should handle custom duration', async () => {
     const onComplete = vi.fn()
     const customDuration = 1000
     await act(async () => {
       renderTransition({
         isActive: true,
         levelName: 'Test Level',
         duration: customDuration,
         onComplete
       })
       await Promise.resolve()
     })
     await act(async () => {
       vi.advanceTimersByTime(customDuration)
     })
     expect(onComplete).toHaveBeenCalledTimes(1)
   })

   it('should not call onComplete if deactivated early', async () => {
     const onComplete = vi.fn()
     let renderResult: ReturnType<typeof render> | null = null
     await act(async () => {
       renderResult = renderTransition({
         isActive: true,
         levelName: 'Test Level',
         duration: 2000,
         onComplete
       })
       await Promise.resolve()
     })
     await act(async () => {
       vi.advanceTimersByTime(500)
     })
     await act(async () => {
       rerenderTransition(renderResult!, {
         isActive: false,
         levelName: 'Test Level',
         duration: 2000,
         onComplete
       })
       await Promise.resolve()
     })
     await act(async () => {
       vi.advanceTimersByTime(2000)
     })
     expect(onComplete).not.toHaveBeenCalled()
   })

   it('should render with only level name (no description)', async () => {
     await act(async () => {
       renderTransition({ isActive: true, levelName: 'Test Level' })
       await Promise.resolve()
     })
     expect(screen.getByText('Test Level')).toBeTruthy()
   })

   it('should have correct className for overlay', async () => {
     let container: HTMLElement | null = null
     await act(async () => {
       const result = renderTransition({
         isActive: true,
         levelName: 'Test Level'
       })
       container = result.container
       await Promise.resolve()
     })
     const overlay = container!.firstChild as HTMLElement
     expect(overlay.className).toBe('level-transition-overlay')
   })

   it('should apply opacity transition style', async () => {
     let container: HTMLElement | null = null
     await act(async () => {
       const result = renderTransition({
         isActive: true,
         levelName: 'Test Level'
       })
       container = result.container
       await Promise.resolve()
     })
     const overlay = container!.firstChild as HTMLElement
     expect(overlay.style.transition).toContain('opacity')
   })
 })
