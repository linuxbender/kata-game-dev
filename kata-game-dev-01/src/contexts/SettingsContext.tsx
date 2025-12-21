/**
 * Settings Context
 * 
 * Provides global game settings management with localStorage persistence.
 * Manages audio, graphics, gameplay, and accessibility settings.
 * 
 * @example
 * ```tsx
 * function GameComponent() {
 *   const { settings, updateSettings } = useSettings()
 *   
 *   return (
 *     <button onClick={() => updateSettings({ volume: settings.volume + 0.1 })}>
 *       Increase Volume
 *     </button>
 *   )
 * }
 * ```
 */

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react'

/**
 * Difficulty levels for gameplay
 */
export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'extreme'

/**
 * Quality settings for graphics
 */
export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra'

/**
 * Game settings interface
 */
export interface GameSettings {
  /** Audio settings */
  audio: {
    /** Master volume (0.0 - 1.0) */
    masterVolume: number
    /** Music volume (0.0 - 1.0) */
    musicVolume: number
    /** Sound effects volume (0.0 - 1.0) */
    sfxVolume: number
    /** Audio enabled */
    enabled: boolean
  }
  
  /** Graphics settings */
  graphics: {
    /** Graphics quality preset */
    quality: GraphicsQuality
    /** Show FPS counter */
    showFPS: boolean
    /** Enable particle effects */
    particleEffects: boolean
    /** Enable screen shake */
    screenShake: boolean
    /** Enable vsync */
    vsync: boolean
  }
  
  /** Gameplay settings */
  gameplay: {
    /** Difficulty level */
    difficulty: DifficultyLevel
    /** Auto-save enabled */
    autoSave: boolean
    /** Auto-save interval in seconds */
    autoSaveInterval: number
    /** Tutorial hints enabled */
    showTutorialHints: boolean
  }
  
  /** Accessibility settings */
  accessibility: {
    /** Colorblind mode */
    colorblindMode: boolean
    /** Reduce motion effects */
    reduceMotion: boolean
    /** Large text */
    largeText: boolean
    /** High contrast mode */
    highContrast: boolean
  }
}

/**
 * Default game settings
 */
export const DEFAULT_SETTINGS: GameSettings = {
  audio: {
    masterVolume: 0.8,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    enabled: true
  },
  graphics: {
    quality: 'high',
    showFPS: false,
    particleEffects: true,
    screenShake: true,
    vsync: true
  },
  gameplay: {
    difficulty: 'normal',
    autoSave: true,
    autoSaveInterval: 300, // 5 minutes
    showTutorialHints: true
  },
  accessibility: {
    colorblindMode: false,
    reduceMotion: false,
    largeText: false,
    highContrast: false
  }
}

/**
 * Settings context value
 */
export interface SettingsContextValue {
  /** Current settings */
  settings: GameSettings
  
  /** Update settings (partial update supported) */
  updateSettings: (partial: Partial<GameSettings>) => void
  
  /** Reset settings to defaults */
  resetSettings: () => void
  
  /** Check if settings are modified from defaults */
  isModified: boolean
}

/**
 * Settings Context
 */
const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

/**
 * Local storage key for settings
 */
const SETTINGS_STORAGE_KEY = 'kata-game-settings'

/**
 * Load settings from localStorage
 */
const loadSettingsFromStorage = (): GameSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Deep merge with defaults to handle missing fields from updates
      return {
        audio: { ...DEFAULT_SETTINGS.audio, ...parsed.audio },
        graphics: { ...DEFAULT_SETTINGS.graphics, ...parsed.graphics },
        gameplay: { ...DEFAULT_SETTINGS.gameplay, ...parsed.gameplay },
        accessibility: { ...DEFAULT_SETTINGS.accessibility, ...parsed.accessibility }
      }
    }
  } catch (error) {
    console.error('[Settings] Failed to load settings from localStorage:', error)
  }
  return DEFAULT_SETTINGS
}

/**
 * Save settings to localStorage
 */
const saveSettingsToStorage = (settings: GameSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('[Settings] Failed to save settings to localStorage:', error)
  }
}

/**
 * Check if settings are modified from defaults
 */
const areSettingsModified = (settings: GameSettings): boolean => {
  return JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS)
}

/**
 * Props for SettingsProvider
 */
export interface SettingsProviderProps {
  /** Child components */
  children: ReactNode
}

/**
 * Settings Provider Component
 * 
 * Provides game settings management with localStorage persistence.
 * 
 * @example
 * ```tsx
 * <SettingsProvider>
 *   <App />
 * </SettingsProvider>
 * ```
 */
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<GameSettings>(loadSettingsFromStorage)
  const [isModified, setIsModified] = useState(areSettingsModified(loadSettingsFromStorage()))

  // Persist settings to localStorage when they change
  useEffect(() => {
    saveSettingsToStorage(settings)
    setIsModified(areSettingsModified(settings))
  }, [settings])

  /**
   * Update settings (supports partial updates)
   */
  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    setSettings(prev => {
      // Deep merge
      const updated: GameSettings = {
        audio: { ...prev.audio, ...(partial.audio || {}) },
        graphics: { ...prev.graphics, ...(partial.graphics || {}) },
        gameplay: { ...prev.gameplay, ...(partial.gameplay || {}) },
        accessibility: { ...prev.accessibility, ...(partial.accessibility || {}) }
      }
      return updated
    })
  }, [])

  /**
   * Reset settings to defaults
   */
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  const value: SettingsContextValue = {
    settings,
    updateSettings,
    resetSettings,
    isModified
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

/**
 * Hook to access settings context
 * 
 * @returns Settings context value
 * @throws Error if used outside SettingsProvider
 * 
 * @example
 * ```tsx
 * const { settings, updateSettings } = useSettings()
 * console.log('Volume:', settings.audio.masterVolume)
 * updateSettings({ audio: { ...settings.audio, masterVolume: 0.5 } })
 * ```
 */
export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
