import type {Point} from '@components'

/**
 * Rectangle boundary definition for spatial partitioning
 * @property x - Left edge x-coordinate
 * @property y - Top edge y-coordinate
 * @property w - Width of rectangle
 * @property h - Height of rectangle
 *
 * @example
 * ```ts
 * const boundary: Rect = { x: 0, y: 0, w: 100, h: 100 }
 * // Represents a 100x100 area starting at top-left (0,0)
 * ```
 */
export type Rect = { x: number; y: number; w: number; h: number }

/**
 * Point item with entity reference
 * Combines spatial position with entity identifier for tracking
 * @property x - X coordinate
 * @property y - Y coordinate
 * @property entity - Unique entity identifier
 *
 * @example
 * ```ts
 * const enemy: PointItem = { x: 50, y: 75, entity: 42 }
 * ```
 */
export type PointItem = Point & { entity: number }

/**
 * Quad tree configuration and tuning options
 *
 * **What is this?** These parameters control how the quad tree behaves:
 * - When it splits nodes into smaller pieces
 * - When it merges nodes back together
 * - How often it optimizes itself
 *
 * **Why auto-tuning?** Different game scenarios need different settings:
 * - Many enemies at one location → merge aggressively
 * - Enemies spread everywhere → keep tree deep for fast queries
 *
 * **How it works:**
 * ```
 * Game Start: mergeThreshold = 0.25, rebalanceInterval = 256
 *              ↓ (play game, collect metrics)
 * After 1000 ops: "Hmm, nodes too empty..."
 *              ↓ (run autoTune)
 * Adjustment: mergeThreshold = 0.30, rebalanceInterval = 200
 *              ↓ (tree adapts to current game state!)
 * ```
 *
 * @property mergeThreshold - Occupancy fraction [0..1] below which child nodes merge with parent
 *   - Lower (0.1) = aggressive merging (fewer, larger nodes)
 *   - Higher (0.5) = conservative merging (more, smaller nodes)
 *   - Default: 0.25 (merge if avg child has < 25% of capacity)
 *
 * @property rebalanceInterval - How many operations before batch rebalance runs
 *   - Lower (100) = frequent rebalancing (slower but better structure)
 *   - Higher (500) = rare rebalancing (faster but potentially unbalanced)
 *   - Default: 256 (every 256 insert/update/remove operations)
 *
 * @property autoTune - Automatic parameter tuning configuration
 *   - enabled: Enable self-optimization (default true)
 *   - intervalOps: How often auto-tune runs, in operations (default rebalanceInterval * 4)
 *   - targetOccupancyFraction: Desired average items per child [0..1]
 *     * 0.5 means: try to keep each child ~50% full
 *     * Helps tree stay balanced and efficient
 *
 * @property onConfigChange - Callback when tuning parameters change
 *   - Called whenever auto-tune adjusts mergeThreshold or rebalanceInterval
 *   - Use this to persist changes to localStorage
 *
 * @example
 * ```ts
 * const options: QuadOptions = {
 *   mergeThreshold: 0.3,
 *   rebalanceInterval: 512,
 *   autoTune: { enabled: true, targetOccupancyFraction: 0.6 },
 *   onConfigChange: (cfg) => {
 *     // Save optimal settings for next game session
 *     localStorage.setItem('quadtree_config', JSON.stringify(cfg))
 *   }
 * }
 * const quadTree = createQuadTree(boundary, 8, 8, options)
 * ```
 */
export type QuadOptions = {
    mergeThreshold?: number
    rebalanceInterval?: number
    autoTune?: {
        enabled?: boolean
        intervalOps?: number
        targetOccupancyFraction?: number
    }
    onConfigChange?: (cfg: { mergeThreshold: number; rebalanceInterval: number }) => void
}

/**
 * Performance and structure metrics for the quad tree
 *
 * **What do these tell you?** Health metrics to diagnose tree performance:
 *
 * ```
 * Example metrics:
 * {
 *   opCounter: 512,           ← Operations since last reset
 *   splits: 8,                ← Nodes subdivided (growth)
 *   merges: 2,                ← Nodes merged back (shrinking)
 *   nodes: 12,                ← Total nodes in tree
 *   items: 47,                ← Total items stored
 *   avgItemsPerNode: 3.9,     ← Items per node (lower = more scattered)
 *   avgChildOccupancy: 2.4    ← Items per child when divided (should match target!)
 * }
 * ```
 *
 * **How to read it:**
 * - avgItemsPerNode ≈ (items / nodes): High = tree clustered, Low = tree spread out
 * - avgChildOccupancy: Auto-tune adjusts mergeThreshold to hit targetOccupancyFraction
 * - splits > merges: Tree growing (expanding world or entities spreading)
 * - merges > splits: Tree shrinking (consolidating clusters)
 *
 * @property opCounter - Current operation counter (insert/update/remove count)
 * @property splits - Total number of node splits performed
 * @property merges - Total number of node merges performed
 * @property nodes - Current number of nodes in tree
 * @property items - Total items stored in tree
 * @property avgItemsPerNode - Average items per node (should be close to capacity/2 ideally)
 * @property avgChildOccupancy - Average item count per child node when parent is divided
 */
