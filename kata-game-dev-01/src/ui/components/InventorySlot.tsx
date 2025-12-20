import React from 'react'
import type { InventoryItem } from '@game/configs/ItemConfig'
import type { ItemDefinition } from '@game/configs/ItemConfig'
import { getItemDefinition } from '@game/configs/ItemConfig'
import './InventorySlot.css'

export interface InventorySlotProps {
  item: InventoryItem
  definition?: ItemDefinition
  onUse?: (item: InventoryItem) => void
  onDrop?: (item: InventoryItem) => void
}

export const InventorySlot: React.FC<InventorySlotProps> = ({ item, definition, onUse, onDrop }) => {
  const catalogDef = getItemDefinition(item.id)
  // For display, prefer the provided definition (tests expect that),
  // but for type detection (consumable?) prefer catalog if available.
  const name = (definition && definition.name) ?? catalogDef?.name ?? item.id
  const desc = (definition && definition.description) ?? catalogDef?.description ?? ''
  const typeForDecision = (catalogDef && catalogDef.type) ?? definition?.type
  const isConsumable = typeForDecision === 'consumable'

  return (
    <div className="inventory-slot">
      <div className="inventory-slot__icon">
        {/* Icon placeholder */}
        <div className="inventory-slot__icon-placeholder" />
      </div>
      <div className="inventory-slot__info">
        <div className="inventory-slot__name">{name}</div>
        <div className="inventory-slot__desc">{desc}</div>
      </div>
      <div className="inventory-slot__meta">
        <div className="inventory-slot__qty">x{item.quantity}</div>
        <div className="inventory-slot__controls">
          <button disabled={!isConsumable} onClick={() => { if (isConsumable) onUse?.(item) }} aria-label="use-item" title={isConsumable ? 'Use item' : 'Not usable'}>Use</button>
          <button onClick={() => onDrop?.(item)} aria-label="drop-item">Drop</button>
        </div>
      </div>
    </div>
  )
}

export default InventorySlot
