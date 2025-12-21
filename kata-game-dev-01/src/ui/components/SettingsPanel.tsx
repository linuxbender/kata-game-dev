/**
 * Settings Panel Component
 * 
 * Provides a comprehensive UI for adjusting game settings.
 * Includes audio, graphics, gameplay, and accessibility options.
 * 
 * @example
 * ```tsx
 * <SettingsPanel
 *   isOpen={showSettings}
 *   onClose={() => setShowSettings(false)}
 * />
 * ```
 */

import React from 'react'
import './SettingsPanel.css'
import { useSettings, type DifficultyLevel, type GraphicsQuality } from '@/contexts/SettingsContext'

/**
 * SettingsPanel props
 */
export interface SettingsPanelProps {
  /** Whether the panel is open */
  isOpen: boolean
  
  /** Close callback */
  onClose: () => void
}

/**
 * Settings Panel Component
 * 
 * Displays game settings with intuitive controls.
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetSettings, isModified } = useSettings()

  if (!isOpen) return null

  return (
    <div className="settings-panel-backdrop" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>

        <div className="settings-content">
          {/* Audio Settings */}
          <div className="settings-section">
            <h3>Audio</h3>
            <div className="settings-group">
              <label className="setting-item">
                <span className="setting-label">Master Volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.audio.masterVolume * 100}
                  onChange={(e) => updateSettings({
                    audio: { ...settings.audio, masterVolume: parseInt(e.target.value) / 100 }
                  })}
                />
                <span className="setting-value">{Math.round(settings.audio.masterVolume * 100)}%</span>
              </label>

              <label className="setting-item">
                <span className="setting-label">Music Volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.audio.musicVolume * 100}
                  onChange={(e) => updateSettings({
                    audio: { ...settings.audio, musicVolume: parseInt(e.target.value) / 100 }
                  })}
                />
                <span className="setting-value">{Math.round(settings.audio.musicVolume * 100)}%</span>
              </label>

              <label className="setting-item">
                <span className="setting-label">SFX Volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.audio.sfxVolume * 100}
                  onChange={(e) => updateSettings({
                    audio: { ...settings.audio, sfxVolume: parseInt(e.target.value) / 100 }
                  })}
                />
                <span className="setting-value">{Math.round(settings.audio.sfxVolume * 100)}%</span>
              </label>

              <label className="setting-item checkbox">
                <span className="setting-label">Audio Enabled</span>
                <input
                  type="checkbox"
                  checked={settings.audio.enabled}
                  onChange={(e) => updateSettings({
                    audio: { ...settings.audio, enabled: e.target.checked }
                  })}
                />
              </label>
            </div>
          </div>

          {/* Graphics Settings */}
          <div className="settings-section">
            <h3>Graphics</h3>
            <div className="settings-group">
              <label className="setting-item">
                <span className="setting-label">Quality</span>
                <select
                  value={settings.graphics.quality}
                  onChange={(e) => updateSettings({
                    graphics: { ...settings.graphics, quality: e.target.value as GraphicsQuality }
                  })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="ultra">Ultra</option>
                </select>
              </label>

              <label className="setting-item checkbox">
                <span className="setting-label">Show FPS</span>
                <input
                  type="checkbox"
                  checked={settings.graphics.showFPS}
                  onChange={(e) => updateSettings({
                    graphics: { ...settings.graphics, showFPS: e.target.checked }
                  })}
                />
              </label>

              <label className="setting-item checkbox">
                <span className="setting-label">Particle Effects</span>
                <input
                  type="checkbox"
                  checked={settings.graphics.particleEffects}
                  onChange={(e) => updateSettings({
                    graphics: { ...settings.graphics, particleEffects: e.target.checked }
                  })}
                />
              </label>

              <label className="setting-item checkbox">
                <span className="setting-label">Screen Shake</span>
                <input
                  type="checkbox"
                  checked={settings.graphics.screenShake}
                  onChange={(e) => updateSettings({
                    graphics: { ...settings.graphics, screenShake: e.target.checked }
                  })}
                />
              </label>

              <label className="setting-item checkbox">
                <span className="setting-label">VSync</span>
                <input
                  type="checkbox"
                  checked={settings.graphics.vsync}
                  onChange={(e) => updateSettings({
                    graphics: { ...settings.graphics, vsync: e.target.checked }
                  })}
                />
              </label>
            </div>
          </div>

          {/* Gameplay Settings */}
          <div className="settings-section">
            <h3>Gameplay</h3>
            <div className="settings-group">
              <label className="setting-item">
                <span className="setting-label">Difficulty</span>
                <select
                  value={settings.gameplay.difficulty}
                  onChange={(e) => updateSettings({
                    gameplay: { ...settings.gameplay, difficulty: e.target.value as DifficultyLevel }
                  })}
                >
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                  <option value="extreme">Extreme</option>
                </select>
              </label>

              <label className="setting-item checkbox">
                <span className="setting-label">Auto-Save</span>
                <input
                  type="checkbox"
                  checked={settings.gameplay.autoSave}
                  onChange={(e) => updateSettings({
                    gameplay: { ...settings.gameplay, autoSave: e.target.checked }
                  })}
                />
              </label>

              <label className="setting-item">
                <span className="setting-label">Auto-Save Interval</span>
                <input
                  type="number"
                  min="60"
                  max="3600"
                  step="60"
                  value={settings.gameplay.autoSaveInterval}
                  onChange={(e) => updateSettings({
                    gameplay: { ...settings.gameplay, autoSaveInterval: parseInt(e.target.value) }
                  })}
                />
                <span className="setting-value">{Math.round(settings.gameplay.autoSaveInterval / 60)} min</span>
              </label>

              <label className="setting-item checkbox">
                <span className="setting-label">Tutorial Hints</span>
                <input
                  type="checkbox"
                  checked={settings.gameplay.showTutorialHints}
                  onChange={(e) => updateSettings({
                    gameplay: { ...settings.gameplay, showTutorialHints: e.target.checked }
                  })}
                />
              </label>
            </div>
          </div>

          {/* Accessibility Settings */}
          <div className="settings-section">
            <h3>Accessibility</h3>
            <div className="settings-group">
              <label className="setting-item checkbox">
                <span className="setting-label">Colorblind Mode</span>
                <input
                  type="checkbox"
                  checked={settings.accessibility.colorblindMode}
                  onChange={(e) => updateSettings({
                    accessibility: { ...settings.accessibility, colorblindMode: e.target.checked }
                  })}
                />
              </label>

              <label className="setting-item checkbox">
                <span className="setting-label">Reduce Motion</span>
                <input
                  type="checkbox"
                  checked={settings.accessibility.reduceMotion}
                  onChange={(e) => updateSettings({
                    accessibility: { ...settings.accessibility, reduceMotion: e.target.checked }
                  })}
                />
              </label>

              <label className="setting-item checkbox">
                <span className="setting-label">Large Text</span>
                <input
                  type="checkbox"
                  checked={settings.accessibility.largeText}
                  onChange={(e) => updateSettings({
                    accessibility: { ...settings.accessibility, largeText: e.target.checked }
                  })}
                />
              </label>

              <label className="setting-item checkbox">
                <span className="setting-label">High Contrast</span>
                <input
                  type="checkbox"
                  checked={settings.accessibility.highContrast}
                  onChange={(e) => updateSettings({
                    accessibility: { ...settings.accessibility, highContrast: e.target.checked }
                  })}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          {isModified && (
            <button className="settings-button reset" onClick={resetSettings}>
              Reset to Defaults
            </button>
          )}
          <button className="settings-button apply" onClick={onClose}>
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
