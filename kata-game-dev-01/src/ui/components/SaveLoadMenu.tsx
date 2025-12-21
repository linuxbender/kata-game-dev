/**
 * SaveLoadMenu Component
 * 
 * UI for saving and loading game states with multiple slots
 */

import React, { useState, useEffect } from 'react'
import './SaveLoadMenu.css'
import { getAllSaveSlots, deleteSave, type SaveSlotInfo } from '@game/SaveSystem'

/**
 * SaveLoadMenu props
 */
export interface SaveLoadMenuProps {
  /** Close menu callback */
  onClose: () => void
  /** Save game callback */
  onSave: (slotNumber: number, slotName?: string) => void
  /** Load game callback */
  onLoad: (slotNumber: number) => void
  /** Current level ID for display */
  currentLevelId?: string
}

/**
 * SaveLoadMenu component
 * 
 * Displays save/load slots with timestamps and management options
 * 
 * @example
 * ```tsx
 * <SaveLoadMenu
 *   onClose={() => setMenuVisible(false)}
 *   onSave={(slot, name) => saveGame(world, player, levelId, slot, name)}
 *   onLoad={(slot) => loadGame(world, slot)}
 *   currentLevelId="level_1_forest"
 * />
 * ```
 */
const SaveLoadMenu: React.FC<SaveLoadMenuProps> = ({
  onClose,
  onSave,
  onLoad,
  currentLevelId
}) => {
  const [mode, setMode] = useState<'save' | 'load'>('save')
  const [slots, setSlots] = useState<(SaveSlotInfo | null)[]>([])
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [slotName, setSlotName] = useState<string>('')
  const [showNameInput, setShowNameInput] = useState(false)
  
  // Load save slots on mount and when mode changes
  useEffect(() => {
    refreshSlots()
  }, [mode])
  
  /**
   * Refresh save slot list
   */
  const refreshSlots = () => {
    const allSlots = getAllSaveSlots()
    setSlots(allSlots)
  }
  
  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }
  
  /**
   * Handle save button click
   */
  const handleSaveClick = (slotNumber: number) => {
    setSelectedSlot(slotNumber)
    setShowNameInput(true)
    
    // Pre-fill slot name if slot already has data
    const slotInfo = slots[slotNumber]
    if (slotInfo) {
      setSlotName(slotInfo.slotName || '')
    } else {
      setSlotName('')
    }
  }
  
  /**
   * Confirm save with optional name
   */
  const confirmSave = () => {
    if (selectedSlot !== null) {
      onSave(selectedSlot, slotName || undefined)
      setShowNameInput(false)
      setSelectedSlot(null)
      setSlotName('')
      refreshSlots()
    }
  }
  
  /**
   * Handle load button click
   */
  const handleLoadClick = (slotNumber: number) => {
    onLoad(slotNumber)
    onClose()
  }
  
  /**
   * Handle delete button click
   */
  const handleDeleteClick = (slotNumber: number, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (confirm('Are you sure you want to delete this save?')) {
      deleteSave(slotNumber)
      refreshSlots()
    }
  }
  
  /**
   * Cancel name input
   */
  const cancelNameInput = () => {
    setShowNameInput(false)
    setSelectedSlot(null)
    setSlotName('')
  }
  
  return (
    <div className="save-load-menu-overlay" onClick={onClose}>
      <div className="save-load-menu" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="save-load-menu-header">
          <h2>Save / Load Game</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        {/* Mode toggle */}
        <div className="save-load-menu-tabs">
          <button
            className={mode === 'save' ? 'tab-active' : 'tab'}
            onClick={() => setMode('save')}
          >
            Save Game
          </button>
          <button
            className={mode === 'load' ? 'tab-active' : 'tab'}
            onClick={() => setMode('load')}
          >
            Load Game
          </button>
        </div>
        
        {/* Current level info (save mode only) */}
        {mode === 'save' && currentLevelId && (
          <div className="current-level-info">
            Current Level: <strong>{currentLevelId}</strong>
          </div>
        )}
        
        {/* Slot list */}
        <div className="save-load-slots">
          {slots.map((slotInfo, index) => (
            <div
              key={index}
              className={`save-slot ${slotInfo ? 'occupied' : 'empty'} ${
                selectedSlot === index ? 'selected' : ''
              }`}
            >
              <div className="slot-header">
                <span className="slot-number">Slot {index + 1}</span>
                {slotInfo && (
                  <button
                    className="delete-button"
                    onClick={(e) => handleDeleteClick(index, e)}
                    title="Delete save"
                  >
                    🗑️
                  </button>
                )}
              </div>
              
              {slotInfo ? (
                <div className="slot-content">
                  <div className="slot-name">
                    {slotInfo.slotName || 'Unnamed Save'}
                  </div>
                  <div className="slot-info">
                    <div className="slot-level">{slotInfo.levelId}</div>
                    <div className="slot-timestamp">
                      {formatTimestamp(slotInfo.timestamp)}
                    </div>
                  </div>
                  {mode === 'load' ? (
                    <button
                      className="slot-action-button load-button"
                      onClick={() => handleLoadClick(index)}
                    >
                      Load
                    </button>
                  ) : (
                    <button
                      className="slot-action-button save-button"
                      onClick={() => handleSaveClick(index)}
                    >
                      Overwrite
                    </button>
                  )}
                </div>
              ) : (
                <div className="slot-content empty-slot">
                  <div className="slot-empty-text">Empty Slot</div>
                  {mode === 'save' && (
                    <button
                      className="slot-action-button save-button"
                      onClick={() => handleSaveClick(index)}
                    >
                      Save Here
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Name input dialog (save mode) */}
        {showNameInput && (
          <div className="name-input-overlay">
            <div className="name-input-dialog">
              <h3>Save Game</h3>
              <p>Enter an optional name for this save:</p>
              <input
                type="text"
                className="name-input"
                value={slotName}
                onChange={(e) => setSlotName(e.target.value)}
                placeholder="Save name (optional)"
                maxLength={30}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmSave()
                  if (e.key === 'Escape') cancelNameInput()
                }}
              />
              <div className="name-input-buttons">
                <button className="confirm-button" onClick={confirmSave}>
                  Save
                </button>
                <button className="cancel-button" onClick={cancelNameInput}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SaveLoadMenu
