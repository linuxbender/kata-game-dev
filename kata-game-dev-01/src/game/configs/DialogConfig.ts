/**
 * Dialog System Configuration
 * Defines dialog nodes, choices, and dialog trees for NPC interactions
 */

/**
 * Dialog choice interface
 * Represents a choice available to the player during a dialog
 * 
 * @example
 * ```ts
 * const choice: DialogChoice = {
 *   text: "Tell me about the quest",
 *   nextNodeId: "merchant_quest_info"
 * }
 * ```
 */
export interface DialogChoice {
  /** Text displayed to the player */
  text: string
  /** ID of the next dialog node to show */
  nextNodeId: string
  /** Optional condition to show this choice */
  condition?: (flags: Record<string, any>) => boolean
}

/**
 * Dialog consequence interface
 * Defines actions that occur when a node is entered or choice is selected
 * 
 * @example
 * ```ts
 * const consequence: DialogConsequence = {
 *   type: 'giveItems',
 *   items: [{ id: 'potion_health', quantity: 2 }]
 * }
 * ```
 */
export interface DialogConsequence {
  /** Type of consequence */
  type: 'giveItems' | 'setQuestFlag' | 'endDialog' | 'removeItems'
  /** Items to give/remove (for giveItems/removeItems) */
  items?: Array<{ id: string; quantity: number }>
  /** Quest flag key and value to set (for setQuestFlag) */
  flag?: { key: string; value: any }
}

/**
 * Dialog node interface
 * Represents a single node in a dialog tree
 * 
 * @example
 * ```ts
 * const node: DialogNode = {
 *   id: "merchant_greeting",
 *   speaker: "Merchant John",
 *   text: "Welcome to my shop!",
 *   choices: [
 *     { text: "What do you sell?", nextNodeId: "merchant_shop" },
 *     { text: "Goodbye", nextNodeId: "merchant_goodbye" }
 *   ]
 * }
 * ```
 */
export interface DialogNode {
  /** Unique identifier for this node */
  id: string
  /** Name of the speaker (NPC name) */
  speaker: string
  /** Dialog text to display */
  text: string
  /** Available choices for the player */
  choices: DialogChoice[]
  /** Optional consequences when entering this node */
  consequences?: DialogConsequence[]
}

/**
 * Dialog tree interface
 * Represents a complete dialog conversation with an NPC
 * 
 * @example
 * ```ts
 * const tree: DialogTree = {
 *   id: "merchant_dialog",
 *   startNodeId: "merchant_greeting",
 *   nodes: { ... }
 * }
 * ```
 */
export interface DialogTree {
  /** Unique identifier for this dialog tree */
  id: string
  /** ID of the starting node */
  startNodeId: string
  /** Map of node ID to dialog node */
  nodes: Record<string, DialogNode>
}

/**
 * Merchant Dialog Tree
 * Trading and shop-related conversations
 */
const MERCHANT_DIALOG: DialogTree = {
  id: 'merchant_dialog',
  startNodeId: 'greeting',
  nodes: {
    greeting: {
      id: 'greeting',
      speaker: 'Merchant John',
      text: 'Welcome, traveler! Looking for supplies?',
      choices: [
        { text: 'What do you have for sale?', nextNodeId: 'shop' },
        { text: 'Any news from the road?', nextNodeId: 'news' },
        { text: 'Goodbye', nextNodeId: 'goodbye' }
      ]
    },
    shop: {
      id: 'shop',
      speaker: 'Merchant John',
      text: 'I have weapons, armor, and potions. Take your pick!',
      choices: [
        { text: 'I need some healing potions', nextNodeId: 'buy_potions' },
        { text: 'Show me your weapons', nextNodeId: 'buy_weapons' },
        { text: 'Maybe later', nextNodeId: 'goodbye' }
      ]
    },
    buy_potions: {
      id: 'buy_potions',
      speaker: 'Merchant John',
      text: 'Here are two health potions. On the house for a brave adventurer!',
      choices: [
        { text: 'Thank you!', nextNodeId: 'after_trade' }
      ],
      consequences: [
        {
          type: 'giveItems',
          items: [{ id: 'potion_health', quantity: 2 }]
        }
      ]
    },
    buy_weapons: {
      id: 'buy_weapons',
      speaker: 'Merchant John',
      text: 'I have this fine iron sword. It will serve you well!',
      choices: [
        { text: 'I\'ll take it', nextNodeId: 'after_trade' },
        { text: 'Too expensive', nextNodeId: 'shop' }
      ]
    },
    news: {
      id: 'news',
      speaker: 'Merchant John',
      text: 'There are rumors of orcs gathering in the fortress to the north. Be careful out there!',
      choices: [
        { text: 'Thanks for the warning', nextNodeId: 'greeting' },
        { text: 'Tell me more', nextNodeId: 'news_details' }
      ]
    },
    news_details: {
      id: 'news_details',
      speaker: 'Merchant John',
      text: 'The orc chieftain is said to be planning an attack. Many brave warriors have fallen trying to stop them.',
      choices: [
        { text: 'I\'ll put a stop to them', nextNodeId: 'quest_accept' },
        { text: 'That sounds dangerous', nextNodeId: 'greeting' }
      ]
    },
    quest_accept: {
      id: 'quest_accept',
      speaker: 'Merchant John',
      text: 'Brave words! May fortune favor you. I\'ll mark your quest log.',
      choices: [
        { text: 'I won\'t let you down', nextNodeId: 'goodbye' }
      ],
      consequences: [
        {
          type: 'setQuestFlag',
          flag: { key: 'orc_fortress_quest', value: 'accepted' }
        }
      ]
    },
    after_trade: {
      id: 'after_trade',
      speaker: 'Merchant John',
      text: 'Pleasure doing business with you! Come back anytime.',
      choices: [
        { text: 'Farewell', nextNodeId: 'goodbye' }
      ]
    },
    goodbye: {
      id: 'goodbye',
      speaker: 'Merchant John',
      text: 'Safe travels, friend!',
      choices: [],
      consequences: [
        {
          type: 'endDialog'
        }
      ]
    }
  }
}

