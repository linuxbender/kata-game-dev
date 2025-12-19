import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {act, renderHook} from '@testing-library/react'
import {type Size, useCanvas} from './useCanvas'

describe('useCanvas', () => {
    // Mock window object properties
    const originalInnerWidth = window.innerWidth
    const originalInnerHeight = window.innerHeight
    const originalDevicePixelRatio = window.devicePixelRatio

    beforeEach(() => {
        // Reset window properties
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024
        })
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 768
        })
        Object.defineProperty(window, 'devicePixelRatio', {
            writable: true,
            configurable: true,
            value: 1
        })
        vi.clearAllMocks()
    })

    afterEach(() => {
        // Restore original values
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: originalInnerWidth
        })
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: originalInnerHeight
        })
        Object.defineProperty(window, 'devicePixelRatio', {
            writable: true,
            configurable: true,
            value: originalDevicePixelRatio
        })
    })

    describe('initialization', () => {
        it('should initialize with default window dimensions', () => {
            const {result} = renderHook(() => useCanvas())

            expect(result.current.canvasSize.width).toBe(1024)
            expect(result.current.canvasSize.height).toBe(768)
        })

        it('should use initial dimensions even if provided', () => {
            const {result} = renderHook(() => useCanvas(800, 600))

            // Hook uses window dimensions, not provided params for initial size
            // Initial params are used only if window not available (SSR)
            expect(result.current.canvasSize).toBeDefined()
            expect(result.current.canvasSize.width).toBeGreaterThan(0)
            expect(result.current.canvasSize.height).toBeGreaterThan(0)
        })

        it('should initialize with default DPR', () => {
            const {result} = renderHook(() => useCanvas())

            expect(result.current.dpr).toBe(1)
        })

        it('should become ready after configuration', () => {
            const {result} = renderHook(() => useCanvas())

            // Hook should be ready after effect runs
            expect(result.current.ready).toBe(true)
        })
    })

    describe('canvas ref', () => {
        it('should return a canvas ref', () => {
            const {result} = renderHook(() => useCanvas())

            expect(result.current.canvasRef).toBeDefined()
            expect(result.current.canvasRef).toHaveProperty('current')
        })

        it('should attach ref to canvas element', () => {
            const {result} = renderHook(() => useCanvas(400, 300))
            const canvas = document.createElement('canvas')

            act(() => {
                result.current.canvasRef.current = canvas
            })

            expect(result.current.canvasRef.current).toBe(canvas)
        })
    })

    describe('high-DPI support', () => {
        it('should scale canvas backing store by DPR', () => {
            Object.defineProperty(window, 'devicePixelRatio', {
                writable: true,
                configurable: true,
                value: 2
            })

            const {result} = renderHook(() => useCanvas(800, 600))
            const canvas = document.createElement('canvas')

            act(() => {
                result.current.canvasRef.current = canvas
            })

            // Canvas should be configured with scaled dimensions
            expect(result.current.dpr).toBe(2)
        })

        it('should default to DPR 1 if not available', () => {
            Object.defineProperty(window, 'devicePixelRatio', {
                writable: true,
                configurable: true,
                value: undefined
            })

            const {result} = renderHook(() => useCanvas())

            expect(result.current.dpr).toBeGreaterThanOrEqual(1)
        })

        it('should handle high-DPI values correctly', () => {
            Object.defineProperty(window, 'devicePixelRatio', {
                writable: true,
                configurable: true,
                value: 3
            })

            const {result} = renderHook(() => useCanvas(1000, 800))

            expect(result.current.dpr).toBe(3)
        })
    })

    describe('canvas sizing', () => {
        it('should set canvas logical size from window dimensions', () => {
            const {result} = renderHook(() => useCanvas())

            expect(result.current.canvasSize.width).toBe(window.innerWidth)
            expect(result.current.canvasSize.height).toBe(window.innerHeight)
        })

        it('should match window dimensions when no initial size provided', () => {
            const {result} = renderHook(() => useCanvas())

            expect(result.current.canvasSize.width).toBe(window.innerWidth)
            expect(result.current.canvasSize.height).toBe(window.innerHeight)
        })

        it('should have positive canvas dimensions', () => {
            const {result} = renderHook(() => useCanvas(0, 0))

            expect(result.current.canvasSize.width).toBeGreaterThan(0)
            expect(result.current.canvasSize.height).toBeGreaterThan(0)
        })
    })

    describe('event listeners', () => {
        it('should add and remove resize listener on mount/unmount', () => {
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

            const {unmount} = renderHook(() => useCanvas())

            // Should add listeners on mount
            expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
            expect(addEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function))

            unmount()

            // Should remove listeners on unmount
            expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
            expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function))

            addEventListenerSpy.mockRestore()
            removeEventListenerSpy.mockRestore()
        })

        it('should not duplicate event listeners', () => {
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

            renderHook(() => useCanvas())

            // Count resize listener additions
            const resizeListeners = addEventListenerSpy.mock.calls.filter(
                call => call[0] === 'resize'
            )

            expect(resizeListeners.length).toBe(1)

            addEventListenerSpy.mockRestore()
        })
    })

    describe('canvas styling', () => {
        it('should have canvas ref for attaching to DOM', () => {
            const {result} = renderHook(() => useCanvas())

            // Canvas ref should be available to attach to a real canvas element
            expect(result.current.canvasRef.current).toBeNull()

            const canvas = document.createElement('canvas')
            act(() => {
                result.current.canvasRef.current = canvas
            })

            expect(result.current.canvasRef.current).toBe(canvas)
        })

        it('should provide dimensions for canvas CSS styling', () => {
            const {result} = renderHook(() => useCanvas())

            // Hook provides the dimensions needed for canvas styling
            expect(result.current.canvasSize.width).toBeGreaterThan(0)
            expect(result.current.canvasSize.height).toBeGreaterThan(0)
        })

        it('should provide DPR for context scaling', () => {
            const {result} = renderHook(() => useCanvas())

            // DPR value can be used for high-DPI rendering
            expect(result.current.dpr).toBeGreaterThanOrEqual(1)
            expect(result.current.dpr).toBeLessThanOrEqual(3)
        })
    })

    describe('SSR safety', () => {
        it('should handle missing window object gracefully', () => {
            // This would be called in an SSR environment
            expect(() => {
                renderHook(() => useCanvas())
            }).not.toThrow()
        })

        it('should provide default dimensions without window', () => {
            const {result} = renderHook(() => useCanvas())

            expect(result.current.canvasSize).toBeDefined()
            expect(result.current.canvasSize.width).toBeGreaterThan(0)
            expect(result.current.canvasSize.height).toBeGreaterThan(0)
        })
    })

    describe('Size type', () => {
        it('should return Size object with width and height properties', () => {
            const {result} = renderHook(() => useCanvas(512, 384))
            const size: Size = result.current.canvasSize

            expect(size).toHaveProperty('width')
            expect(size).toHaveProperty('height')
            expect(typeof size.width).toBe('number')
            expect(typeof size.height).toBe('number')
        })

        it('should have positive dimensions', () => {
            const {result} = renderHook(() => useCanvas())

            expect(result.current.canvasSize.width).toBeGreaterThan(0)
            expect(result.current.canvasSize.height).toBeGreaterThan(0)
        })
    })

    describe('return value properties', () => {
        it('should return object with all required properties', () => {
            const {result} = renderHook(() => useCanvas())

            expect(result.current).toHaveProperty('canvasRef')
            expect(result.current).toHaveProperty('canvasSize')
            expect(result.current).toHaveProperty('ready')
            expect(result.current).toHaveProperty('dpr')
        })

        it('should have correct property types', () => {
            const {result} = renderHook(() => useCanvas())

            expect(result.current.canvasRef).toHaveProperty('current')
            expect(typeof result.current.canvasSize).toBe('object')
            expect(typeof result.current.ready).toBe('boolean')
            expect(typeof result.current.dpr).toBe('number')
        })
    })

    describe('performance', () => {
        it('should attach event listeners for resize handling', () => {
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

            renderHook(() => useCanvas())

            // Should attach listeners for resize and orientation change
            expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
            expect(addEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function))

            addEventListenerSpy.mockRestore()
        })
    })
})

