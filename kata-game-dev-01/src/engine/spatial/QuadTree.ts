import type { Point } from '@components'
export type Rect = { x: number; y: number; w: number; h: number }
export type PointItem = Point & { entity: number }

export type QuadOptions = {
  mergeThreshold?: number // fraction [0..1] average occupancy per child under which merging is allowed (default 0.25)
  rebalanceInterval?: number // number of operations after which a batch rebalance is triggered (default 256)
  autoTune?: {
    enabled?: boolean
    intervalOps?: number // how often auto-tune runs (ops)
    targetOccupancyFraction?: number // desired occupancy fraction of capacity per child (0..1)
  }
  // Optional callback invoked when internal tuning parameters change
  onConfigChange?: (cfg: { mergeThreshold: number; rebalanceInterval: number }) => void
}

export type QuadMetrics = {
  opCounter: number
  splits: number
  merges: number
  nodes: number
  items: number
  avgItemsPerNode: number
  avgChildOccupancy?: number
}

export const createQuadTree = <T extends Point & { entity: number } = PointItem>(
  boundary: Rect,
  capacity = 8,
  maxDepth = 8,
  options?: QuadOptions
) => {
  type Node = {
    boundary: Rect
    items: T[]
    divided: boolean
    children?: [Node, Node, Node, Node]
    depth: number
    parent?: Node | null
  }

  // Tuning parameters
  let mergeThreshold = options?.mergeThreshold ?? 0.25
  let rebalanceInterval = options?.rebalanceInterval ?? 256
  const autoTuneEnabled = options?.autoTune?.enabled ?? true
  const autoTuneInterval = options?.autoTune?.intervalOps ?? (rebalanceInterval * 4)
  const targetOccupancyFraction = options?.autoTune?.targetOccupancyFraction ?? 0.5

  const makeNode = (b: Rect, depth = 0, parent: Node | null = null): Node => ({ boundary: b, items: [], divided: false, depth, parent })

  const root = makeNode(boundary, 0, null)

  // Map to find the node that currently holds an entity for O(1) updates/removals
  const entityMap = new Map<number, Node>()

  // Operation & event counters for auto-tuning metrics
  let opCounter = 0
  let splits = 0
  let merges = 0

  const contains = (r: Rect, p: Point) => {
    return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h
  }

  const intersects = (a: Rect, b: Rect) => {
    return !(b.x > a.x + a.w || b.x + b.w < a.x || b.y > a.y + a.h || b.y + b.h < a.y)
  }

  const subdivide = (node: Node) => {
    const { x, y, w, h } = node.boundary
    const hw = w / 2
    const hh = h / 2
    node.children = [
      makeNode({ x: x, y: y, w: hw, h: hh }, node.depth + 1, node), // nw
      makeNode({ x: x + hw, y: y, w: hw, h: hh }, node.depth + 1, node), // ne
      makeNode({ x: x, y: y + hh, w: hw, h: hh }, node.depth + 1, node), // sw
      makeNode({ x: x + hw, y: y + hh, w: hw, h: hh }, node.depth + 1, node) // se
    ]
    node.divided = true

    // Move existing items into children if possible and update entityMap
    const old = node.items.slice()
    node.items.length = 0
    for (const item of old) {
      let inserted = false
      for (const child of node.children!) {
        if (contains(child.boundary, item)) {
          child.items.push(item)
          entityMap.set(item.entity, child)
          inserted = true
          break
        }
      }
      if (!inserted) {
        // If none of the children contain the item (edge case), keep it at parent
        node.items.push(item)
        entityMap.set(item.entity, node)
      }
    }

    splits++
  }

  // Merge child nodes back into parent when underutilized
  const tryMerge = (node: Node) => {
    if (!node.divided || !node.children) return
    // if any child is divided, we won't merge
    for (const c of node.children) if (c.divided) return

    // count total items in children
    let totalChildrenItems = 0
    for (const c of node.children) totalChildrenItems += c.items.length

    // average occupancy per child
    const avgPerChild = totalChildrenItems / 4
    // merge if below threshold (relative to capacity)
    if (avgPerChild <= capacity * mergeThreshold) {
      // move all child items into parent
      for (const c of node.children) {
        for (const it of c.items) {
          node.items.push(it)
          entityMap.set(it.entity, node)
        }
      }
      // remove children
      node.children = undefined
      node.divided = false
      merges++
    }
  }

  const insertNode = (node: Node, item: T): boolean => {
    if (!contains(node.boundary, item)) return false

    if (node.items.length < capacity || node.depth >= maxDepth) {
      node.items.push(item)
      entityMap.set(item.entity, node)
      opCounter++
      maybeAutoTune()
      maybeRebalance()
      return true
    }

    if (!node.divided) subdivide(node)

    // try children
    for (const child of node.children!) {
      if (insertNode(child, item)) return true
    }

    // fallback (shouldn't usually happen)
    node.items.push(item)
    entityMap.set(item.entity, node)
    opCounter++
    maybeAutoTune()
    maybeRebalance()
    return true
  }

  const insert = (item: T) => insertNode(root, item)

  const remove = (entity: number) => {
    const node = entityMap.get(entity)
    if (!node) return false
    const idx = node.items.findIndex(i => i.entity === entity)
    if (idx >= 0) {
      node.items.splice(idx, 1)
      entityMap.delete(entity)
      opCounter++
      // attempt to merge up the tree
      let p = node.parent
      while (p) {
        tryMerge(p)
        p = p.parent
      }
      maybeAutoTune()
      maybeRebalance()
      return true
    }
    // If not found in the recorded node (shouldn't happen), search whole tree
    const found = queryNode(root, root.boundary, []).find(i => i.entity === entity)
    if (found) {
      // find node again and remove
      const n = entityMap.get(entity)
      if (n) {
        const j = n.items.findIndex(it => it.entity === entity)
        if (j >= 0) n.items.splice(j, 1)
      }
      entityMap.delete(entity)
      opCounter++
      maybeAutoTune()
      maybeRebalance()
      return true
    }

    return false
  }

  const update = (entity: number, x: number, y: number) => {
    const node = entityMap.get(entity)
    if (!node) {
      // Not present, insert fresh
      insert({ x, y, entity } as T)
      return true
    }

    // Find the item and update or move it if it moved out of node boundary
    const idx = node.items.findIndex(i => i.entity === entity)
    if (idx >= 0) {
      const item = node.items[idx]
      // If still in node boundary, update coordinates
      if (x >= node.boundary.x && x <= node.boundary.x + node.boundary.w && y >= node.boundary.y && y <= node.boundary.y + node.boundary.h) {
        item.x = x
        item.y = y
        opCounter++
        maybeAutoTune()
        maybeRebalance()
        return true
      }
      // Otherwise remove and re-insert from root
      node.items.splice(idx, 1)
      entityMap.delete(entity)
      insert({ x, y, entity } as T)
      // attempt merges up the old parent
      let p = node.parent
      while (p) {
        tryMerge(p)
        p = p.parent
      }
      maybeAutoTune()
      maybeRebalance()
      return true
    }

    // Not found in node.items (shouldn't happen) — fallback to insert
    insert({ x, y, entity } as T)
    return true
  }

  const clearNode = (node: Node) => {
    node.items.length = 0
    if (node.divided && node.children) {
      for (const c of node.children) clearNode(c)
      node.divided = false
      node.children = undefined
    }
  }

  const clear = () => {
    clearNode(root)
    entityMap.clear()
    opCounter = 0
    splits = 0
    merges = 0
  }

  const queryNode = (node: Node, range: Rect, found: T[]) => {
    if (!intersects(node.boundary, range)) return found

    for (const it of node.items) {
      if (it.x >= range.x && it.x <= range.x + range.w && it.y >= range.y && it.y <= range.y + range.h) {
        found.push(it)
      }
    }

    if (node.divided && node.children) {
      for (const c of node.children) queryNode(c, range, found)
    }
    return found
  }

  const query = (range: Rect) => queryNode(root, range, [])

  const getRoot = () => root

  const has = (entity: number) => entityMap.has(entity)

  // Compute metrics by traversing the tree
  const computeMetrics = (): QuadMetrics => {
    let nodes = 0
    let items = 0
    let childOccupancySum = 0
    let childCounted = 0

    const walk = (node: Node) => {
      nodes++
      items += node.items.length
      if (node.divided && node.children) {
        let totalChildrenItems = 0
        for (const c of node.children) totalChildrenItems += c.items.length
        childOccupancySum += totalChildrenItems / 4
        childCounted++
        for (const c of node.children) walk(c)
      }
    }

    walk(root)

    const avgItemsPerNode = nodes ? items / nodes : 0
    const avgChildOccupancy = childCounted ? childOccupancySum / childCounted : undefined

    return {
      opCounter,
      splits,
      merges,
      nodes,
      items,
      avgItemsPerNode,
      avgChildOccupancy
    }
  }

  // Auto-tune algorithm: adjust mergeThreshold and rebalanceInterval based on metrics
  const autoTune = () => {
    if (!autoTuneEnabled) return
    const m = computeMetrics()

    // If there are no child nodes, not much to tune
    if (!m.avgChildOccupancy) return

    // Compare observed avg child occupancy to target (in logical units: items per child)
    const target = capacity * targetOccupancyFraction
    const observed = m.avgChildOccupancy

    // Adjust mergeThreshold slightly towards a value where observed ~= target
    // If observed << target => increase mergeAggressiveness (raise mergeThreshold)
    // If observed >> target => decrease mergeThreshold
    const ratio = observed / (target || 1)
    const adjustFactor = Math.min(1.2, Math.max(0.8, 1 / (ratio || 1))) // clamp small adjustments
    mergeThreshold = Math.max(0.05, Math.min(0.9, mergeThreshold * adjustFactor))

    // Adjust rebalanceInterval based on merge rate: if many merges happening, rebalance more often
    const mergeRate = m.merges / Math.max(1, m.opCounter)
    if (mergeRate > 0.01) {
      // too many merges: rebalance more often (reduce interval)
      rebalanceInterval = Math.max(16, Math.floor(rebalanceInterval * 0.8))
    } else if (mergeRate < 0.001) {
      // too few merges: increase interval to save CPU
      rebalanceInterval = Math.min(4096, Math.floor(rebalanceInterval * 1.25))
    }

    // Notify external listener about changed config so it can persist.
    try { options?.onConfigChange?.({ mergeThreshold, rebalanceInterval }) } catch (e) { /* noop */ }
  }

  // Rebalance: walk the tree bottom-up and attempt merges where threshold applies
  const rebalanceNode = (node: Node) => {
    if (!node.divided || !node.children) return
    for (const c of node.children) rebalanceNode(c)
    tryMerge(node)
  }

  const maybeRebalance = () => {
    if (opCounter >= rebalanceInterval) {
      rebalanceNode(root)
      opCounter = 0
    }
  }

  const maybeAutoTune = () => {
    if (!autoTuneEnabled) return
    if (opCounter >= autoTuneInterval) {
      autoTune()
      // reset opCounter so tuning interval repeats
      opCounter = 0
      // reset split/merge counters to keep rates recent
      splits = 0
      merges = 0
    }
  }

  const getMetrics = (): QuadMetrics => computeMetrics()

  return { insert, remove, update, clear, query, getRoot, has, getMetrics }
}