/**
 * Blacksmith Dialog Tree
 * Weapon and armor crafting conversations
 */
const BLACKSMITH_DIALOG: DialogTree = {
  id: 'blacksmith_dialog',
  startNodeId: 'greeting',
  nodes: {
    greeting: {
      id: 'greeting',
      speaker: 'Blacksmith Gareth',
      text: 'Welcome to my forge! Need something hammered?',
      choices: [
        { text: 'Can you repair my equipment?', nextNodeId: 'repair' },
        { text: 'I need better armor', nextNodeId: 'armor' },
        { text: 'Just looking around', nextNodeId: 'goodbye' }
      ]
    },
    repair: {
      id: 'repair',
      speaker: 'Blacksmith Gareth',
      text: 'Aye, I can fix up your gear. Bring me some iron ingots and I\'ll make it good as new!',
      choices: [
        { text: 'Here are the ingots', nextNodeId: 'repair_complete' },
        { text: 'I\'ll come back later', nextNodeId: 'goodbye' }
      ]
    },
    repair_complete: {
      id: 'repair_complete',
      speaker: 'Blacksmith Gareth',
      text: 'All done! Your equipment is as good as new.',
      choices: [
        { text: 'Thanks!', nextNodeId: 'goodbye' }
      ],
      consequences: [
        {
          type: 'setQuestFlag',
          flag: { key: 'equipment_repaired', value: true }
        }
      ]
    },
    armor: {
      id: 'armor',
      speaker: 'Blacksmith Gareth',
      text: 'I have some sturdy leather armor. Perfect for a warrior like yourself!',
      choices: [
        { text: 'I\'ll take it', nextNodeId: 'armor_trade' },
        { text: 'Not right now', nextNodeId: 'goodbye' }
      ]
    },
    armor_trade: {
      id: 'armor_trade',
      speaker: 'Blacksmith Gareth',
      text: 'Here you go! This armor has served many brave souls.',
      choices: [
        { text: 'Excellent craftsmanship', nextNodeId: 'goodbye' }
      ],
      consequences: [
        {
          type: 'giveItems',
          items: [{ id: 'armor_leather', quantity: 1 }]
        }
      ]
    },
    goodbye: {
      id: 'goodbye',
      speaker: 'Blacksmith Gareth',
      text: 'Come back if you need anything forged!',
      choices: [],
      consequences: [
        {
          type: 'endDialog'
        }
      ]
    }
  }
}

/**
 * Guard Dialog Tree
 * Brief guard interactions
 */
const GUARD_DIALOG: DialogTree = {
  id: 'guard_dialog',
  startNodeId: 'greeting',
  nodes: {
    greeting: {
      id: 'greeting',
      speaker: 'Town Guard',
      text: 'Halt! State your business.',
      choices: [
        { text: 'Just passing through', nextNodeId: 'pass' },
        { text: 'Any trouble around here?', nextNodeId: 'trouble' }
      ]
    },
    pass: {
      id: 'pass',
      speaker: 'Town Guard',
      text: 'Very well. Move along then.',
      choices: [],
      consequences: [
        {
          type: 'endDialog'
        }
      ]
    },
    trouble: {
      id: 'trouble',
      speaker: 'Town Guard',
      text: 'Goblins have been spotted near the forest. Be on your guard!',
      choices: [
        { text: 'I\'ll be careful', nextNodeId: 'pass' }
      ]
    }
  }
}

/**
 * DIALOGS Registry
 * Central registry of all dialog trees
 * 
 * @example
 * ```ts
 * const dialog = DIALOGS['merchant_dialog']
 * const startNode = dialog.nodes[dialog.startNodeId]
 * ```
 */
export const DIALOGS: Record<string, DialogTree> = {
  [MERCHANT_DIALOG.id]: MERCHANT_DIALOG,
  [BLACKSMITH_DIALOG.id]: BLACKSMITH_DIALOG,
  [GUARD_DIALOG.id]: GUARD_DIALOG
}

/**
 * Get a dialog tree by ID
 * 
 * @param id - Dialog tree ID
 * @returns Dialog tree or undefined if not found
 * 
 * @example
 * ```ts
 * const dialog = getDialogTree('merchant_dialog')
 * if (dialog) {
 *   console.log(dialog.nodes[dialog.startNodeId])
 * }
 * ```
 */
export const getDialogTree = (id: string): DialogTree | undefined => {
  return DIALOGS[id]
}

/**
 * Get a dialog node from a tree
 * 
 * @param treeId - Dialog tree ID
 * @param nodeId - Dialog node ID
 * @returns Dialog node or undefined if not found
 * 
 * @example
 * ```ts
 * const node = getDialogNode('merchant_dialog', 'greeting')
 * if (node) {
 *   console.log(node.text)
 * }
 * ```
 */
export const getDialogNode = (treeId: string, nodeId: string): DialogNode | undefined => {
  const tree = getDialogTree(treeId)
  return tree?.nodes[nodeId]
}

export default DIALOGS
