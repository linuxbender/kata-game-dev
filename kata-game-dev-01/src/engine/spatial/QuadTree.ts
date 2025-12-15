// Simple QuadTree implementation for spatial partitioning.
// Arrow-style factory returning an object with insert/clear/query/update/remove methods.

export type Rect = { x: number; y: number; w: number; h: number }
export type PointItem = { x: number; y: number; entity: number }

export const createQuadTree = (boundary: Rect, capacity = 8, maxDepth = 8) => {
  type Node = {
    boundary: Rect
    items: PointItem[]
    divided: boolean
    children?: [Node, Node, Node, Node]
    depth: number
  }

  const makeNode = (b: Rect, depth = 0): Node => ({ boundary: b, items: [], divided: false, depth })

  const root = makeNode(boundary, 0)

  // Map to find the node that currently holds an entity for O(1) updates/removals
  const entityMap = new Map<number, Node>()

  const contains = (r: Rect, p: PointItem) => {
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
      makeNode({ x: x, y: y, w: hw, h: hh }, node.depth + 1), // nw
      makeNode({ x: x + hw, y: y, w: hw, h: hh }, node.depth + 1), // ne
      makeNode({ x: x, y: y + hh, w: hw, h: hh }, node.depth + 1), // sw
      makeNode({ x: x + hw, y: y + hh, w: hw, h: hh }, node.depth + 1) // se
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

  const insertNode = (node: Node, item: PointItem): boolean => {
    if (!contains(node.boundary, item)) return false

    if (node.items.length < capacity || node.depth >= maxDepth) {
      node.items.push(item)
      entityMap.set(item.entity, node)
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
    return true
  }

  const insert = (item: PointItem) => insertNode(root, item)

  const remove = (entity: number) => {
    const node = entityMap.get(entity)
    if (!node) return false
    const idx = node.items.findIndex(i => i.entity === entity)
    if (idx >= 0) {
      node.items.splice(idx, 1)
      entityMap.delete(entity)
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
      return true
    }

    return false
  }

  const update = (entity: number, x: number, y: number) => {
    const node = entityMap.get(entity)
    if (!node) {
      // Not present, insert fresh
      insert({ x, y, entity })
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
        return true
      }
      // Otherwise remove and re-insert from root
      node.items.splice(idx, 1)
      entityMap.delete(entity)
      insert({ x, y, entity })
      return true
    }

    // Not found in node.items (shouldn't happen) — fallback to insert
    insert({ x, y, entity })
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
  }

  const queryNode = (node: Node, range: Rect, found: PointItem[]) => {
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

  return { insert, remove, update, clear, query, getRoot, has }
}
