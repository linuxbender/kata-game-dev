import { describe, it, expect } from 'vitest'
import ITEM_CATALOG, { getItemDefinition, createItemInstance } from './ItemConfig'

describe('ItemConfig', () => {
  it('exports a catalog with expected keys', () => {
    expect(Object.keys(ITEM_CATALOG).length).toBeGreaterThan(0)
    expect(ITEM_CATALOG['sword_iron']).toBeDefined()
    expect(ITEM_CATALOG['potion_health']).toBeDefined()
  })

  it('getItemDefinition returns correct item', () => {
    const def = getItemDefinition('sword_iron')
    expect(def).toBeDefined()
    expect(def?.type).toBe('weapon')
    expect(def?.stats?.attack).toBeGreaterThan(0)
  })

  it('createItemInstance produces an inventory item shape', () => {
    const inst = createItemInstance('potion_health', 3)
    expect(inst.id).toBe('potion_health')
    expect(inst.quantity).toBe(3)
    expect(inst.uid).toContain('potion_health_#')
  })
})

