/**
 * Inventory System
 *
 * Manages item storage and management.
 * Handles adding, removing, stacking, and organizing items.
 *
 * @example
 * ```ts
 * const inventory = new InventorySystem(maxSlots, maxWeight)
 *
 * // Add item
 * inventory.addItem(potion, 5)
 *
 * // Remove item
 * inventory.removeItem('potion_health', 1)
 *
 * // Get inventory state
 * const items = inventory.getAllItems()
 * const weight = inventory.getTotalWeight()
 * ```
 */

import {
  isItem,
  createInventoryEntry,
  calculateInventoryWeight,
  calculateInventoryValue,
  findItemInInventory,
  type Item,
  type InventoryEntry,
} from '@components/Item'

/**
 * Inventory System
 *
 * Manages player inventory with slots and weight limits.
 */
export class InventorySystem {
  private items: InventoryEntry[] = []
  private maxSlots: number
  private maxWeight: number

  /**
   * Create new inventory.
   *
   * @param maxSlots - Maximum inventory slots
   * @param maxWeight - Maximum weight capacity in kg
   *
   * @example
   * ```ts
   * const inventory = new InventorySystem(20, 50) // 20 slots, 50kg max
   * ```
   */
  constructor(maxSlots: number = 20, maxWeight: number = 100) {
    this.maxSlots = maxSlots
    this.maxWeight = maxWeight
  }

  /**
   * Add item to inventory.
   *
   * @param item - Item to add
   * @param quantity - Quantity to add
   * @returns true if successfully added
   *
   * @example
   * ```ts
   * if (inventory.addItem(potion, 5)) {
   *   showMessage('Item added!')
   * } else {
   *   showMessage('Inventory full!')
   * }
   * ```
   */
  addItem(item: Item, quantity: number = 1): boolean {
    if (!isItem(item)) return false
    if (quantity <= 0) return false

    // Check weight
    const newWeight = calculateInventoryWeight(this.items) + item.weight * quantity
    if (newWeight > this.maxWeight) return false

    // Try to stack if stackable
    if (item.stackable) {
      const existing = findItemInInventory(this.items, item.id)
      if (existing) {
        existing.quantity += quantity
        return true
      }
    }

    // Check slots
    if (this.items.length >= this.maxSlots) return false

    // Add new entry
    this.items.push(createInventoryEntry(item, quantity))
    return true
  }

  /**
   * Remove item from inventory.
   *
   * @param itemId - Item ID to remove
   * @param quantity - Quantity to remove
   * @returns true if successfully removed
   *
   * @example
   * ```ts
   * if (inventory.removeItem('potion_health', 1)) {
   *   consumePotion()
   * }
   * ```
   */
  removeItem(itemId: string, quantity: number = 1): boolean {
    if (quantity <= 0) return false

    const entry = findItemInInventory(this.items, itemId)
    if (!entry) return false

    if (entry.quantity < quantity) return false

    entry.quantity -= quantity

    // Remove entry if empty
    if (entry.quantity === 0) {
      this.items = this.items.filter(e => e.instanceId !== entry.instanceId)
    }

    return true
  }

  /**
   * Check if item exists in inventory.
   *
   * @param itemId - Item ID
   * @param minQuantity - Minimum quantity needed
   * @returns true if has item with quantity
   *
   * @example
   * ```ts
   * if (inventory.hasItem('key_gold', 1)) {
   *   openGoldenDoor()
   * }
   * ```
   */
  hasItem(itemId: string, minQuantity: number = 1): boolean {
    const entry = findItemInInventory(this.items, itemId)
    return entry ? entry.quantity >= minQuantity : false
  }

  /**
   * Get item quantity.
   *
   * @param itemId - Item ID
   * @returns Quantity (0 if not found)
   *
   * @example
   * ```ts
   * const count = inventory.getItemQuantity('sword')
   * ```
   */
  getItemQuantity(itemId: string): number {
    const entry = findItemInInventory(this.items, itemId)
    return entry ? entry.quantity : 0
  }

