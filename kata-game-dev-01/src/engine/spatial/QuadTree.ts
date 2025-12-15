// Simple QuadTree implementation for spatial partitioning.
// Arrow-style factory returning an object with insert/clear/query methods.

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
  }

  const insertNode = (node: Node, item: PointItem): boolean => {
    if (!contains(node.boundary, item)) return false

    if (node.items.length < capacity || node.depth >= maxDepth) {
      node.items.push(item)
      return true
    }

    if (!node.divided) subdivide(node)

    // try children
    for (const child of node.children!) {
      if (insertNode(child, item)) return true
    }

    // fallback (shouldn't usually happen)
    node.items.push(item)
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

  const insert = (item: PointItem) => insertNode(root, item)
  const clear = () => clearNode(root)
  const query = (range: Rect) => queryNode(root, range, [])

  const getRoot = () => root

  return { insert, clear, query, getRoot }
}

