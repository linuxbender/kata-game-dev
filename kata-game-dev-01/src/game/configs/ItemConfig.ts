// ItemConfig.ts
// Central item definitions and catalog for the game.

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface ItemStats {
  attack?: number
  defense?: number
  healing?: number
  durability?: number
  [key: string]: number | undefined
}

export interface ItemDefinition {
  id: string
  name: string
  description?: string
  type: 'weapon' | 'consumable' | 'armor' | 'material' | 'key'
  rarity?: ItemRarity
  stackable?: boolean
  maxStack?: number
  stats?: ItemStats
  weight?: number
  value?: number
}

export type InventoryItem = {
  id: string // item id from catalog
  uid: string // unique instance id in inventory (for non-stackables)
  quantity: number
  durability?: number
}

// Small helper to create unique instance ids (for tests / factories)
export const createItemInstance = (id: string, quantity = 1, durability?: number): InventoryItem => ({
  id,
  uid: `${id}_#${Math.random().toString(36).slice(2, 9)}`,
  quantity,
  durability,
})

// ITEM_CATALOG: single source of truth for item metadata
export const ITEM_CATALOG: Record<string, ItemDefinition> = {
  'sword_iron': {
    id: 'sword_iron',
    name: 'Iron Sword',
    description: 'A basic iron sword. Reliable for early combat.',
    type: 'weapon',
    rarity: 'common',
    stackable: false,
    stats: {
      attack: 8,
      durability: 120,
    },
    weight: 6,
    value: 35,
  },

  'potion_health': {
    id: 'potion_health',
    name: 'Health Potion',
    description: 'Restores a small amount of health.',
    type: 'consumable',
    rarity: 'common',
    stackable: true,
    maxStack: 20,
    stats: {
      healing: 25,
    },
    weight: 0.25,
    value: 8,
  },

  'armor_leather': {
    id: 'armor_leather',
    name: 'Leather Armor',
    description: 'Lightweight armor offering basic protection.',
    type: 'armor',
    rarity: 'uncommon',
    stackable: false,
    stats: {
      defense: 6,
      durability: 200,
    },
    weight: 8,
    value: 60,
  },

  'key_common': {
    id: 'key_common',
    name: 'Old Key',
    description: 'Opens an old door somewhere.',
    type: 'key',
    rarity: 'common',
    stackable: false,
    weight: 0.1,
    value: 0,
  },

  'iron_ingot': {
    id: 'iron_ingot',
    name: 'Iron Ingot',
    description: 'Basic crafting material.',
    type: 'material',
    rarity: 'common',
    stackable: true,
    maxStack: 99,
    weight: 1.0,
    value: 5,
  }
}

export const getItemDefinition = (id: string): ItemDefinition | undefined => ITEM_CATALOG[id]

export default ITEM_CATALOG

