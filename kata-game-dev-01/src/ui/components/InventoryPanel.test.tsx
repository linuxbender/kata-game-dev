import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import InventoryPanel from './InventoryPanel'
import { createItemInstance } from '@game/configs/ItemConfig'

describe('InventoryPanel', () => {
  it('renders empty state', () => {
    render(<InventoryPanel items={[]} />)
    expect(screen.getByText(/inventory/i)).toBeTruthy()
    expect(screen.getByText(/no items/i)).toBeTruthy()
  })

  it('renders item slots', () => {
    const item = createItemInstance('potion_health', 3)
    render(<InventoryPanel items={[item]} />)
    expect(screen.getByText(/potion/i)).toBeTruthy()
    expect(screen.getByText(/x3/)).toBeTruthy()
  })
})

