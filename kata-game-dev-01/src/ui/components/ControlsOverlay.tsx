import React from 'react'
import './ControlsOverlay.css'

export interface ControlsOverlayProps {
  onClose: () => void
}

const HOTKEYS: { key: string; action: string }[] = [
  { key: 'WASD / Arrows', action: 'Move' },
  { key: 'Space',          action: 'Attack' },
  { key: 'I',              action: 'Inventory' },
  { key: 'E',              action: 'Equipment' },
  { key: 'P',              action: 'Save / Load' },
  { key: 'F3',             action: 'Debug Overlay' },
  { key: '1 / 2 / 3',     action: 'Switch Level' },
  { key: 'Click NPC',      action: 'Start Dialog' },
  { key: 'H',              action: 'Debug: Damage -10' },
  { key: 'J',              action: 'Debug: Heal +10' },
  { key: '?',              action: 'Toggle this overlay' },
  { key: 'ESC',            action: 'Close open panel' },
]

/**
 * ControlsOverlay
 *
 * Shows all game hotkeys. Toggle with the `?` key.
 *
 * @example
 * ```tsx
 * {ui.controlsVisible && <ControlsOverlay onClose={ui.closeControls} />}
 * ```
 */
const ControlsOverlay: React.FC<ControlsOverlayProps> = ({ onClose }) => (
  <div className="controls-overlay" onClick={e => e.stopPropagation()}>
    <div className="controls-overlay__header">
      <h3 className="controls-overlay__title">Controls</h3>
      <button className="controls-overlay__close" onClick={onClose} aria-label="close-controls">
        Close
      </button>
    </div>
    <ul className="controls-overlay__list">
      {HOTKEYS.map(({ key, action }) => (
        <li key={key} className="controls-overlay__item">
          <kbd className="controls-overlay__key">{key}</kbd>
          <span className="controls-overlay__action">{action}</span>
        </li>
      ))}
    </ul>
  </div>
)

export default ControlsOverlay
