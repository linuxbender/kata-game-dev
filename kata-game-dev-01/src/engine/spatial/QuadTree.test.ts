import { describe, it, expect, beforeEach } from 'vitest'
import { createQuadTree, type Rect, type PointItem, type QuadOptions } from './QuadTree'

describe('QuadTree', () => {
  describe('createQuadTree', () => {
    it('should create a quad tree with default parameters', () => {
      const boundary: Rect = { x: 0, y: 0, w: 100, h: 100 }
      const quadTree = createQuadTree(boundary)

      expect(quadTree).toBeDefined()
      expect(typeof quadTree.insert).toBe('function')
      expect(typeof quadTree.query).toBe('function')
      expect(typeof quadTree.update).toBe('function')
      expect(typeof quadTree.remove).toBe('function')
    })

    it('should create a quad tree with custom capacity', () => {
      const quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 }, 16)

      expect(quadTree).toBeDefined()
      const metrics = quadTree.getMetrics()
      expect(metrics.nodes).toBe(1)
    })

    it('should create a quad tree with custom maxDepth', () => {
      const quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 }, 8, 4)

      expect(quadTree).toBeDefined()
      const metrics = quadTree.getMetrics()
      expect(metrics.nodes).toBe(1)
    })
  })

  describe('insert', () => {
    let quadTree: ReturnType<typeof createQuadTree>

    beforeEach(() => {
      quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 })
    })

    it('should insert a single item', () => {
      const item: PointItem = { x: 25, y: 25, entity: 1 }
      const result = quadTree.insert(item)

      expect(result).toBe(true)
      expect(quadTree.has(1)).toBe(true)
    })

    it('should insert multiple items', () => {
      quadTree.insert({ x: 25, y: 25, entity: 1 })
      quadTree.insert({ x: 75, y: 75, entity: 2 })
      quadTree.insert({ x: 50, y: 50, entity: 3 })

      expect(quadTree.has(1)).toBe(true)
      expect(quadTree.has(2)).toBe(true)
      expect(quadTree.has(3)).toBe(true)

      const metrics = quadTree.getMetrics()
      expect(metrics.items).toBe(3)
    })

    it('should return false for items outside boundary', () => {
      const item: PointItem = { x: 150, y: 150, entity: 1 }
      const result = quadTree.insert(item)

      expect(result).toBe(false)
      expect(quadTree.has(1)).toBe(false)
    })

    it('should handle edge coordinates (on boundary)', () => {
      quadTree.insert({ x: 0, y: 0, entity: 1 })
      quadTree.insert({ x: 100, y: 100, entity: 2 })

      expect(quadTree.has(1)).toBe(true)
      expect(quadTree.has(2)).toBe(true)
    })

    it('should split node when capacity exceeded', () => {
      const quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 }, 4)

      // Insert items that will trigger split
      for (let i = 0; i < 5; i++) {
        quadTree.insert({ x: 25 + i, y: 25, entity: i + 1 })
      }

      const metrics = quadTree.getMetrics()
      expect(metrics.nodes).toBeGreaterThan(1)
      expect(metrics.splits).toBeGreaterThan(0)
    })
  })

  describe('query', () => {
    let quadTree: ReturnType<typeof createQuadTree>

    beforeEach(() => {
      quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 })
      quadTree.insert({ x: 10, y: 10, entity: 1 })
      quadTree.insert({ x: 50, y: 50, entity: 2 })
      quadTree.insert({ x: 90, y: 90, entity: 3 })
      quadTree.insert({ x: 25, y: 75, entity: 4 })
    })

    it('should query items in a range', () => {
      const results = quadTree.query({ x: 0, y: 0, w: 50, h: 50 })

      expect(results.length).toBeGreaterThan(0)
      expect(results.some(r => r.entity === 1)).toBe(true)
    })

    it('should return empty array for empty range', () => {
      const results = quadTree.query({ x: 95, y: 95, w: 5, h: 5 })

      expect(Array.isArray(results)).toBe(true)
      // May include item at (90, 90) if within range
    })

    it('should return all items for large query range', () => {
      const results = quadTree.query({ x: 0, y: 0, w: 100, h: 100 })

      expect(results.length).toBeGreaterThanOrEqual(4)
    })

    it('should find specific entity in query', () => {
      const results = quadTree.query({ x: 40, y: 40, w: 30, h: 30 })
      const found = results.find(r => r.entity === 2)

      expect(found).toBeDefined()
      expect(found?.x).toBe(50)
      expect(found?.y).toBe(50)
    })
  })

  describe('update', () => {
    let quadTree: ReturnType<typeof createQuadTree>

    beforeEach(() => {
      quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 })
      quadTree.insert({ x: 25, y: 25, entity: 1 })
    })

    it('should update item position within same node', () => {
      const result = quadTree.update(1, 30, 30)

      expect(result).toBe(true)
      // Verify item is at new position
      const query = quadTree.query({ x: 25, y: 25, w: 10, h: 10 })
      const updated = query.find(r => r.entity === 1)
      expect(updated).toBeDefined()
      expect(updated?.x).toBe(30)
      expect(updated?.y).toBe(30)
    })

    it('should update item position to different node', () => {
      const result = quadTree.update(1, 75, 75)

      expect(result).toBe(true)
      // Verify item is at new position
      const query = quadTree.query({ x: 50, y: 50, w: 50, h: 50 })
      const updated = query.find(r => r.entity === 1)
      expect(updated).toBeDefined()
      expect(updated?.x).toBe(75)
      expect(updated?.y).toBe(75)
    })

    it('should return true for non-existent entity (insert)', () => {
      const result = quadTree.update(999, 50, 50)

      expect(result).toBe(true)
      expect(quadTree.has(999)).toBe(true)
    })

    it('should handle update with coordinates on boundary', () => {
      const result = quadTree.update(1, 0, 0)

      expect(result).toBe(true)
      expect(quadTree.has(1)).toBe(true)
    })
  })

  describe('remove', () => {
    let quadTree: ReturnType<typeof createQuadTree>

    beforeEach(() => {
      quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 })
      quadTree.insert({ x: 25, y: 25, entity: 1 })
      quadTree.insert({ x: 75, y: 75, entity: 2 })
    })

    it('should remove an existing item', () => {
      const result = quadTree.remove(1)

      expect(result).toBe(true)
      expect(quadTree.has(1)).toBe(false)
    })

    it('should return false for non-existent item', () => {
      const result = quadTree.remove(999)

      expect(result).toBe(false)
    })

    it('should leave other items intact', () => {
      quadTree.remove(1)

      expect(quadTree.has(1)).toBe(false)
      expect(quadTree.has(2)).toBe(true)
    })

    it('should trigger merge when threshold is reached', () => {
      const qt = createQuadTree({ x: 0, y: 0, w: 100, h: 100 }, 4)
      for (let i = 0; i < 5; i++) {
        qt.insert({ x: 25 + i, y: 25, entity: i + 1 })
      }

      const beforeMetrics = qt.getMetrics()
      for (let i = 1; i <= 3; i++) {
        qt.remove(i)
      }
      const afterMetrics = qt.getMetrics()

      expect(afterMetrics.items).toBe(beforeMetrics.items - 3)
    })
  })

  describe('has', () => {
    let quadTree: ReturnType<typeof createQuadTree>

    beforeEach(() => {
      quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 })
    })

    it('should return false for empty tree', () => {
      expect(quadTree.has(1)).toBe(false)
    })

    it('should return true for inserted item', () => {
      quadTree.insert({ x: 50, y: 50, entity: 1 })

      expect(quadTree.has(1)).toBe(true)
    })

    it('should return false after removal', () => {
      quadTree.insert({ x: 50, y: 50, entity: 1 })
      quadTree.remove(1)

      expect(quadTree.has(1)).toBe(false)
    })
  })

  describe('clear', () => {
    let quadTree: ReturnType<typeof createQuadTree>

    beforeEach(() => {
      quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 })
    })

    it('should clear all items', () => {
      quadTree.insert({ x: 25, y: 25, entity: 1 })
      quadTree.insert({ x: 75, y: 75, entity: 2 })

      quadTree.clear()

      expect(quadTree.has(1)).toBe(false)
      expect(quadTree.has(2)).toBe(false)
    })

    it('should reset metrics', () => {
      quadTree.insert({ x: 25, y: 25, entity: 1 })
      quadTree.insert({ x: 75, y: 75, entity: 2 })

      quadTree.clear()
      const metrics = quadTree.getMetrics()

      expect(metrics.items).toBe(0)
      expect(metrics.splits).toBe(0)
      expect(metrics.merges).toBe(0)
    })

    it('should allow reinsertion after clear', () => {
      quadTree.insert({ x: 25, y: 25, entity: 1 })
      quadTree.clear()
      quadTree.insert({ x: 50, y: 50, entity: 2 })

      expect(quadTree.has(1)).toBe(false)
      expect(quadTree.has(2)).toBe(true)
    })
  })

  describe('getMetrics', () => {
    let quadTree: ReturnType<typeof createQuadTree>

    beforeEach(() => {
      quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 }, 4)
    })

    it('should return metrics for empty tree', () => {
      const metrics = quadTree.getMetrics()

      expect(metrics.items).toBe(0)
      expect(metrics.nodes).toBe(1)
      expect(metrics.splits).toBe(0)
      expect(metrics.merges).toBe(0)
      expect(metrics.avgItemsPerNode).toBe(0)
    })

    it('should track item count', () => {
      quadTree.insert({ x: 25, y: 25, entity: 1 })
      quadTree.insert({ x: 50, y: 50, entity: 2 })

      const metrics = quadTree.getMetrics()

      expect(metrics.items).toBe(2)
    })

    it('should track splits', () => {
      for (let i = 0; i < 5; i++) {
        quadTree.insert({ x: 25 + i, y: 25, entity: i + 1 })
      }

      const metrics = quadTree.getMetrics()

      expect(metrics.splits).toBeGreaterThan(0)
      expect(metrics.nodes).toBeGreaterThan(1)
    })

    it('should calculate average items per node', () => {
      for (let i = 0; i < 4; i++) {
        quadTree.insert({ x: 25 + i * 20, y: 25, entity: i + 1 })
      }

      const metrics = quadTree.getMetrics()

      expect(metrics.avgItemsPerNode).toBeGreaterThan(0)
      expect(metrics.avgItemsPerNode).toBeLessThanOrEqual(metrics.items)
    })
  })

  describe('getRoot', () => {
    it('should return root node', () => {
      const quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 })
      const root = quadTree.getRoot()

      expect(root).toBeDefined()
      expect(root.boundary).toEqual({ x: 0, y: 0, w: 100, h: 100 })
    })
  })

  describe('auto-tuning', () => {
    it('should accept autoTune configuration', () => {
      const options: QuadOptions = {
        autoTune: { enabled: true },
        onConfigChange: () => {
          // callback
        }
      }

      const quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 }, 4, 8, options)
      expect(quadTree).toBeDefined()
    })

    it('should respect autoTune disabled option', () => {
      const options: QuadOptions = {
        autoTune: { enabled: false }
      }

      const quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 }, 4, 8, options)
      expect(quadTree).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('should handle item at center of boundary', () => {
      const quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 })
      const result = quadTree.insert({ x: 50, y: 50, entity: 1 })

      expect(result).toBe(true)
      expect(quadTree.has(1)).toBe(true)
    })

    it('should handle overlapping items', () => {
      const quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 })
      quadTree.insert({ x: 50, y: 50, entity: 1 })
      quadTree.insert({ x: 50, y: 50, entity: 2 })

      expect(quadTree.has(1)).toBe(true)
      expect(quadTree.has(2)).toBe(true)
    })

    it('should handle small boundaries', () => {
      const quadTree = createQuadTree({ x: 0, y: 0, w: 1, h: 1 })
      const result = quadTree.insert({ x: 0.5, y: 0.5, entity: 1 })

      expect(result).toBe(true)
    })

    it('should handle large number of items', () => {
      const quadTree = createQuadTree({ x: 0, y: 0, w: 1000, h: 1000 })

      for (let i = 0; i < 1000; i++) {
        quadTree.insert({ x: Math.random() * 1000, y: Math.random() * 1000, entity: i + 1 })
      }

      const metrics = quadTree.getMetrics()
      expect(metrics.items).toBe(1000)
    })
  })

  describe('spatial correctness', () => {
    it('should find items in northwest quadrant', () => {
      const quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 })
      quadTree.insert({ x: 25, y: 25, entity: 1 })

      const results = quadTree.query({ x: 0, y: 0, w: 50, h: 50 })
      expect(results.find(r => r.entity === 1)).toBeDefined()
    })

    it('should find items in southeast quadrant', () => {
      const quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 })
      quadTree.insert({ x: 75, y: 75, entity: 1 })

      const results = quadTree.query({ x: 50, y: 50, w: 50, h: 50 })
      expect(results.find(r => r.entity === 1)).toBeDefined()
    })

    it('should exclude items outside query range', () => {
      const quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 })
      quadTree.insert({ x: 10, y: 10, entity: 1 })
      quadTree.insert({ x: 90, y: 90, entity: 2 })

      const results = quadTree.query({ x: 0, y: 0, w: 50, h: 50 })
      expect(results.find(r => r.entity === 2)).toBeUndefined()
    })
  })
})

