import { describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useUIState } from './useUIState'

describe('useUIState', () => {
  it('starts with all panels closed', () => {
    const { result } = renderHook(() => useUIState())
    expect(result.current.inventoryVisible).toBe(false)
    expect(result.current.equipmentVisible).toBe(false)
    expect(result.current.saveLoadVisible).toBe(false)
    expect(result.current.debugOverlayVisible).toBe(false)
    expect(result.current.controlsVisible).toBe(false)
  })

  describe('toggles', () => {
    it('toggleInventory flips inventoryVisible', () => {
      const { result } = renderHook(() => useUIState())
      act(() => result.current.toggleInventory())
      expect(result.current.inventoryVisible).toBe(true)
      act(() => result.current.toggleInventory())
      expect(result.current.inventoryVisible).toBe(false)
    })

    it('toggleEquipment flips equipmentVisible', () => {
      const { result } = renderHook(() => useUIState())
      act(() => result.current.toggleEquipment())
      expect(result.current.equipmentVisible).toBe(true)
    })

    it('toggleSaveLoad flips saveLoadVisible', () => {
      const { result } = renderHook(() => useUIState())
      act(() => result.current.toggleSaveLoad())
      expect(result.current.saveLoadVisible).toBe(true)
    })

    it('toggleDebugOverlay flips debugOverlayVisible', () => {
      const { result } = renderHook(() => useUIState())
      act(() => result.current.toggleDebugOverlay())
      expect(result.current.debugOverlayVisible).toBe(true)
    })

    it('toggleControls flips controlsVisible', () => {
      const { result } = renderHook(() => useUIState())
      act(() => result.current.toggleControls())
      expect(result.current.controlsVisible).toBe(true)
    })
  })

  describe('close actions', () => {
    it('closeInventory sets inventoryVisible to false', () => {
      const { result } = renderHook(() => useUIState())
      act(() => result.current.toggleInventory())
      act(() => result.current.closeInventory())
      expect(result.current.inventoryVisible).toBe(false)
    })

    it('closeSaveLoad sets saveLoadVisible to false', () => {
      const { result } = renderHook(() => useUIState())
      act(() => result.current.toggleSaveLoad())
      act(() => result.current.closeSaveLoad())
      expect(result.current.saveLoadVisible).toBe(false)
    })
  })

  describe('handleEsc cascade', () => {
    it('closes dialog first when dialogVisible=true', () => {
      const onCloseDialog = vi.fn()
      const { result } = renderHook(() => useUIState())
      act(() => result.current.toggleInventory())

      let closed: boolean
      act(() => { closed = result.current.handleEsc(true, onCloseDialog) })

      expect(onCloseDialog).toHaveBeenCalledTimes(1)
      expect(closed!).toBe(true)
      // inventory stays open — dialog had priority
      expect(result.current.inventoryVisible).toBe(true)
    })

    it('closes saveLoad before inventory', () => {
      const { result } = renderHook(() => useUIState())
      act(() => { result.current.toggleSaveLoad(); result.current.toggleInventory() })
      act(() => result.current.handleEsc(false, vi.fn()))
      expect(result.current.saveLoadVisible).toBe(false)
      expect(result.current.inventoryVisible).toBe(true)
    })

    it('closes inventory before equipment', () => {
      const { result } = renderHook(() => useUIState())
      act(() => { result.current.toggleInventory(); result.current.toggleEquipment() })
      act(() => result.current.handleEsc(false, vi.fn()))
      expect(result.current.inventoryVisible).toBe(false)
      expect(result.current.equipmentVisible).toBe(true)
    })

    it('closes controls last', () => {
      const { result } = renderHook(() => useUIState())
      act(() => result.current.toggleControls())
      act(() => result.current.handleEsc(false, vi.fn()))
      expect(result.current.controlsVisible).toBe(false)
    })

    it('returns false when nothing is open', () => {
      const { result } = renderHook(() => useUIState())
      let closed: boolean
      act(() => { closed = result.current.handleEsc(false, vi.fn()) })
      expect(closed!).toBe(false)
    })

    it('returns true when a panel was closed', () => {
      const { result } = renderHook(() => useUIState())
      act(() => result.current.toggleInventory())
      let closed: boolean
      act(() => { closed = result.current.handleEsc(false, vi.fn()) })
      expect(closed!).toBe(true)
    })
  })
})
