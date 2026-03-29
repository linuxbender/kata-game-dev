import React from 'react'
import type { InventoryItem } from '@game/configs/ItemConfig'
import type { EquipmentSlot as EquipmentSlotType } from '@engine/systems/EquipmentSystem'
import EquipmentSlot from './EquipmentSlot'
import './EquipmentPanel.css'
import { useGameState } from '@/contexts/GameStateContext'
import { useComponentWatch } from '@ui/hooks'
import { COMPONENTS } from '@engine/constants'
import { unequipItem } from '@game/GameActions'

const EQUIPMENT_SLOTS: EquipmentSlotType[] = ['head', 'chest', 'legs', 'feet', 'mainHand', 'offHand']

export interface EquipmentPanelProps {
  onClose?: () => void
}

/**
 * EquipmentPanel
 *
 * Self-managing: reads equipment and inventory directly from
 * GameStateContext via useComponentWatch. No stale props.
 *
 * @example
 * ```tsx
 * {equipmentVisible && <EquipmentPanel onClose={() => setEquipmentVisible(false)} />}
 * ```
 */
const EquipmentPanel: React.FC<EquipmentPanelProps> = ({ onClose }) => {
  const { world, playerId } = useGameState()

  const equipmentComp = useComponentWatch<{ slots: Partial<Record<EquipmentSlotType, string>> }>(
    world, playerId, COMPONENTS.EQUIPMENT
  )
  const rawInventory = useComponentWatch<InventoryItem[]>(world, playerId, COMPONENTS.INVENTORY)

  const slots = equipmentComp?.slots ?? {}
  const inventoryItems: InventoryItem[] = Array.isArray(rawInventory) ? rawInventory : []
  const itemsByUid: Record<string, InventoryItem> = Object.fromEntries(
    inventoryItems.map(it => [it.uid, it])
  )

  const handleUnequip = (slot: EquipmentSlotType) => {
    if (!world || playerId == null) return
    unequipItem(world as any, playerId, slot)
  }

  return (
    <div className="equipment-panel">
      {onClose && (
        <div className="equipment-panel__header">
          <button className="equipment-panel__close" onClick={onClose} aria-label="close-equipment">
            Close
          </button>
        </div>
      )}
      {EQUIPMENT_SLOTS.map(slot => (
        <EquipmentSlot
          key={slot}
          slot={slot}
          item={slots[slot] ? itemsByUid[slots[slot]!] : undefined}
          onUnequip={handleUnequip}
        />
      ))}
    </div>
  )
}

export default EquipmentPanel
export { EquipmentPanel }
