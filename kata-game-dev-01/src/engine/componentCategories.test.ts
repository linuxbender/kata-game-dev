import { describe, it, expect } from 'vitest'
import {
  ComponentCategory,
  COMPONENT_CATEGORIES,
  getComponentsInCategory,
  getCategoryForComponent,
  isComponentInCategory,
  getAllCategories,
  getComponentCategorySummary,
  type ComponentName,
} from './componentCategories'

describe('Component Categories', () => {
  describe('ComponentCategory Enum', () => {
    it('should define all expected categories', () => {
      expect(ComponentCategory.SPATIAL).toBe('spatial')
      expect(ComponentCategory.MOVEMENT).toBe('movement')
      expect(ComponentCategory.RENDERING).toBe('rendering')
      expect(ComponentCategory.COLLISION).toBe('collision')
      expect(ComponentCategory.PHYSICS).toBe('physics')
      expect(ComponentCategory.COMBAT).toBe('combat')
      expect(ComponentCategory.AI).toBe('ai')
      expect(ComponentCategory.INVENTORY).toBe('inventory')
      expect(ComponentCategory.EQUIPMENT).toBe('equipment')
      expect(ComponentCategory.METADATA).toBe('metadata')
    })

    it('should have unique category values', () => {
      const categories = Object.values(ComponentCategory)
      const uniqueCategories = new Set(categories)
      expect(categories.length).toBe(uniqueCategories.size)
    })

    it('should have valid string values', () => {
      Object.values(ComponentCategory).forEach(category => {
        expect(typeof category).toBe('string')
        expect(category).toBeTruthy()
      })
    })
  })

  describe('COMPONENT_CATEGORIES Mapping', () => {
    it('should map all components to categories', () => {
      expect(Object.keys(COMPONENT_CATEGORIES).length).toBeGreaterThan(0)
    })

    it('should map spatial components', () => {
      expect(COMPONENT_CATEGORIES['transform']).toBe(
        ComponentCategory.SPATIAL
      )
    })

    it('should map movement components', () => {
      expect(COMPONENT_CATEGORIES['velocity']).toBe(
        ComponentCategory.MOVEMENT
      )
    })

    it('should map rendering components', () => {
      expect(COMPONENT_CATEGORIES['renderable']).toBe(
        ComponentCategory.RENDERING
      )
      expect(COMPONENT_CATEGORIES['particleEmitter']).toBe(
        ComponentCategory.RENDERING
      )
    })

    it('should map collision components', () => {
      expect(COMPONENT_CATEGORIES['collider']).toBe(
        ComponentCategory.COLLISION
      )
    })

    it('should map combat components', () => {
      expect(COMPONENT_CATEGORIES['health']).toBe(ComponentCategory.COMBAT)
      expect(COMPONENT_CATEGORIES['damage']).toBe(ComponentCategory.COMBAT)
    })

    it('should map AI components', () => {
      expect(COMPONENT_CATEGORIES['ai']).toBe(ComponentCategory.AI)
    })

    it('should map inventory components', () => {
      expect(COMPONENT_CATEGORIES['inventory']).toBe(
        ComponentCategory.INVENTORY
      )
    })

    it('should map equipment components', () => {
      expect(COMPONENT_CATEGORIES['equipment']).toBe(
        ComponentCategory.EQUIPMENT
      )
    })

    it('should map metadata components', () => {
      expect(COMPONENT_CATEGORIES['stats']).toBe(ComponentCategory.METADATA)
      expect(COMPONENT_CATEGORIES['metadata']).toBe(ComponentCategory.METADATA)
      expect(COMPONENT_CATEGORIES['enemy']).toBe(ComponentCategory.METADATA)
    })

    it('should have valid category values', () => {
      Object.values(COMPONENT_CATEGORIES).forEach(category => {
        expect(Object.values(ComponentCategory)).toContain(category)
      })
    })
  })

  describe('getComponentsInCategory', () => {
    it('should return components in spatial category', () => {
      const spatial = getComponentsInCategory(ComponentCategory.SPATIAL)
      expect(spatial).toContain('transform')
      expect(spatial.length).toBeGreaterThan(0)
    })

    it('should return components in movement category', () => {
      const movement = getComponentsInCategory(ComponentCategory.MOVEMENT)
      expect(movement).toContain('velocity')
    })

    it('should return components in rendering category', () => {
      const rendering = getComponentsInCategory(ComponentCategory.RENDERING)
      expect(rendering).toContain('renderable')
      expect(rendering).toContain('particleEmitter')
    })

    it('should return components in collision category', () => {
      const collision = getComponentsInCategory(ComponentCategory.COLLISION)
      expect(collision).toContain('collider')
    })

    it('should return components in combat category', () => {
      const combat = getComponentsInCategory(ComponentCategory.COMBAT)
      expect(combat).toContain('health')
      expect(combat).toContain('damage')
      expect(combat.length).toBe(2)
    })

    it('should return components in AI category', () => {
      const ai = getComponentsInCategory(ComponentCategory.AI)
      expect(ai).toContain('ai')
    })

    it('should return components in inventory category', () => {
      const inventory = getComponentsInCategory(ComponentCategory.INVENTORY)
      expect(inventory).toContain('inventory')
    })

    it('should return components in equipment category', () => {
      const equipment = getComponentsInCategory(ComponentCategory.EQUIPMENT)
      expect(equipment).toContain('equipment')
    })

    it('should return components in metadata category', () => {
      const metadata = getComponentsInCategory(ComponentCategory.METADATA)
      expect(metadata).toContain('stats')
      expect(metadata).toContain('metadata')
      expect(metadata).toContain('enemy')
      expect(metadata.length).toBeGreaterThanOrEqual(3)
    })

    it('should return empty array for unused categories', () => {
      const physics = getComponentsInCategory(ComponentCategory.PHYSICS)
      expect(Array.isArray(physics)).toBe(true)
      expect(physics.length).toBe(0)
    })

    it('should return components as array', () => {
      const spatial = getComponentsInCategory(ComponentCategory.SPATIAL)
      expect(Array.isArray(spatial)).toBe(true)
    })

    it('should return unique components', () => {
      const combat = getComponentsInCategory(ComponentCategory.COMBAT)
      const uniqueComps = new Set(combat)
      expect(combat.length).toBe(uniqueComps.size)
    })
  })

  describe('getCategoryForComponent', () => {
    it('should return category for transform', () => {
      expect(getCategoryForComponent('transform')).toBe(
        ComponentCategory.SPATIAL
      )
    })

    it('should return category for velocity', () => {
      expect(getCategoryForComponent('velocity')).toBe(
        ComponentCategory.MOVEMENT
      )
    })

    it('should return category for health', () => {
      expect(getCategoryForComponent('health')).toBe(ComponentCategory.COMBAT)
    })

    it('should return category for renderable', () => {
      expect(getCategoryForComponent('renderable')).toBe(
        ComponentCategory.RENDERING
      )
    })

    it('should return category for all mapped components', () => {
      Object.keys(COMPONENT_CATEGORIES).forEach(comp => {
        const category = getCategoryForComponent(comp as ComponentName)
        expect(category).toBeDefined()
        expect(Object.values(ComponentCategory)).toContain(category)
      })
    })

    it('should return undefined for unknown component', () => {
      const category = getCategoryForComponent('unknownComponent' as any)
      expect(category).toBeUndefined()
    })
  })

  describe('isComponentInCategory', () => {
    it('should return true for transform in spatial', () => {
      expect(isComponentInCategory('transform', ComponentCategory.SPATIAL)).toBe(
        true
      )
    })

    it('should return true for velocity in movement', () => {
      expect(
        isComponentInCategory('velocity', ComponentCategory.MOVEMENT)
      ).toBe(true)
    })

    it('should return true for health in combat', () => {
      expect(isComponentInCategory('health', ComponentCategory.COMBAT)).toBe(
        true
      )
    })

    it('should return false for transform in movement', () => {
      expect(
        isComponentInCategory('transform', ComponentCategory.MOVEMENT)
      ).toBe(false)
    })

    it('should return false for velocity in spatial', () => {
      expect(isComponentInCategory('velocity', ComponentCategory.SPATIAL)).toBe(
        false
      )
    })

    it('should return false for health in movement', () => {
      expect(isComponentInCategory('health', ComponentCategory.MOVEMENT)).toBe(
        false
      )
    })

    it('should handle multiple components in same category', () => {
      expect(isComponentInCategory('health', ComponentCategory.COMBAT)).toBe(
        true
      )
      expect(isComponentInCategory('damage', ComponentCategory.COMBAT)).toBe(
        true
      )
    })

    it('should handle multiple components in same category (rendering)', () => {
      expect(
        isComponentInCategory('renderable', ComponentCategory.RENDERING)
      ).toBe(true)
      expect(
        isComponentInCategory('particleEmitter', ComponentCategory.RENDERING)
      ).toBe(true)
    })
  })

  describe('getAllCategories', () => {
    it('should return array of categories', () => {
      const categories = getAllCategories()
      expect(Array.isArray(categories)).toBe(true)
      expect(categories.length).toBeGreaterThan(0)
    })

    it('should return unique categories', () => {
      const categories = getAllCategories()
      const uniqueCategories = new Set(categories)
      expect(categories.length).toBe(uniqueCategories.size)
    })

    it('should include spatial category', () => {
      const categories = getAllCategories()
      expect(categories).toContain(ComponentCategory.SPATIAL)
    })

    it('should include all used categories', () => {
      const categories = getAllCategories()
      expect(categories).toContain(ComponentCategory.SPATIAL)
      expect(categories).toContain(ComponentCategory.MOVEMENT)
      expect(categories).toContain(ComponentCategory.RENDERING)
      expect(categories).toContain(ComponentCategory.COLLISION)
      expect(categories).toContain(ComponentCategory.COMBAT)
      expect(categories).toContain(ComponentCategory.AI)
      expect(categories).toContain(ComponentCategory.INVENTORY)
      expect(categories).toContain(ComponentCategory.EQUIPMENT)
      expect(categories).toContain(ComponentCategory.METADATA)
    })

    it('should not include unused physics category', () => {
      const categories = getAllCategories()
      // Physics is defined but has no components
      expect(categories).not.toContain(ComponentCategory.PHYSICS)
    })
  })

  describe('getComponentCategorySummary', () => {
    it('should return an object', () => {
      const summary = getComponentCategorySummary()
      expect(typeof summary).toBe('object')
      expect(summary).not.toBeNull()
    })

    it('should include all categories as keys', () => {
      const summary = getComponentCategorySummary()
      Object.values(ComponentCategory).forEach(category => {
        expect(summary).toHaveProperty(category)
      })
    })

    it('should have arrays as values', () => {
      const summary = getComponentCategorySummary()
      Object.values(summary).forEach(value => {
        expect(Array.isArray(value)).toBe(true)
      })
    })

    it('should map components correctly', () => {
      const summary = getComponentCategorySummary()
      expect(summary[ComponentCategory.SPATIAL]).toContain('transform')
      expect(summary[ComponentCategory.MOVEMENT]).toContain('velocity')
      expect(summary[ComponentCategory.COMBAT]).toContain('health')
      expect(summary[ComponentCategory.COMBAT]).toContain('damage')
    })

    it('should have empty array for unused physics category', () => {
      const summary = getComponentCategorySummary()
      expect(summary[ComponentCategory.PHYSICS]).toEqual([])
    })

    it('should have all components from mapping', () => {
      const summary = getComponentCategorySummary()
      const mappedComps = Object.keys(COMPONENT_CATEGORIES)
      const summaryComps = Object.values(summary).flat()

      expect(summaryComps.length).toBe(mappedComps.length)
      mappedComps.forEach(comp => {
        expect(summaryComps).toContain(comp)
      })
    })

    it('should match getComponentsInCategory results', () => {
      const summary = getComponentCategorySummary()

      Object.values(ComponentCategory).forEach(category => {
        const fromFunction = getComponentsInCategory(category)
        const fromSummary = summary[category]

        expect(fromSummary.length).toBe(fromFunction.length)
        fromFunction.forEach(comp => {
          expect(fromSummary).toContain(comp)
        })
      })
    })
  })

  describe('Integration Tests', () => {
    it('should handle querying by category then checking membership', () => {
      const combatComps = getComponentsInCategory(ComponentCategory.COMBAT)

      combatComps.forEach(comp => {
        expect(
          isComponentInCategory(comp, ComponentCategory.COMBAT)
        ).toBe(true)
        expect(getCategoryForComponent(comp)).toBe(ComponentCategory.COMBAT)
      })
    })

    it('should allow finding all categories with components', () => {
      const categories = getAllCategories()

      categories.forEach(category => {
        const comps = getComponentsInCategory(category)
        expect(comps.length).toBeGreaterThan(0)
      })
    })

    it('should support filtering components by multiple categories', () => {
      const spatialComps = getComponentsInCategory(ComponentCategory.SPATIAL)
      const movementComps = getComponentsInCategory(ComponentCategory.MOVEMENT)

      const allMovementRelated = [...spatialComps, ...movementComps]
      expect(allMovementRelated).toContain('transform')
      expect(allMovementRelated).toContain('velocity')
    })

    it('should support excluding components by category', () => {
      const allComps = Object.keys(COMPONENT_CATEGORIES)
      const metadataComps = getComponentsInCategory(ComponentCategory.METADATA)
      const nonMetadata = allComps.filter(comp => !metadataComps.includes(comp as any))

      expect(nonMetadata).toContain('transform')
      expect(nonMetadata).toContain('velocity')
      expect(nonMetadata).not.toContain('stats')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty category gracefully', () => {
      const physics = getComponentsInCategory(ComponentCategory.PHYSICS)
      expect(physics).toEqual([])
    })

    it('should be consistent across multiple calls', () => {
      const call1 = getComponentsInCategory(ComponentCategory.COMBAT)
      const call2 = getComponentsInCategory(ComponentCategory.COMBAT)
      expect(call1).toEqual(call2)
    })

    it('should handle all component names from mapping', () => {
      const allNames = Object.keys(COMPONENT_CATEGORIES)
      allNames.forEach(name => {
        const category = getCategoryForComponent(name as ComponentName)
        expect(category).toBeDefined()
      })
    })

    it('should maintain consistency between all functions', () => {
      const summary = getComponentCategorySummary()
      const allCategories = getAllCategories()

      // Every category in summary should be in getAllCategories (or empty)
      Object.entries(summary).forEach(([category, comps]) => {
        if (comps.length > 0) {
          expect(allCategories).toContain(category as ComponentCategory)
        }
      })
    })
  })
})

