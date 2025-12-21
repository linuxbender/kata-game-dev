/**
 * Settings Context Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, renderHook } from '@testing-library/react'
import { SettingsProvider, useSettings, DEFAULT_SETTINGS, type GameSettings } from './SettingsContext'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('SettingsContext', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('SettingsProvider', () => {
    it('should render children', () => {
      render(
        <SettingsProvider>
          <div>Test Child</div>
        </SettingsProvider>
      )

      expect(screen.getByText('Test Child')).toBeDefined()
    })

    it('should provide default settings initially', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      expect(result.current.settings).toEqual(DEFAULT_SETTINGS)
    })

    it('should load settings from localStorage on mount', () => {
      const customSettings: GameSettings = {
        ...DEFAULT_SETTINGS,
        audio: {
          ...DEFAULT_SETTINGS.audio,
          masterVolume: 0.5
        }
      }
      localStorageMock.setItem('kata-game-settings', JSON.stringify(customSettings))

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      expect(result.current.settings.audio.masterVolume).toBe(0.5)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.setItem('kata-game-settings', 'invalid json')

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      expect(result.current.settings).toEqual(DEFAULT_SETTINGS)
    })
  })

  describe('useSettings', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useSettings())
      }).toThrow('useSettings must be used within a SettingsProvider')

      consoleError.mockRestore()
    })

    it('should provide settings object', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      expect(result.current.settings).toBeDefined()
      expect(result.current.settings.audio).toBeDefined()
      expect(result.current.settings.graphics).toBeDefined()
      expect(result.current.settings.gameplay).toBeDefined()
      expect(result.current.settings.accessibility).toBeDefined()
    })

    it('should provide updateSettings function', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      expect(typeof result.current.updateSettings).toBe('function')
    })

    it('should provide resetSettings function', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      expect(typeof result.current.resetSettings).toBe('function')
    })

    it('should provide isModified flag', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      expect(typeof result.current.isModified).toBe('boolean')
    })
  })

  describe('updateSettings', () => {
    it('should update audio settings', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      act(() => {
        result.current.updateSettings({
          audio: { ...result.current.settings.audio, masterVolume: 0.5 }
        })
      })

      expect(result.current.settings.audio.masterVolume).toBe(0.5)
    })

    it('should update graphics settings', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      act(() => {
        result.current.updateSettings({
          graphics: { ...result.current.settings.graphics, showFPS: true }
        })
      })

      expect(result.current.settings.graphics.showFPS).toBe(true)
    })

    it('should update gameplay settings', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      act(() => {
        result.current.updateSettings({
          gameplay: { ...result.current.settings.gameplay, difficulty: 'hard' }
        })
      })

      expect(result.current.settings.gameplay.difficulty).toBe('hard')
    })

    it('should update accessibility settings', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      act(() => {
        result.current.updateSettings({
          accessibility: { ...result.current.settings.accessibility, colorblindMode: true }
        })
      })

      expect(result.current.settings.accessibility.colorblindMode).toBe(true)
    })

    it('should support partial updates', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      const originalMusicVolume = result.current.settings.audio.musicVolume

      act(() => {
        result.current.updateSettings({
          audio: { ...result.current.settings.audio, masterVolume: 0.3 }
        })
      })

      expect(result.current.settings.audio.masterVolume).toBe(0.3)
      expect(result.current.settings.audio.musicVolume).toBe(originalMusicVolume)
    })

    it('should persist settings to localStorage', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      act(() => {
        result.current.updateSettings({
          audio: { ...result.current.settings.audio, masterVolume: 0.7 }
        })
      })

      const stored = localStorageMock.getItem('kata-game-settings')
      expect(stored).toBeDefined()
      const parsed = JSON.parse(stored!)
      expect(parsed.audio.masterVolume).toBe(0.7)
    })

    it('should update isModified flag', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      expect(result.current.isModified).toBe(false)

      act(() => {
        result.current.updateSettings({
          audio: { ...result.current.settings.audio, masterVolume: 0.5 }
        })
      })

      expect(result.current.isModified).toBe(true)
    })
  })

  describe('resetSettings', () => {
    it('should reset settings to defaults', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      act(() => {
        result.current.updateSettings({
          audio: { ...result.current.settings.audio, masterVolume: 0.3 }
        })
      })

      expect(result.current.settings.audio.masterVolume).toBe(0.3)

      act(() => {
        result.current.resetSettings()
      })

      expect(result.current.settings).toEqual(DEFAULT_SETTINGS)
    })

    it('should set isModified to false after reset', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      act(() => {
        result.current.updateSettings({
          audio: { ...result.current.settings.audio, masterVolume: 0.3 }
        })
      })

      expect(result.current.isModified).toBe(true)

      act(() => {
        result.current.resetSettings()
      })

      expect(result.current.isModified).toBe(false)
    })

    it('should persist reset settings to localStorage', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      act(() => {
        result.current.updateSettings({
          audio: { ...result.current.settings.audio, masterVolume: 0.3 }
        })
      })

      act(() => {
        result.current.resetSettings()
      })

      const stored = localStorageMock.getItem('kata-game-settings')
      expect(stored).toBeDefined()
      const parsed = JSON.parse(stored!)
      expect(parsed).toEqual(DEFAULT_SETTINGS)
    })
  })

  describe('Default Settings', () => {
    it('should have reasonable default audio settings', () => {
      expect(DEFAULT_SETTINGS.audio.masterVolume).toBe(0.8)
      expect(DEFAULT_SETTINGS.audio.musicVolume).toBe(0.6)
      expect(DEFAULT_SETTINGS.audio.sfxVolume).toBe(0.8)
      expect(DEFAULT_SETTINGS.audio.enabled).toBe(true)
    })

    it('should have reasonable default graphics settings', () => {
      expect(DEFAULT_SETTINGS.graphics.quality).toBe('high')
      expect(DEFAULT_SETTINGS.graphics.showFPS).toBe(false)
      expect(DEFAULT_SETTINGS.graphics.particleEffects).toBe(true)
      expect(DEFAULT_SETTINGS.graphics.screenShake).toBe(true)
      expect(DEFAULT_SETTINGS.graphics.vsync).toBe(true)
    })

    it('should have reasonable default gameplay settings', () => {
      expect(DEFAULT_SETTINGS.gameplay.difficulty).toBe('normal')
      expect(DEFAULT_SETTINGS.gameplay.autoSave).toBe(true)
      expect(DEFAULT_SETTINGS.gameplay.autoSaveInterval).toBe(300)
      expect(DEFAULT_SETTINGS.gameplay.showTutorialHints).toBe(true)
    })

    it('should have reasonable default accessibility settings', () => {
      expect(DEFAULT_SETTINGS.accessibility.colorblindMode).toBe(false)
      expect(DEFAULT_SETTINGS.accessibility.reduceMotion).toBe(false)
      expect(DEFAULT_SETTINGS.accessibility.largeText).toBe(false)
      expect(DEFAULT_SETTINGS.accessibility.highContrast).toBe(false)
    })
  })

  describe('localStorage Integration', () => {
    it('should merge stored settings with defaults for missing fields', () => {
      // Simulate old version of settings without new fields
      const oldSettings = {
        audio: { masterVolume: 0.5, musicVolume: 0.4, sfxVolume: 0.6, enabled: true },
        graphics: { quality: 'medium', showFPS: false, particleEffects: true },
        // Missing screenShake and vsync
        gameplay: { difficulty: 'easy', autoSave: true },
        // Missing autoSaveInterval and showTutorialHints
        accessibility: { colorblindMode: false, reduceMotion: false }
        // Missing largeText and highContrast
      }
      localStorageMock.setItem('kata-game-settings', JSON.stringify(oldSettings))

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider
      })

      // Should have old values
      expect(result.current.settings.audio.masterVolume).toBe(0.5)
      expect(result.current.settings.graphics.quality).toBe('medium')

      // Should have default values for missing fields
      expect(result.current.settings.graphics.screenShake).toBe(true)
      expect(result.current.settings.graphics.vsync).toBe(true)
      expect(result.current.settings.gameplay.autoSaveInterval).toBe(300)
      expect(result.current.settings.gameplay.showTutorialHints).toBe(true)
      expect(result.current.settings.accessibility.largeText).toBe(false)
      expect(result.current.settings.accessibility.highContrast).toBe(false)
    })
  })
})
