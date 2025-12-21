import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EquipmentSlot from './EquipmentSlot'
import type { InventoryItem } from '@game/configs/ItemConfig'

const makeItem = (id: string): InventoryItem => ({ id, uid: id + '_uid', quantity: 1 })

describe('EquipmentSlot', () => {
  it('renders item and Unequip button', () => {
    const item = makeItem('sword')
    render(<EquipmentSlot slot="mainHand" item={item} onUnequip={() => {}} />)
    expect(screen.getByText('sword')).toBeDefined()
    expect(screen.getByText('Unequip')).toBeDefined()
  })
  it('shows (empty) when no item is equipped', () => {
    render(<EquipmentSlot slot="head" onUnequip={() => {}} />)
    expect(screen.getByText('(empty)')).toBeDefined()
  })
  it('calls onUnequip when button is clicked', () => {
    const onUnequip = vi.fn()
    const item = makeItem('helm')
    render(<EquipmentSlot slot="head" item={item} onUnequip={onUnequip} />)
    fireEvent.click(screen.getByText('Unequip'))
    expect(onUnequip).toHaveBeenCalledWith('head')
  })
})
