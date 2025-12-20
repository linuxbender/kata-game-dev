import React from 'react'
import type { InventoryItem } from '@game/configs/ItemConfig'
import ITEM_CATALOG from '@game/configs/ItemConfig'
import { InventorySlot } from './InventorySlot'
import './InventoryPanel.css'

export interface InventoryPanelProps {
  items: InventoryItem[]
  onUse?: (item: InventoryItem) => void
  onDrop?: (item: InventoryItem) => void
  onClose?: () => void
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ items, onUse, onDrop, onClose }) => {
  // Defensive: ensure items is always an array to avoid runtime errors
  const safeItems = Array.isArray(items) ? items : (items ? [items as any] : [])
  return (
    <div onClick={e => e.stopPropagation()} className="inventory-panel">
      <div className="inventory-panel__header">
        <h3 className="inventory-panel__title">Inventory</h3>
        <div>
          <button className="inventory-panel__close" onClick={() => onClose?.()} aria-label="close-inventory">Close</button>
        </div>
      </div>
      <div className="inventory-panel__content">
        {safeItems.length === 0 && <div className="inventory-panel__empty">No items</div>}
        {safeItems.map((item, idx) => (
          <InventorySlot key={item.uid ?? `${item.id}_${idx}`} item={item} definition={ITEM_CATALOG[item.id]} onUse={onUse} onDrop={onDrop} />
        ))}
      </div>
    </div>
  )
}

export default InventoryPanel
