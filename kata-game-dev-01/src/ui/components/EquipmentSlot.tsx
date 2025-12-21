import React from 'react'
import type { InventoryItem } from '@game/configs/ItemConfig'
import type { EquipmentSlot } from '@engine/systems/EquipmentSystem'

/**
 * Props for EquipmentSlot
 * @example
 * <EquipmentSlot slot="head" item={item} onUnequip={fn} />
 */
export interface EquipmentSlotProps {
  slot: EquipmentSlot
  item?: InventoryItem
  onUnequip: (slot: EquipmentSlot) => void
}

/**
 * Renders a single equipment slot with item and unequip button.
 * @example
 * <EquipmentSlotComponent slot="mainHand" item={item} onUnequip={fn} />
 */
export const EquipmentSlotComponent: React.FC<EquipmentSlotProps> = ({ slot, item, onUnequip }) => (
  <div className="equipment-slot">
    <div className="slot-label">{slot}</div>
    {item ? (
      <>
        <div className="item-name">{item.id}</div>
        {/* Button to unequip the item from this slot */}
        <button className="unequip-btn" onClick={() => onUnequip(slot)}>
          Unequip
        </button>
      </>
    ) : (
      <div className="empty">(empty)</div>
    )}
  </div>
)

export default EquipmentSlotComponent
