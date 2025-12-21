import React from 'react'
import type { InventoryItem } from '@game/configs/ItemConfig'
import type { EquipmentSlot as EquipmentSlotType } from '@engine/systems/EquipmentSystem'
import EquipmentSlot from './EquipmentSlot'
import './EquipmentPanel.css'

/**
 * Props for EquipmentPanel
 * @example
 * <EquipmentPanel equipment={equipment} items={items} onUnequip={fn} />
 */
export interface EquipmentPanelProps {
  equipment: Partial<Record<EquipmentSlotType, string>>
  items: Record<string, InventoryItem>
  onUnequip: (slot: EquipmentSlotType) => void
}

/**
 * Displays all equipment slots and their items.
 * @example
 * <EquipmentPanel equipment={...} items={...} onUnequip={...} />
 */
export const EquipmentPanel: React.FC<EquipmentPanelProps> = ({ equipment, items, onUnequip }) => (
  <div className="equipment-panel">
    {/* Render all equipment slots */}
    {['head','chest','legs','feet','mainHand','offHand'].map(slot => (
      <EquipmentSlot
        key={slot}
        slot={slot as EquipmentSlotType}
        // Pass the item for this slot if equipped
        item={equipment[slot as EquipmentSlotType] ? items[equipment[slot as EquipmentSlotType]!] : undefined}
        onUnequip={onUnequip}
      />
    ))}
  </div>
)

export default EquipmentPanel
