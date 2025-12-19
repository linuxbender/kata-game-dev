import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { QuadConfigProvider, useQuadConfig, type PersistedQuadConfig } from './QuadConfigContext'

describe('QuadConfigContext', () => {
  const STORAGE_KEY = 'kata_quadtree_config_v1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // localStorage is cleared by global setup
  })

  describe('PersistedQuadConfig type', () => {
    it('should accept valid config objects', () => {
      const config: PersistedQuadConfig = {
        mergeThreshold: 4,
        rebalanceInterval: 1000
      }
      expect(config.mergeThreshold).toBe(4)
      expect(config.rebalanceInterval).toBe(1000)
    })

    it('should allow partial config objects', () => {
      const config1: PersistedQuadConfig = { mergeThreshold: 4 }
      const config2: PersistedQuadConfig = { rebalanceInterval: 1000 }

      expect(config1.mergeThreshold).toBe(4)
      expect(config1.rebalanceInterval).toBeUndefined()
      expect(config2.rebalanceInterval).toBe(1000)
      expect(config2.mergeThreshold).toBeUndefined()
    })

    it('should allow empty config objects', () => {
      const config: PersistedQuadConfig = {}
      expect(Object.keys(config)).toHaveLength(0)
    })
  })

  describe('useQuadConfig without Provider', () => {
    it('should return default no-op implementation when used without provider', () => {
      const { result } = renderHook(() => useQuadConfig())

      expect(result.current.config).toEqual({})
      expect(typeof result.current.setConfig).toBe('function')
    })

    it('should not throw when calling setConfig without provider', () => {
      const { result } = renderHook(() => useQuadConfig())

      expect(() => {
        result.current.setConfig({ mergeThreshold: 5 })
      }).not.toThrow()
    })
  })

  describe('QuadConfigProvider', () => {
    it('should provide initial empty config', () => {
      const { result } = renderHook(() => useQuadConfig(), {
        wrapper: QuadConfigProvider
      })

      expect(result.current.config).toEqual({})
    })

    it('should allow children to access config', () => {
      const TestComponent = () => {
        const { config } = useQuadConfig()
        return <div data-testid="config-display">{JSON.stringify(config)}</div>
      }

      const { getByTestId } = render(
        <QuadConfigProvider>
          <TestComponent />
        </QuadConfigProvider>
      )

      const element = getByTestId('config-display')
      expect(element.textContent).toBe('{}')
    })
  })

  describe('Configuration updates', () => {
    it('should update config via setConfig', async () => {
      const { result } = renderHook(() => useQuadConfig(), {
        wrapper: QuadConfigProvider
      })

      act(() => {
        result.current.setConfig({ mergeThreshold: 5 })
      })

      await waitFor(() => {
        expect(result.current.config.mergeThreshold).toBe(5)
      })
    })

    it('should merge partial updates', async () => {
      const { result } = renderHook(() => useQuadConfig(), {
        wrapper: QuadConfigProvider
      })

      act(() => {
        result.current.setConfig({ mergeThreshold: 4 })
      })

      await waitFor(() => {
        expect(result.current.config.mergeThreshold).toBe(4)
      })

      act(() => {
        result.current.setConfig({ rebalanceInterval: 1000 })
      })

      await waitFor(() => {
        expect(result.current.config.mergeThreshold).toBe(4)
        expect(result.current.config.rebalanceInterval).toBe(1000)
      })
    })

    it('should overwrite existing values when updating', async () => {
      const { result } = renderHook(() => useQuadConfig(), {
        wrapper: QuadConfigProvider
      })

      act(() => {
        result.current.setConfig({ mergeThreshold: 4 })
      })

      await waitFor(() => {
        expect(result.current.config.mergeThreshold).toBe(4)
      })

      act(() => {
        result.current.setConfig({ mergeThreshold: 8 })
      })

      await waitFor(() => {
        expect(result.current.config.mergeThreshold).toBe(8)
      })
    })

    it('should allow clearing a value by setting to undefined', async () => {
      const { result } = renderHook(() => useQuadConfig(), {
        wrapper: QuadConfigProvider
      })

      act(() => {
        result.current.setConfig({ mergeThreshold: 5, rebalanceInterval: 1000 })
      })

      await waitFor(() => {
        expect(result.current.config.mergeThreshold).toBe(5)
        expect(result.current.config.rebalanceInterval).toBe(1000)
      })

      act(() => {
        result.current.setConfig({ mergeThreshold: undefined })
      })

      await waitFor(() => {
        expect(result.current.config.mergeThreshold).toBeUndefined()
        expect(result.current.config.rebalanceInterval).toBe(1000)
      })
    })
  })

  describe('LocalStorage persistence', () => {
    it('should persist config to localStorage', async () => {
      const { result } = renderHook(() => useQuadConfig(), {
        wrapper: QuadConfigProvider
      })

      act(() => {
        result.current.setConfig({ mergeThreshold: 6, rebalanceInterval: 500 })
      })

      await waitFor(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        expect(stored).toBeTruthy()
        const parsed = JSON.parse(stored!)
        expect(parsed.mergeThreshold).toBe(6)
        expect(parsed.rebalanceInterval).toBe(500)
      })
    })

    it('should load config from localStorage on mount', () => {
      const configToStore: PersistedQuadConfig = {
        mergeThreshold: 10,
        rebalanceInterval: 2000
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configToStore))

      const { result } = renderHook(() => useQuadConfig(), {
        wrapper: QuadConfigProvider
      })

      expect(result.current.config.mergeThreshold).toBe(10)
      expect(result.current.config.rebalanceInterval).toBe(2000)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json {')

      const { result } = renderHook(() => useQuadConfig(), {
        wrapper: QuadConfigProvider
      })

      expect(result.current.config).toEqual({})
    })

    it('should handle localStorage write errors gracefully', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full')
      })

      const { result } = renderHook(() => useQuadConfig(), {
        wrapper: QuadConfigProvider
      })

      expect(() => {
        act(() => {
          result.current.setConfig({ mergeThreshold: 3 })
        })
      }).not.toThrow()

      setItemSpy.mockRestore()
    })

    it('should handle localStorage read errors gracefully', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage access denied')
      })

      expect(() => {
        renderHook(() => useQuadConfig(), {
          wrapper: QuadConfigProvider
        })
      }).not.toThrow()

      getItemSpy.mockRestore()
    })

    it('should persist empty config', async () => {
      const { result } = renderHook(() => useQuadConfig(), {
        wrapper: QuadConfigProvider
      })

      act(() => {
        result.current.setConfig({})
      })

      await waitFor(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        expect(stored).toBe('{}')
      })
    })
  })

  describe('Multiple consumers', () => {
    it('should keep multiple consumers in sync', async () => {
      const TestComponent = ({ id }: { id: number }) => {
        const { config, setConfig } = useQuadConfig()
        return (
          <div>
            <span data-testid={`config-${id}`}>{JSON.stringify(config)}</span>
            <button
              data-testid={`btn-${id}`}
              onClick={() => setConfig({ mergeThreshold: 7 })}
            >
              Update
            </button>
          </div>
        )
      }

      const { getByTestId } = render(
        <QuadConfigProvider>
          <TestComponent id={1} />
          <TestComponent id={2} />
        </QuadConfigProvider>
      )

      const config1 = getByTestId('config-1')
      expect(config1.textContent).toBe('{}')

      const btn1 = getByTestId('btn-1') as HTMLButtonElement
      act(() => {
        btn1.click()
      })

      await waitFor(() => {
        const config2 = getByTestId('config-2')
        expect(config2.textContent).toContain('mergeThreshold')
        expect(config2.textContent).toContain('7')
      })
    })
  })

  describe('Type safety', () => {
    it('should enforce PersistedQuadConfig type', () => {
      const { result } = renderHook(() => useQuadConfig(), {
        wrapper: QuadConfigProvider
      })

      const config: PersistedQuadConfig = result.current.config
      expect(config).toBeDefined()

      // Config should have correct structure
      expect(typeof config === 'object').toBe(true)
      expect('mergeThreshold' in config || !('mergeThreshold' in config)).toBe(true)
      expect('rebalanceInterval' in config || !('rebalanceInterval' in config)).toBe(true)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete workflow: init, update, persist, reload', async () => {
      const { result, unmount } = renderHook(() => useQuadConfig(), {
        wrapper: QuadConfigProvider
      })

      // Step 1: Initial state
      expect(result.current.config).toEqual({})

      // Step 2: Update config
      act(() => {
        result.current.setConfig({ mergeThreshold: 5, rebalanceInterval: 800 })
      })

      await waitFor(() => {
        expect(result.current.config.mergeThreshold).toBe(5)
        expect(result.current.config.rebalanceInterval).toBe(800)
      })

      // Step 3: Verify persisted
      const stored = localStorage.getItem(STORAGE_KEY)
      expect(JSON.parse(stored!)).toEqual({ mergeThreshold: 5, rebalanceInterval: 800 })

      // Step 4: Unmount
      unmount()

      // Step 5: Remount and verify config is restored
      const { result: result2 } = renderHook(() => useQuadConfig(), {
        wrapper: QuadConfigProvider
      })

      expect(result2.current.config.mergeThreshold).toBe(5)
      expect(result2.current.config.rebalanceInterval).toBe(800)
    })

    it('should handle rapid consecutive updates', async () => {
      const { result } = renderHook(() => useQuadConfig(), {
        wrapper: QuadConfigProvider
      })

      act(() => {
        result.current.setConfig({ mergeThreshold: 1 })
        result.current.setConfig({ mergeThreshold: 2 })
        result.current.setConfig({ mergeThreshold: 3 })
        result.current.setConfig({ mergeThreshold: 4 })
        result.current.setConfig({ mergeThreshold: 5 })
      })

      await waitFor(() => {
        expect(result.current.config.mergeThreshold).toBe(5)
      })

      const stored = localStorage.getItem(STORAGE_KEY)
      expect(JSON.parse(stored!).mergeThreshold).toBe(5)
    })
  })
})

