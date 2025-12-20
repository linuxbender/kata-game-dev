import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import InventorySlot from './InventorySlot'
import { createItemInstance } from '@game/configs/ItemConfig'

describe('InventorySlot', () => {
  it('renders item name and quantity and buttons', () => {
    const item = createItemInstance('potion_health', 2)
    const def = { name: 'Health Potion', description: 'Restores HP' }
    const onUse = vi.fn()
    const onDrop = vi.fn()

    render(<InventorySlot item={item} definition={def as any} onUse={onUse} onDrop={onDrop} />)

    expect(screen.getByText(/health potion/i)).toBeTruthy()
    expect(screen.getByText(/restores hp/i)).toBeTruthy()
    expect(screen.getByText(/x2/)).toBeTruthy()

    fireEvent.click(screen.getByLabelText('use-item'))
    expect(onUse).toHaveBeenCalled()

    fireEvent.click(screen.getByLabelText('drop-item'))
    expect(onDrop).toHaveBeenCalled()
  })
})

