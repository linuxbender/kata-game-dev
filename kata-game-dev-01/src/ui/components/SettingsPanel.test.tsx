/**
 * Settings Panel Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPanel from './SettingsPanel'
import { SettingsProvider } from '@/contexts/SettingsContext'

describe('SettingsPanel', () => {
  const renderWithProvider = (isOpen: boolean = true, onClose = vi.fn()) => {
    return render(
      <SettingsProvider>
        <SettingsPanel isOpen={isOpen} onClose={onClose} />
      </SettingsProvider>
    )
  }

  describe('Rendering', () => {
    it('should not render when closed', () => {
      const { container } = renderWithProvider(false)
      expect(container.querySelector('.settings-panel')).toBeNull()
    })

    it('should render when open', () => {
      renderWithProvider(true)
      expect(screen.getByText('Settings')).toBeDefined()
    })

    it('should render all section headers', () => {
      renderWithProvider(true)
      
      expect(screen.getByText('Audio')).toBeDefined()
      expect(screen.getByText('Graphics')).toBeDefined()
      expect(screen.getByText('Gameplay')).toBeDefined()
      expect(screen.getByText('Accessibility')).toBeDefined()
    })

    it('should render close button', () => {
      renderWithProvider(true)
      expect(screen.getByLabelText('Close settings')).toBeDefined()
    })

    it('should render apply button', () => {
      renderWithProvider(true)
      expect(screen.getByText('Apply & Close')).toBeDefined()
    })
  })

  describe('Audio Settings', () => {
    it('should display master volume control', () => {
      renderWithProvider(true)
      expect(screen.getByText('Master Volume')).toBeDefined()
    })

    it('should display music volume control', () => {
      renderWithProvider(true)
      expect(screen.getByText('Music Volume')).toBeDefined()
    })

    it('should display SFX volume control', () => {
      renderWithProvider(true)
      expect(screen.getByText('SFX Volume')).toBeDefined()
    })

    it('should display audio enabled checkbox', () => {
      renderWithProvider(true)
      expect(screen.getByText('Audio Enabled')).toBeDefined()
    })
  })

  describe('Graphics Settings', () => {
    it('should display quality selector', () => {
      renderWithProvider(true)
      expect(screen.getByText('Quality')).toBeDefined()
    })

    it('should display show FPS checkbox', () => {
      renderWithProvider(true)
      expect(screen.getByText('Show FPS')).toBeDefined()
    })

    it('should display particle effects checkbox', () => {
      renderWithProvider(true)
      expect(screen.getByText('Particle Effects')).toBeDefined()
    })

    it('should display screen shake checkbox', () => {
      renderWithProvider(true)
      expect(screen.getByText('Screen Shake')).toBeDefined()
    })

    it('should display vsync checkbox', () => {
      renderWithProvider(true)
      expect(screen.getByText('VSync')).toBeDefined()
    })
  })

  describe('Gameplay Settings', () => {
    it('should display difficulty selector', () => {
      renderWithProvider(true)
      expect(screen.getByText('Difficulty')).toBeDefined()
    })

    it('should display auto-save checkbox', () => {
      renderWithProvider(true)
      expect(screen.getByText('Auto-Save')).toBeDefined()
    })

    it('should display auto-save interval', () => {
      renderWithProvider(true)
      expect(screen.getByText('Auto-Save Interval')).toBeDefined()
    })

    it('should display tutorial hints checkbox', () => {
      renderWithProvider(true)
      expect(screen.getByText('Tutorial Hints')).toBeDefined()
    })
  })

  describe('Accessibility Settings', () => {
    it('should display colorblind mode checkbox', () => {
      renderWithProvider(true)
      expect(screen.getByText('Colorblind Mode')).toBeDefined()
    })

    it('should display reduce motion checkbox', () => {
      renderWithProvider(true)
      expect(screen.getByText('Reduce Motion')).toBeDefined()
    })

    it('should display large text checkbox', () => {
      renderWithProvider(true)
      expect(screen.getByText('Large Text')).toBeDefined()
    })

    it('should display high contrast checkbox', () => {
      renderWithProvider(true)
      expect(screen.getByText('High Contrast')).toBeDefined()
    })
  })

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnClose = vi.fn()
      
      renderWithProvider(true, mockOnClose)
      
      const closeButton = screen.getByLabelText('Close settings')
      await user.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when apply button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnClose = vi.fn()
      
      renderWithProvider(true, mockOnClose)
      
      const applyButton = screen.getByText('Apply & Close')
      await user.click(applyButton)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup()
      const mockOnClose = vi.fn()
      
      const { container } = renderWithProvider(true, mockOnClose)
      
      const backdrop = container.querySelector('.settings-panel-backdrop')
      if (backdrop) {
        await user.click(backdrop)
        expect(mockOnClose).toHaveBeenCalled()
      }
    })

    it('should not call onClose when panel content is clicked', async () => {
      const user = userEvent.setup()
      const mockOnClose = vi.fn()
      
      const { container } = renderWithProvider(true, mockOnClose)
      
      const panel = container.querySelector('.settings-panel')
      if (panel) {
        await user.click(panel)
        expect(mockOnClose).not.toHaveBeenCalled()
      }
    })
  })

  describe('Reset Button', () => {
    it('should show reset button when settings are modified', async () => {
      const user = userEvent.setup()
      
      renderWithProvider(true)
      
      // Modify a setting
      const qualitySelect = screen.getByLabelText('Quality')
      await user.selectOptions(qualitySelect, 'low')
      
      // Reset button should appear
      const resetButton = screen.queryByText('Reset to Defaults')
      expect(resetButton).toBeDefined()
    })
  })
})