export type QuadMetrics = {
    opCounter: number
    splits: number
    merges: number
    nodes: number
    items: number
    avgItemsPerNode: number
    avgChildOccupancy?: number
}

/**
 * Factory function to create a quad tree for spatial partitioning
 *
 * **What is a Quad Tree?** A tree that recursively divides 2D space into 4 quadrants
 *
 * ```
 * Visual Structure (depth 2):
 *
 *        ┌──────────────────────┐
 *        │                      │
 *        │   Root (100×100)     │
 *        │                      │
 *        └────┬────────────┬────┘
 *             │            │
 *      ┌──────┴──┐  ┌──────┴──┐
 *      │   NW    │  │   NE    │  ← Quadrants (50×50 each)
 *      │ (25,25) │  │(75, 25) │
 *      └────┬────┘  └────┬────┘
 *      ┌────┴────┐  ┌────┴────┐
 *      │   SW    │  │   SE    │
 *      │(25, 75) │  │(75, 75) │
 *      └─────────┘  └─────────┘
 *
 * NW = North West (top-left)
 * NE = North East (top-right)
 * SW = South West (bottom-left)
 * SE = South East (bottom-right)
 * ```
 *
 * **Why use it?**
 * - Fast spatial queries: O(log n) instead of O(n)
 * - Example: "Find all enemies near player" → only check relevant quadrants
 * - Automatic optimization: splits when crowded, merges when sparse
 *
 * **Features:**
 * - ⚡ Automatic node splitting when capacity exceeded
 * - 🔄 Node merging when underutilized
 * - 🧠 Automatic parameter tuning based on game metrics
 * - ⏱️ Batch rebalancing to maintain structure
 * - 🔍 O(1) entity lookups via internal map
 *
 * **How it works in gameplay:**
 * ```
 * Insert: Enemy spawns at (45, 60)
 *   → Finds which quadrant contains it
 *   → If quadrant full, splits into 4 smaller quadrants
 *   → Distributes existing items into new quadrants
 *
 * Query: "What enemies are near player at (50, 50) in range 30?"
 *   → Query rectangle: {x: 20, y: 20, w: 60, h: 60}
 *   → Only checks quadrants that overlap this range
 *   → Returns [Enemy1, Enemy3] ✓ (ignores Enemy2 far away)
 *
 * Update: Enemy moves from (45, 60) to (80, 80)
 *   → If still in same quadrant: just update position O(1)
 *   → If moved to different quadrant: remove & re-insert O(log n)
 * ```
 *
 * @template T - Item type, must extend Point with entity property
 *
 * @param boundary - Root boundary rectangle defining the game world
 * @param capacity - Max items per node before splitting (default 8, higher = fewer nodes, slower queries)
 * @param maxDepth - Maximum tree depth to prevent infinite recursion (default 8, balance query speed vs memory)
 * @param options - Optional tuning and callback configuration
 *
 * @returns Quad tree API object with methods for spatial operations
 *
 * @example
 * ```ts
 * // Create quad tree for 100×100 game world, max 8 items per node
 * const quadTree = createQuadTree({ x: 0, y: 0, w: 100, h: 100 }, 8)
 *
 * // Insert entities
 * quadTree.insert({ x: 25, y: 25, entity: 1 })  // Player
 * quadTree.insert({ x: 50, y: 50, entity: 2 })  // Enemy 1
 * quadTree.insert({ x: 75, y: 75, entity: 3 })  // Enemy 2
 *
 * // Spatial query: Find all items in a 50×50 range
 * const inRange = quadTree.query({ x: 0, y: 0, w: 50, h: 50 })
 * console.log(inRange)  // [{ x: 25, y: 25, entity: 1 }, { x: 50, y: 50, entity: 2 }]
 *
 * // Update entity position
 * quadTree.update(2, 60, 60)  // Enemy 1 moves to (60, 60)
 * quadTree.remove(3)           // Enemy 2 removed
 *
 * // Performance monitoring
 * const metrics = quadTree.getMetrics()
 * console.log(`Tree has ${metrics.nodes} nodes, ${metrics.items} items`)
 * console.log(`Avg items per node: ${metrics.avgItemsPerNode.toFixed(2)}`)
 * ```
 */
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

    const makeNode = (b: Rect, depth = 0, parent: Node | null = null): Node => ({
        boundary: b,
        items: [],
        divided: false,
        depth,
        parent
    })

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
        const {x, y, w, h} = node.boundary
        const hw = w / 2
        const hh = h / 2
        node.children = [
            makeNode({x: x, y: y, w: hw, h: hh}, node.depth + 1, node), // nw
            makeNode({x: x + hw, y: y, w: hw, h: hh}, node.depth + 1, node), // ne
            makeNode({x: x, y: y + hh, w: hw, h: hh}, node.depth + 1, node), // sw
            makeNode({x: x + hw, y: y + hh, w: hw, h: hh}, node.depth + 1, node) // se
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
            insert({x, y, entity} as T)
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
            insert({x, y, entity} as T)
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
        insert({x, y, entity} as T)
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
        try {
            options?.onConfigChange?.({mergeThreshold, rebalanceInterval})
        } catch (e) { /* noop */
        }
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

    /**
     * Quad Tree API - All available operations
     *
     * **Visual: How operations interact:**
     * ```
     * Game Loop:
     * ┌────────────────────────────────────┐
     * │ Each Frame:                        │
     * │ 1. Update enemy positions          │
     * │    quadTree.update(enemyId, x, y)  │
     * │                                    │
     * │ 2. Query visible enemies           │
     * │    nearby = quadTree.query(range)  │
     * │                                    │
     * │ 3. Remove dead enemies             │
     * │    quadTree.remove(deadId)         │
     * │                                    │
     * │ 4. Monitor performance             │
     * │    metrics = quadTree.getMetrics() │
     * └────────────────────────────────────┘
     *
     * Auto-tuning (every N operations):
     *   - Analyzes tree structure
     *   - Adjusts mergeThreshold & rebalanceInterval
     *   - Optimizes for current game state
     * ```
     */
    return {
        /**
         * Insert a new item into the quad tree
         *
         * **Complexity:** O(log n) average, O(n) worst case (if many items in same quadrant)
         *
         * **What happens:**
         * ```
         * insert({ x: 45, y: 60, entity: 5 })
         *   → Find which quadrant contains (45, 60)
         *   → If quadrant has space: add item ✓
         *   → If full and depth < maxDepth: split quadrant into 4 children
         *   → Redistribute items into children
         * ```
         *
         * @param item - Item to insert with x, y, entity properties
         * @returns true if insertion succeeded, false if outside boundary
         */
        insert,

        /**
         * Remove an item from the quad tree
         *
         * **Complexity:** O(1) for item lookup (via entityMap), O(log n) for tree traversal if needed
         *
         * **What happens:**
         * ```
         * remove(5)  // Remove entity with id 5
         *   → Look up which node contains entity 5 (O(1) via entityMap)
         *   → Remove from that node
         *   → Try merging parent nodes if underfull
         *   → Tree may consolidate back up
         * ```
         *
         * @param entity - Entity ID to remove
         * @returns true if entity was found and removed, false if not found
         */
        remove,

        /**
         * Update entity position in the tree
         *
         * **Complexity:** O(1) if stays in same quadrant, O(log n) if moves to different quadrant
         *
         * **What happens:**
         * ```
         * update(5, 80, 80)  // Entity 5 moves to (80, 80)
         *   → Check if new position still in same quadrant
         *   → If yes: just update x, y (fast! O(1))
         *   → If no: remove from old quadrant, insert into new one
         * ```
         *
         * **Performance tip:** Frequent updates in same quadrant = fast!
         *                    Entity hopping between quadrants = slower
         *
         * @param entity - Entity ID to update
         * @param x - New x coordinate
         * @param y - New y coordinate
         * @returns true if update succeeded
         */
        update,

        /**
         * Query all items within a rectangular range
         *
         * **Complexity:** O(k + log n) where k = items found
         *
         * **Why fast?** Only checks quadrants that overlap the query rectangle
         *
         * **What happens:**
         * ```
         * query({ x: 20, y: 20, w: 60, h: 60 })
         *
         * World:
         * ┌──────────────────────┐
         * │    ╔═════════╗       │
         * │    ║ Query   ║       │
         * │ ┌─┼┼─┬────┬─┼┼─┐    │
         * │ │NW││NE│  │SE││SE│   │
         * │ └─┼┼─┴────┴─┼┼─┘    │
         * │    ║        ║       │
         * │    ╚═════════╝       │
         * └──────────────────────┘
         *
         * → Only checks NW, NE, SE quadrants
         * → Ignores SW (doesn't overlap)
         * → Returns items found in overlapping quadrants
         * ```
         *
         * @param range - Query rectangle {x, y, w, h}
         * @returns Array of items found in the range
         */
        query,

        /**
         * Check if an entity exists in the tree
         *
         * **Complexity:** O(1) - direct map lookup!
         *
         * @param entity - Entity ID to check
         * @returns true if entity is in the tree, false otherwise
         */
        has,

        /**
         * Clear all items from the tree and reset counters
         *
         * **Complexity:** O(n) - must visit all nodes
         *
         * **Use case:** Level load, game reset, memory cleanup
         */
        clear,

        /**
         * Get performance metrics about the tree structure
         *
         * **What to watch:**
         * ```
         * metrics = getMetrics()
         *
         * ✓ Good: avgItemsPerNode ≈ 4 (balanced)
         * ✗ Bad:  avgItemsPerNode ≈ 0.5 (too sparse/many empty nodes)
         * ✗ Bad:  avgItemsPerNode > 8 (crowded/too few nodes)
         *
         * splits > merges  → Tree growing
         * merges > splits  → Tree shrinking/consolidating
         * ```
         *
         * @returns QuadMetrics object with tree health information
         */
        getMetrics,

        /**
         * Get reference to root node (for advanced debugging)
         *
         * @returns Root node of the quad tree
         */
        getRoot
    }
}

