import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EquipmentPanel from './EquipmentPanel'
import type { InventoryItem } from '@game/configs/ItemConfig'
import type { EquipmentSlot } from '@engine/systems/EquipmentSystem'

const makeItem = (id: string): InventoryItem => ({ id, uid: id + '_uid', quantity: 1 })

describe('EquipmentPanel', () => {
  const equipment: Partial<Record<EquipmentSlot, string>> = {
    head: 'helm_uid',
    mainHand: 'sword_uid',
  }
  const items: Record<string, InventoryItem> = {
    helm_uid: makeItem('helm'),
    sword_uid: makeItem('sword'),
  }
  it('renders all slots and items', () => {
    render(<EquipmentPanel equipment={equipment} items={items} onUnequip={() => {}} />)
    expect(screen.getByText('head')).toBeDefined()
    expect(screen.getByText('mainHand')).toBeDefined()
    expect(screen.getByText('helm')).toBeDefined()
    expect(screen.getByText('sword')).toBeDefined()
  })
  it('calls onUnequip when button is clicked', () => {
    const onUnequip = vi.fn()
    render(<EquipmentPanel equipment={equipment} items={items} onUnequip={onUnequip} />)
    fireEvent.click(screen.getAllByText('Unequip')[0])
    expect(onUnequip).toHaveBeenCalled()
  })
})
