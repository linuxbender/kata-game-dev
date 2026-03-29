import React from 'react'
import ITEM_CATALOG from '@game/configs/ItemConfig'
import type { InventoryItem } from '@game/configs/ItemConfig'
import { InventorySlot } from './InventorySlot'
import './InventoryPanel.css'
import { useGameState } from '@/contexts/GameStateContext'
import { useComponentWatch } from '@ui/hooks'
import { COMPONENTS } from '@engine/constants'
import { consumeItem, dropItem } from '@game/GameActions'

export interface InventoryPanelProps {
  onClose?: () => void
}

/**
 * InventoryPanel
 *
 * Self-managing: reads inventory directly from GameStateContext via
 * useComponentWatch. Reacts to ECS inventory changes automatically.
 *
 * @example
 * ```tsx
 * {inventoryVisible && <InventoryPanel onClose={() => setInventoryVisible(false)} />}
 * ```
 */
const InventoryPanel: React.FC<InventoryPanelProps> = ({ onClose }) => {
  const { world, playerId } = useGameState()
  const raw = useComponentWatch<InventoryItem[]>(world, playerId, COMPONENTS.INVENTORY)
  const items: InventoryItem[] = Array.isArray(raw) ? raw : []

  const handleUse = (item: InventoryItem) => {
    if (!world || playerId == null) return
    consumeItem(world as any, playerId, item.uid)
  }

  const handleDrop = (item: InventoryItem) => {
    if (!world || playerId == null) return
    dropItem(world as any, playerId, item.uid, 1)
  }

  return (
    <div onClick={e => e.stopPropagation()} className="inventory-panel">
      <div className="inventory-panel__header">
        <h3 className="inventory-panel__title">Inventory</h3>
        <button className="inventory-panel__close" onClick={() => onClose?.()} aria-label="close-inventory">
          Close
        </button>
      </div>
      <div className="inventory-panel__content">
        {items.length === 0 && <div className="inventory-panel__empty">No items</div>}
        {items.map((item, idx) => (
          <InventorySlot
            key={item.uid ?? `${item.id}_${idx}`}
            item={item}
            definition={ITEM_CATALOG[item.id]}
            onUse={handleUse}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  )
}

export default InventoryPanel
export { InventoryPanel }
