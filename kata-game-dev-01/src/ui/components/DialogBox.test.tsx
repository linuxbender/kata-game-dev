import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DialogBox } from './DialogBox'
import type { DialogNode } from '@game/configs/DialogConfig'

describe('DialogBox', () => {
  const mockNode: DialogNode = {
    id: 'test_node',
    speaker: 'Test Speaker',
    text: 'This is a test dialog message.',
    choices: [
      { text: 'Choice 1', nextNodeId: 'node1' },
      { text: 'Choice 2', nextNodeId: 'node2' }
    ]
  }

  const mockOnChoiceSelected = vi.fn()
  const mockOnClose = vi.fn()

  it('renders speaker name', () => {
    render(
      <DialogBox
        node={mockNode}
        onChoiceSelected={mockOnChoiceSelected}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Test Speaker')).toBeDefined()
  })

  it('renders dialog text', () => {
    render(
      <DialogBox
        node={mockNode}
        onChoiceSelected={mockOnChoiceSelected}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('This is a test dialog message.')).toBeDefined()
  })

  it('renders all choices', () => {
    render(
      <DialogBox
        node={mockNode}
        onChoiceSelected={mockOnChoiceSelected}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Choice 1')).toBeDefined()
    expect(screen.getByText('Choice 2')).toBeDefined()
  })

  it('calls onChoiceSelected when a choice is clicked', async () => {
    const user = userEvent.setup()
    render(
      <DialogBox
        node={mockNode}
        onChoiceSelected={mockOnChoiceSelected}
        onClose={mockOnClose}
      />
    )

    const choice1Button = screen.getByText('Choice 1')
    await user.click(choice1Button)

    expect(mockOnChoiceSelected).toHaveBeenCalledWith(0)
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <DialogBox
        node={mockNode}
        onChoiceSelected={mockOnChoiceSelected}
        onClose={mockOnClose}
      />
    )

    const closeButton = screen.getByLabelText('close-dialog')
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup()
    render(
      <DialogBox
        node={mockNode}
        onChoiceSelected={mockOnChoiceSelected}
        onClose={mockOnClose}
      />
    )

    const overlay = screen.getByText('Test Speaker').closest('.dialog-box-overlay')
    if (overlay) {
      await user.click(overlay)
      expect(mockOnClose).toHaveBeenCalled()
    }
  })

  it('renders [Close] button when no choices available', () => {
    const nodeWithoutChoices: DialogNode = {
      id: 'end_node',
      speaker: 'Speaker',
      text: 'Goodbye!',
      choices: []
    }

    render(
      <DialogBox
        node={nodeWithoutChoices}
        onChoiceSelected={mockOnChoiceSelected}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('[Close]')).toBeDefined()
  })

  it('filters choices based on condition', () => {
    const nodeWithConditions: DialogNode = {
      id: 'conditional_node',
      speaker: 'Speaker',
      text: 'Test',
      choices: [
        { text: 'Always visible', nextNodeId: 'node1' },
        { 
          text: 'Conditional choice', 
          nextNodeId: 'node2',
          condition: (flags) => flags.hasQuest === true
        }
      ]
    }

    const { rerender } = render(
      <DialogBox
        node={nodeWithConditions}
        onChoiceSelected={mockOnChoiceSelected}
        onClose={mockOnClose}
        questFlags={{ hasQuest: false }}
      />
    )

    // Should only show first choice
    expect(screen.getByText('Always visible')).toBeDefined()
    expect(screen.queryByText('Conditional choice')).toBeNull()

    // Rerender with quest flag set
    rerender(
      <DialogBox
        node={nodeWithConditions}
        onChoiceSelected={mockOnChoiceSelected}
        onClose={mockOnClose}
        questFlags={{ hasQuest: true }}
      />
    )

    // Now both choices should be visible
    expect(screen.getByText('Always visible')).toBeDefined()
    expect(screen.getByText('Conditional choice')).toBeDefined()
  })

  it('does not propagate click from dialog text to overlay', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <DialogBox
        node={mockNode}
        onChoiceSelected={mockOnChoiceSelected}
        onClose={onClose}
      />
    )

    // Click on the text content (not a button)
    const dialogText = screen.getByText('This is a test dialog message.')
    await user.click(dialogText)
    
    // onClose should not be called when clicking inside the dialog content
    expect(onClose).not.toHaveBeenCalled()
  })
})
