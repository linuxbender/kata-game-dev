import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EquipmentPanel from './EquipmentPanel'
import { GameStateProvider } from '@/contexts/GameStateContext'
import { ReactiveWorld } from '@engine/ReactiveWorld'
import { COMPONENTS } from '@engine/constants'
import type { InventoryItem } from '@game/configs/ItemConfig'
import type { EquipmentSlot } from '@engine/systems/EquipmentSystem'

// Helper: render EquipmentPanel inside a GameStateProvider with seeded world
function renderWithWorld(
  slots: Partial<Record<EquipmentSlot, string>>,
  items: InventoryItem[]
) {
  const world = new ReactiveWorld()
  const playerId = world.createEntity()
  world.addComponent(playerId, COMPONENTS.INVENTORY, items)
  world.addComponent(playerId, COMPONENTS.EQUIPMENT, { slots })
  return { world, playerId, ...render(
    <GameStateProvider world={world} playerId={playerId}>
      <EquipmentPanel />
    </GameStateProvider>
  )}
}

const makeItem = (id: string, uid: string): InventoryItem => ({ id, uid, quantity: 1 })

describe('EquipmentPanel', () => {
  it('renders all equipment slot labels', () => {
    renderWithWorld({}, [])
    // All 6 slots should appear
    expect(screen.getByText('head')).toBeDefined()
    expect(screen.getByText('chest')).toBeDefined()
    expect(screen.getByText('mainHand')).toBeDefined()
    expect(screen.getByText('offHand')).toBeDefined()
  })

  it('shows equipped item name when slot is filled', () => {
    const sword = makeItem('sword_iron', 'sword_uid')
    renderWithWorld({ mainHand: 'sword_uid' }, [sword])
    // EquipmentSlot renders the item id
    expect(screen.getByText(/sword/i)).toBeDefined()
  })

  it('shows unequip button for equipped slot', () => {
    const sword = makeItem('sword_iron', 'sword_uid')
    renderWithWorld({ mainHand: 'sword_uid' }, [sword])
    expect(screen.getAllByText('Unequip').length).toBeGreaterThan(0)
  })

  it('calls unequipItem when Unequip is clicked', async () => {
    // We verify via world state: after unequip the slot should be cleared
    const sword = makeItem('sword_iron', 'sword_uid')
    const { world, playerId } = renderWithWorld({ mainHand: 'sword_uid' }, [sword])
    fireEvent.click(screen.getAllByText('Unequip')[0])
    const equipment = world.getComponent(playerId, COMPONENTS.EQUIPMENT) as any
    expect(equipment?.slots?.mainHand).toBeUndefined()
  })

  it('shows close button when onClose is provided', () => {
    const world = new ReactiveWorld()
    const playerId = world.createEntity()
    world.addComponent(playerId, COMPONENTS.INVENTORY, [])
    world.addComponent(playerId, COMPONENTS.EQUIPMENT, { slots: {} })
    const onClose = vi.fn()
    render(
      <GameStateProvider world={world} playerId={playerId}>
        <EquipmentPanel onClose={onClose} />
      </GameStateProvider>
    )
    const closeBtn = screen.getByRole('button', { name: /close/i })
    expect(closeBtn).toBeDefined()
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })
})