  /**
   * Get all items in inventory.
   *
   * @returns Array of inventory entries
   *
   * @example
   * ```ts
   * const allItems = inventory.getAllItems()
   * allItems.forEach(entry => {
   *   console.log(`${entry.item.name} x${entry.quantity}`)
   * })
   * ```
   */
  getAllItems(): InventoryEntry[] {
    return [...this.items]
  }

  /**
   * Get inventory state.
   *
   * @returns State information
   *
   * @example
   * ```ts
   * const state = inventory.getState()
   * console.log(`${state.usedSlots}/${state.maxSlots} slots`)
   * ```
   */
  getState() {
    return {
      items: this.items.length,
      maxSlots: this.maxSlots,
      weight: calculateInventoryWeight(this.items),
      maxWeight: this.maxWeight,
      value: calculateInventoryValue(this.items),
      isFull: this.items.length >= this.maxSlots,
      isOverweight: calculateInventoryWeight(this.items) > this.maxWeight,
    }
  }

  /**
   * Get total weight.
   *
   * @returns Total weight in kg
   *
   * @example
   * ```ts
   * const weight = inventory.getTotalWeight()
   * ```
   */
  getTotalWeight(): number {
    return calculateInventoryWeight(this.items)
  }

  /**
   * Get total value.
   *
   * @returns Total value in gold
   *
   * @example
   * ```ts
   * const gold = inventory.getTotalValue()
   * ```
   */
  getTotalValue(): number {
    return calculateInventoryValue(this.items)
  }

  /**
   * Get remaining weight capacity.
   *
   * @returns Remaining weight
   *
   * @example
   * ```ts
   * if (inventory.getRemainingWeight() > item.weight) {
   *   addItem()
   * }
   * ```
   */
  getRemainingWeight(): number {
    return Math.max(0, this.maxWeight - this.getTotalWeight())
  }

  /**
   * Get remaining slots.
   *
   * @returns Number of free slots
   *
   * @example
   * ```ts
   * if (inventory.getRemainingSlots() > 0) {
   *   canAddItem()
   * }
   * ```
   */
  getRemainingSlots(): number {
    return Math.max(0, this.maxSlots - this.items.length)
  }

  /**
   * Check if inventory is full.
   *
   * @returns true if at max slots
   *
   * @example
   * ```ts
   * if (inventory.isFull()) {
   *   showMessage('Inventory full!')
   * }
   * ```
   */
  isFull(): boolean {
    return this.items.length >= this.maxSlots
  }

  /**
   * Check if inventory is overweight.
   *
   * @returns true if exceeds weight limit
   *
   * @example
   * ```ts
   * if (inventory.isOverweight()) {
   *   reduceMovementSpeed()
   * }
   * ```
   */
  isOverweight(): boolean {
    return this.getTotalWeight() > this.maxWeight
  }

  /**
   * Clear entire inventory.
   *
   * @example
   * ```ts
   * inventory.clear()
   * ```
   */
  clear(): void {
    this.items = []
  }

  /**
   * Get items of specific type.
   *
   * @param type - Item type
   * @returns Filtered entries
   *
   * @example
   * ```ts
   * const weapons = inventory.getItemsByType('weapon')
   * ```
   */
  getItemsByType(type: Item['type']): InventoryEntry[] {
    return this.items.filter(e => e.item.type === type)
  }

  /**
   * Sort inventory by criteria.
   *
   * @param sortBy - Sort criteria
   *
   * @example
   * ```ts
   * inventory.sort('value') // Sort by value
   * ```
   */
  sort(sortBy: 'name' | 'weight' | 'value' | 'type'): void {
    this.items.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.item.name.localeCompare(b.item.name)
        case 'weight':
          return a.item.weight - b.item.weight
        case 'value':
          return a.item.value - b.item.value
        case 'type':
          return a.item.type.localeCompare(b.item.type)
        default:
          return 0
      }
    })
  }
}

