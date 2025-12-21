import React from 'react'
import type { DialogNode } from '@game/configs/DialogConfig'
import './DialogBox.css'

/**
 * DialogBox Props interface
 * Defines the props for the DialogBox component
 * 
 * @example
 * ```tsx
 * <DialogBox
 *   node={currentNode}
 *   onChoiceSelected={(choiceIndex) => handleChoice(choiceIndex)}
 *   onClose={() => setDialogVisible(false)}
 * />
 * ```
 */
export interface DialogBoxProps {
  /** Current dialog node to display */
  node: DialogNode
  /** Handler called when a choice is selected */
  onChoiceSelected: (choiceIndex: number) => void
  /** Handler called when dialog is closed */
  onClose: () => void
  /** Optional quest flags for conditional choices */
  questFlags?: Record<string, any>
}

/**
 * DialogBox Component
 * Displays dialog text, speaker name, and choices for NPC interactions
 * 
 * @example
 * ```tsx
 * const [currentNode, setCurrentNode] = useState(dialog.nodes[dialog.startNodeId])
 * 
 * <DialogBox
 *   node={currentNode}
 *   onChoiceSelected={(index) => {
 *     const choice = currentNode.choices[index]
 *     setCurrentNode(dialog.nodes[choice.nextNodeId])
 *   }}
 *   onClose={() => setDialogVisible(false)}
 * />
 * ```
 */
export const DialogBox: React.FC<DialogBoxProps> = ({ 
  node, 
  onChoiceSelected, 
  onClose,
  questFlags = {}
}) => {
  // Filter choices based on conditions
  const availableChoices = node.choices.filter(choice => {
    if (!choice.condition) return true
    return choice.condition(questFlags)
  })

  return (
    <div className="dialog-box-overlay" onClick={onClose}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        {/* Dialog Header with speaker name */}
        <div className="dialog-box__header">
          <h3 className="dialog-box__speaker">{node.speaker}</h3>
          <button 
            className="dialog-box__close" 
            onClick={onClose}
            aria-label="close-dialog"
          >
            ×
          </button>
        </div>

        {/* Dialog Text */}
        <div className="dialog-box__content">
          <p className="dialog-box__text">{node.text}</p>
        </div>

        {/* Dialog Choices */}
        {availableChoices.length > 0 && (
          <div className="dialog-box__choices">
            {availableChoices.map((choice, index) => {
              // Find original index for callback
              const originalIndex = node.choices.findIndex(c => c === choice)
              return (
                <button
                  key={index}
                  className="dialog-box__choice"
                  onClick={() => onChoiceSelected(originalIndex)}
                >
                  {choice.text}
                </button>
              )
            })}
          </div>
        )}

        {/* If no choices, show close button */}
        {availableChoices.length === 0 && (
          <div className="dialog-box__choices">
            <button
              className="dialog-box__choice dialog-box__choice--single"
              onClick={onClose}
            >
              [Close]
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DialogBox
