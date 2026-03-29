import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import InventoryPanel from './InventoryPanel'
import { GameStateProvider } from '@/contexts/GameStateContext'
import { ReactiveWorld } from '@engine/ReactiveWorld'
import { COMPONENTS } from '@engine/constants'
import { createItemInstance } from '@game/configs/ItemConfig'

// Helper: render InventoryPanel inside a GameStateProvider with a seeded world
function renderWithWorld(inventoryItems: ReturnType<typeof createItemInstance>[]) {
  const world = new ReactiveWorld()
  const playerId = world.createEntity()
  world.addComponent(playerId, COMPONENTS.INVENTORY, inventoryItems)

  return render(
    <GameStateProvider world={world} playerId={playerId}>
      <InventoryPanel />
    </GameStateProvider>
  )
}

describe('InventoryPanel', () => {
  it('renders the panel title', () => {
    renderWithWorld([])
    expect(screen.getByText(/inventory/i)).toBeTruthy()
  })

  it('renders empty state when inventory is empty', () => {
    renderWithWorld([])
    expect(screen.getByText(/no items/i)).toBeTruthy()
  })

  it('renders an item from the world inventory', () => {
    const item = createItemInstance('potion_health', 3)
    renderWithWorld([item])
    expect(screen.getByText(/potion/i)).toBeTruthy()
    expect(screen.getByText(/x3/)).toBeTruthy()
  })

  it('renders multiple items', () => {
    const potion = createItemInstance('potion_health', 1)
    const sword  = createItemInstance('sword_iron', 1)
    renderWithWorld([potion, sword])
    expect(screen.getByText(/potion/i)).toBeTruthy()
    expect(screen.getAllByText(/sword/i).length).toBeGreaterThan(0)
  })

  it('shows close button', () => {
    renderWithWorld([])
    expect(screen.getByRole('button', { name: /close/i })).toBeTruthy()
  })
})
