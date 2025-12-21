import { describe, it, expect } from 'vitest'
import {
  DIALOGS,
  getDialogTree,
  getDialogNode,
  type DialogTree,
  type DialogNode,
  type DialogChoice,
  type DialogConsequence
} from './DialogConfig'

describe('DialogConfig', () => {
  describe('DIALOGS Registry', () => {
    it('exports a registry with expected dialog trees', () => {
      expect(Object.keys(DIALOGS).length).toBeGreaterThan(0)
      expect(DIALOGS['merchant_dialog']).toBeDefined()
      expect(DIALOGS['blacksmith_dialog']).toBeDefined()
      expect(DIALOGS['guard_dialog']).toBeDefined()
    })

    it('each dialog tree has required properties', () => {
      Object.values(DIALOGS).forEach(dialog => {
        expect(dialog.id).toBeDefined()
        expect(dialog.startNodeId).toBeDefined()
        expect(dialog.nodes).toBeDefined()
        expect(typeof dialog.nodes).toBe('object')
      })
    })
  })

  describe('Merchant Dialog', () => {
    const merchantDialog = DIALOGS['merchant_dialog']

    it('has a valid start node', () => {
      expect(merchantDialog.startNodeId).toBe('greeting')
      expect(merchantDialog.nodes[merchantDialog.startNodeId]).toBeDefined()
    })

    it('greeting node has correct structure', () => {
      const greeting = merchantDialog.nodes['greeting']
      expect(greeting.id).toBe('greeting')
      expect(greeting.speaker).toBe('Merchant John')
      expect(greeting.text).toBeTruthy()
      expect(Array.isArray(greeting.choices)).toBe(true)
      expect(greeting.choices.length).toBeGreaterThan(0)
    })

    it('all choices point to valid nodes', () => {
      Object.values(merchantDialog.nodes).forEach(node => {
        node.choices.forEach(choice => {
          expect(merchantDialog.nodes[choice.nextNodeId]).toBeDefined()
        })
      })
    })

    it('buy_potions node has giveItems consequence', () => {
      const node = merchantDialog.nodes['buy_potions']
      expect(node.consequences).toBeDefined()
      expect(node.consequences!.length).toBeGreaterThan(0)
      const giveItemsConsequence = node.consequences!.find(c => c.type === 'giveItems')
      expect(giveItemsConsequence).toBeDefined()
      expect(giveItemsConsequence!.items).toBeDefined()
      expect(giveItemsConsequence!.items!.length).toBeGreaterThan(0)
    })

    it('quest_accept node has setQuestFlag consequence', () => {
      const node = merchantDialog.nodes['quest_accept']
      expect(node.consequences).toBeDefined()
      const questFlagConsequence = node.consequences!.find(c => c.type === 'setQuestFlag')
      expect(questFlagConsequence).toBeDefined()
      expect(questFlagConsequence!.flag).toBeDefined()
      expect(questFlagConsequence!.flag!.key).toBe('orc_fortress_quest')
      expect(questFlagConsequence!.flag!.value).toBe('accepted')
    })

    it('goodbye node has endDialog consequence', () => {
      const node = merchantDialog.nodes['goodbye']
      expect(node.consequences).toBeDefined()
      const endConsequence = node.consequences!.find(c => c.type === 'endDialog')
      expect(endConsequence).toBeDefined()
    })
  })

  describe('Blacksmith Dialog', () => {
    const blacksmithDialog = DIALOGS['blacksmith_dialog']

    it('has a valid start node', () => {
      expect(blacksmithDialog.startNodeId).toBe('greeting')
      expect(blacksmithDialog.nodes[blacksmithDialog.startNodeId]).toBeDefined()
    })

    it('greeting node speaker is Blacksmith Gareth', () => {
      const greeting = blacksmithDialog.nodes['greeting']
      expect(greeting.speaker).toBe('Blacksmith Gareth')
    })

    it('all choices point to valid nodes', () => {
      Object.values(blacksmithDialog.nodes).forEach(node => {
        node.choices.forEach(choice => {
          expect(blacksmithDialog.nodes[choice.nextNodeId]).toBeDefined()
        })
      })
    })

    it('armor_trade node has giveItems consequence', () => {
      const node = blacksmithDialog.nodes['armor_trade']
      expect(node.consequences).toBeDefined()
      const giveItemsConsequence = node.consequences!.find(c => c.type === 'giveItems')
      expect(giveItemsConsequence).toBeDefined()
      expect(giveItemsConsequence!.items).toBeDefined()
      const armorItem = giveItemsConsequence!.items!.find(i => i.id === 'armor_leather')
      expect(armorItem).toBeDefined()
    })
  })

  describe('Guard Dialog', () => {
    const guardDialog = DIALOGS['guard_dialog']

    it('has a valid start node', () => {
      expect(guardDialog.startNodeId).toBe('greeting')
      expect(guardDialog.nodes[guardDialog.startNodeId]).toBeDefined()
    })

    it('all choices point to valid nodes', () => {
      Object.values(guardDialog.nodes).forEach(node => {
        node.choices.forEach(choice => {
          expect(guardDialog.nodes[choice.nextNodeId]).toBeDefined()
        })
      })
    })
  })

  describe('Helper Functions', () => {
    it('getDialogTree returns correct dialog tree', () => {
      const dialog = getDialogTree('merchant_dialog')
      expect(dialog).toBeDefined()
      expect(dialog?.id).toBe('merchant_dialog')
    })

    it('getDialogTree returns undefined for invalid ID', () => {
      const dialog = getDialogTree('nonexistent_dialog')
      expect(dialog).toBeUndefined()
    })

    it('getDialogNode returns correct node', () => {
      const node = getDialogNode('merchant_dialog', 'greeting')
      expect(node).toBeDefined()
      expect(node?.id).toBe('greeting')
      expect(node?.speaker).toBe('Merchant John')
    })

    it('getDialogNode returns undefined for invalid tree ID', () => {
      const node = getDialogNode('nonexistent_dialog', 'greeting')
      expect(node).toBeUndefined()
    })

    it('getDialogNode returns undefined for invalid node ID', () => {
      const node = getDialogNode('merchant_dialog', 'nonexistent_node')
      expect(node).toBeUndefined()
    })
  })

  describe('Dialog Navigation', () => {
    it('can navigate through merchant dialog tree', () => {
      const dialog = getDialogTree('merchant_dialog')!
      
      // Start at greeting
      let currentNode = dialog.nodes[dialog.startNodeId]
      expect(currentNode.id).toBe('greeting')
      
      // Choose first option (shop)
      const shopChoice = currentNode.choices.find(c => c.nextNodeId === 'shop')
      expect(shopChoice).toBeDefined()
      
      currentNode = dialog.nodes[shopChoice!.nextNodeId]
      expect(currentNode.id).toBe('shop')
      expect(currentNode.speaker).toBe('Merchant John')
    })

    it('can reach end node with endDialog consequence', () => {
      const dialog = getDialogTree('merchant_dialog')!
      const goodbyeNode = dialog.nodes['goodbye']
      
      expect(goodbyeNode.consequences).toBeDefined()
      expect(goodbyeNode.consequences!.some(c => c.type === 'endDialog')).toBe(true)
    })
  })
})
