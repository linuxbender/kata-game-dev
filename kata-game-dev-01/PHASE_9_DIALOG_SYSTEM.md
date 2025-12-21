# Phase 9: Dialog System - Implementation Summary

## Overview
The Dialog System allows NPCs to have conversations with the player through an interactive dialog tree interface. Players can click on NPCs to initiate conversations, make choices, and receive consequences such as items or quest flags.

## Components

### 1. Dialog Configuration (`src/game/configs/DialogConfig.ts`)
Defines the structure and content of all dialog trees:

- **DialogNode**: A single dialog node with text, speaker, and choices
- **DialogChoice**: A choice option that leads to another node
- **DialogTree**: A complete conversation tree with multiple nodes
- **DialogConsequence**: Actions that occur when entering a node (giveItems, setQuestFlag, endDialog)

**Available Dialog Trees:**
- `merchant_dialog`: Conversation with Merchant John (shop, quests, news)
- `blacksmith_dialog`: Conversation with Blacksmith Gareth (repairs, armor)
- `guard_dialog`: Brief conversation with Town Guard (warnings, passage)

### 2. Dialog UI (`src/ui/components/DialogBox.tsx`)
React component that displays the dialog interface:

- Shows speaker name in header
- Displays dialog text
- Lists available choices as buttons
- Supports conditional choices based on quest flags
- Handles choice selection and dialog closing
- Responsive design with animations

### 3. Game Actions (`src/game/GameActions.ts`)
Functions to manage dialog state and interactions:

- `startDialog(world, player, npc, dialogTreeId)`: Initialize a dialog
- `chooseDialogOption(world, player, choiceIndex)`: Navigate through dialog
- `endDialog(world, player)`: Close the dialog
- `getDialogState(world, player)`: Get current dialog state

**Consequences Handling:**
- `giveItems`: Add items to player inventory
- `removeItems`: Remove items from player inventory
- `setQuestFlag`: Set quest flags on player
- `endDialog`: Close the dialog

### 4. Integration (`src/App.tsx`)
Integration with the main game loop:

- **NPC Click Detection**: Click on canvas to detect NPCs within 30 pixels
- **Dialog State Management**: React state for current dialog node and tree
- **Dialog Navigation**: Handle choice selection and node transitions
- **Keyboard Support**: ESC key closes dialog
- **Quest Flags**: Sync quest flags from player component
- **Inventory Updates**: Refresh inventory when items are given

## How to Use

### For Players:
1. Navigate to an NPC (orange circle) in the game
2. Click on the NPC to start a conversation
3. Read the dialog text and choose a response
4. Navigate through the conversation by clicking choices
5. Press ESC or click the X button to close the dialog

### For Developers:

#### Adding a New Dialog Tree:
```typescript
// In DialogConfig.ts
const MY_NPC_DIALOG: DialogTree = {
  id: 'my_npc_dialog',
  startNodeId: 'greeting',
  nodes: {
    greeting: {
      id: 'greeting',
      speaker: 'NPC Name',
      text: 'Hello there!',
      choices: [
        { text: 'Hello', nextNodeId: 'response' },
        { text: 'Goodbye', nextNodeId: 'goodbye' }
      ]
    },
    response: {
      id: 'response',
      speaker: 'NPC Name',
      text: 'How can I help you?',
      choices: [
        { text: 'Tell me more', nextNodeId: 'more_info' }
      ]
    },
    goodbye: {
      id: 'goodbye',
      speaker: 'NPC Name',
      text: 'Farewell!',
      choices: [],
      consequences: [{ type: 'endDialog' }]
    }
  }
}

// Add to DIALOGS registry
export const DIALOGS: Record<string, DialogTree> = {
  // ... existing dialogs
  [MY_NPC_DIALOG.id]: MY_NPC_DIALOG
}
```

#### Adding Consequences:
```typescript
{
  id: 'reward_node',
  speaker: 'Merchant',
  text: 'Here, take these potions!',
  choices: [{ text: 'Thanks!', nextNodeId: 'goodbye' }],
  consequences: [
    {
      type: 'giveItems',
      items: [
        { id: 'potion_health', quantity: 2 }
      ]
    },
    {
      type: 'setQuestFlag',
      flag: { key: 'received_potions', value: true }
    }
  ]
}
```

#### Adding Conditional Choices:
```typescript
{
  id: 'conditional_node',
  speaker: 'Guard',
  text: 'Do you have the key?',
  choices: [
    {
      text: 'Yes, here it is',
      nextNodeId: 'has_key',
      condition: (flags) => flags.has_key === true
    },
    {
      text: 'No, not yet',
      nextNodeId: 'no_key'
    }
  ]
}
```

## Testing

### Unit Tests:
- `DialogConfig.test.ts`: Tests dialog tree structure and navigation
- `GameActions.test.ts`: Tests dialog actions and consequences
- `DialogBox.test.tsx`: Tests UI component rendering and interactions

### Manual Testing:
1. Run `npm run dev`
2. Navigate to the merchant NPC (orange circle at 600, 500)
3. Click on the merchant to start dialog
4. Test different dialog paths
5. Verify items are added to inventory
6. Verify quest flags are set
7. Verify ESC closes dialog

## File Structure
```
src/
├── game/
│   ├── configs/
│   │   ├── DialogConfig.ts          # Dialog trees and types
│   │   └── DialogConfig.test.ts     # Dialog config tests
│   └── GameActions.ts                # Dialog action functions
├── ui/
│   └── components/
│       ├── DialogBox.tsx             # Dialog UI component
│       ├── DialogBox.css             # Dialog styling
│       └── DialogBox.test.tsx        # Dialog UI tests
└── App.tsx                           # Integration and NPC detection
```

## Features Implemented

✅ Dialog tree configuration with multiple NPCs
✅ Dialog UI with speaker name, text, and choices
✅ Choice selection and navigation
✅ Dialog consequences (items, quest flags, end dialog)
✅ NPC click detection
✅ Keyboard shortcuts (ESC to close)
✅ Conditional choices based on quest flags
✅ Inventory integration
✅ Quest flag system
✅ Comprehensive unit tests
✅ Responsive design with animations

## Future Enhancements

- Add dialog tree ID to NPC metadata for different NPCs
- Add dialog history/log
- Add voice/sound effects
- Add character portraits
- Add typing animation for text
- Add dialog branching based on player stats
- Add dialog reputation system
- Add timed choices
- Add dialog rewards preview
