/**
 * SaveLoadMenu Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SaveLoadMenu from './SaveLoadMenu'
import * as SaveSystem from '@game/SaveSystem'

// Mock SaveSystem
vi.mock('@game/SaveSystem', () => ({
  getAllSaveSlots: vi.fn(() => Array(10).fill(null)),
  deleteSave: vi.fn(() => true),
  MAX_SAVE_SLOTS: 10,
  SAVE_VERSION: '1.0.0'
}))

describe('SaveLoadMenu', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()
  const mockOnLoad = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('should render save/load menu', () => {
    render(
      <SaveLoadMenu
        onClose={mockOnClose}
        onSave={mockOnSave}
        onLoad={mockOnLoad}
      />
    )
    
    expect(screen.getByText('Save / Load Game')).toBeDefined()
  })
  
  it('should display save and load tabs', () => {
    render(
      <SaveLoadMenu
        onClose={mockOnClose}
        onSave={mockOnSave}
        onLoad={mockOnLoad}
      />
    )
    
    expect(screen.getByText('Save Game')).toBeDefined()
    expect(screen.getByText('Load Game')).toBeDefined()
  })
  
  it('should display all save slots', () => {
    render(
      <SaveLoadMenu
        onClose={mockOnClose}
        onSave={mockOnSave}
        onLoad={mockOnLoad}
      />
    )
    
    // Should have 10 slots (Slot 1 through Slot 10)
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(`Slot ${i}`)).toBeDefined()
    }
  })
  
  it('should call onClose when close button clicked', () => {
    render(
      <SaveLoadMenu
        onClose={mockOnClose}
        onSave={mockOnSave}
        onLoad={mockOnLoad}
      />
    )
    
    const closeButton = screen.getByText('✕')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
  
  it('should switch between save and load modes', () => {
    render(
      <SaveLoadMenu
        onClose={mockOnClose}
        onSave={mockOnSave}
        onLoad={mockOnLoad}
      />
    )
    
    const saveTab = screen.getByText('Save Game')
    const loadTab = screen.getByText('Load Game')
    
    // Initially in save mode
    expect(saveTab.className).toContain('tab-active')
    expect(loadTab.className).toContain('tab')
    
    // Switch to load mode
    fireEvent.click(loadTab)
    expect(loadTab.className).toContain('tab-active')
  })
  
  it('should display current level in save mode', () => {
    render(
      <SaveLoadMenu
        onClose={mockOnClose}
        onSave={mockOnSave}
        onLoad={mockOnLoad}
        currentLevelId="level_1_forest"
      />
    )
    
    expect(screen.getByText('level_1_forest')).toBeDefined()
  })
  
  it('should display empty slots correctly', () => {
    render(
      <SaveLoadMenu
        onClose={mockOnClose}
        onSave={mockOnSave}
        onLoad={mockOnLoad}
      />
    )
    
    const emptySlots = screen.getAllByText('Empty Slot')
    expect(emptySlots).toHaveLength(10)
  })
  
  it('should display occupied slots with metadata', () => {
    const mockSlots = Array(10).fill(null)
    mockSlots[0] = {
      slot: 0,
      timestamp: Date.now(),
      levelId: 'level_1_forest',
      slotName: 'Test Save',
      version: '1.0.0'
    }
    
    vi.mocked(SaveSystem.getAllSaveSlots).mockReturnValue(mockSlots)
    
    render(
      <SaveLoadMenu
        onClose={mockOnClose}
        onSave={mockOnSave}
        onLoad={mockOnLoad}
      />
    )
    
    expect(screen.getByText('Test Save')).toBeDefined()
    expect(screen.getByText('level_1_forest')).toBeDefined()
  })
  
  it('should show delete button for occupied slots', () => {
    const mockSlots = Array(10).fill(null)
    mockSlots[0] = {
      slot: 0,
      timestamp: Date.now(),
      levelId: 'level_1_forest',
      slotName: 'Test Save',
      version: '1.0.0'
    }
    
    vi.mocked(SaveSystem.getAllSaveSlots).mockReturnValue(mockSlots)
    
    render(
      <SaveLoadMenu
        onClose={mockOnClose}
        onSave={mockOnSave}
        onLoad={mockOnLoad}
      />
    )
    
    const deleteButtons = screen.getAllByTitle('Delete save')
    expect(deleteButtons).toHaveLength(1)
  })
  
  it('should call onLoad when load button clicked', () => {
    const mockSlots = Array(10).fill(null)
    mockSlots[0] = {
      slot: 0,
      timestamp: Date.now(),
      levelId: 'level_1_forest',
      slotName: 'Test Save',
      version: '1.0.0'
    }
    
    vi.mocked(SaveSystem.getAllSaveSlots).mockReturnValue(mockSlots)
    
    render(
      <SaveLoadMenu
        onClose={mockOnClose}
        onSave={mockOnSave}
        onLoad={mockOnLoad}
      />
    )
    
    // Switch to load mode
    const loadTab = screen.getByText('Load Game')
    fireEvent.click(loadTab)
    
    // Click load button
    const loadButton = screen.getByText('Load')
    fireEvent.click(loadButton)
    
    expect(mockOnLoad).toHaveBeenCalledWith(0)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
  
  it('should display unnamed saves correctly', () => {
    const mockSlots = Array(10).fill(null)
    mockSlots[0] = {
      slot: 0,
      timestamp: Date.now(),
      levelId: 'level_1_forest',
      version: '1.0.0'
    }
    
    vi.mocked(SaveSystem.getAllSaveSlots).mockReturnValue(mockSlots)
    
    render(
      <SaveLoadMenu
        onClose={mockOnClose}
        onSave={mockOnSave}
        onLoad={mockOnLoad}
      />
    )
    
    expect(screen.getByText('Unnamed Save')).toBeDefined()
  })
})
