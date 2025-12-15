// Simple generic QuadTree implementation for spatial partitioning.
// Arrow-style factory returning an object with insert/clear/query/update/remove methods.
// Adds merge-threshold and batch rebalancing options for performance and stability.

export type Rect = { x: number; y: number; w: number; h: number }
export type PointItem = { x: number; y: number; entity: number }

export type QuadOptions = {
  mergeThreshold?: number // fraction [0..1] average occupancy per child under which merging is allowed (default 0.25)
  rebalanceInterval?: number // number of operations after which a batch rebalance is triggered (default 256)
}

export const createQuadTree = <T extends { x: number; y: number; entity: number } = PointItem>(
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

  const mergeThreshold = options?.mergeThreshold ?? 0.25
  const rebalanceInterval = options?.rebalanceInterval ?? 256

  const makeNode = (b: Rect, depth = 0, parent: Node | null = null): Node => ({ boundary: b, items: [], divided: false, depth, parent })

  const root = makeNode(boundary, 0, null)

  // Map to find the node that currently holds an entity for O(1) updates/removals
  const entityMap = new Map<number, Node>()

  // Operation counter for batch rebalancing
  let opCounter = 0

  const contains = (r: Rect, p: { x: number; y: number }) => {
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
    // if average occupancy per child is below threshold*capacity, we merge
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
    }
  }

  const insertNode = (node: Node, item: T): boolean => {
    if (!contains(node.boundary, item)) return false

    if (node.items.length < capacity || node.depth >= maxDepth) {
      node.items.push(item)
      entityMap.set(item.entity, node)
      opCounter++
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

  return { insert, remove, update, clear, query, getRoot, has }
}
