import { useState, useCallback } from 'react'

export interface UIState {
  inventoryVisible: boolean
  equipmentVisible: boolean
  saveLoadVisible: boolean
  debugOverlayVisible: boolean
  controlsVisible: boolean

  toggleInventory: () => void
  toggleEquipment: () => void
  toggleSaveLoad: () => void
  toggleDebugOverlay: () => void
  toggleControls: () => void

  closeInventory: () => void
  closeEquipment: () => void
  closeSaveLoad: () => void
  closeControls: () => void

  /**
   * ESC cascade: closes the highest-priority open panel.
   * Priority order: dialog > saveLoad > inventory > equipment.
   * Dialog state is passed in because it lives in App (complex ECS coordination).
   * Returns true if any panel was closed.
   */
  handleEsc: (dialogVisible: boolean, onCloseDialog: () => void) => boolean
}

/**
 * Manages all game UI panel visibility in one place.
 * Provides an ESC cascade so pressing Escape always closes the topmost panel first.
 *
 * @example
 * ```tsx
 * const ui = useUIState()
 * useHotkeys({
 *   i: ui.toggleInventory,
 *   escape: (e) => { e.preventDefault(); ui.handleEsc(dialogOpen, closeDialog) },
 * })
 * // ...
 * {ui.inventoryVisible && <InventoryPanel onClose={ui.closeInventory} />}
 * ```
 */
export function useUIState(): UIState {
  const [inventoryVisible, setInventoryVisible] = useState(false)
  const [equipmentVisible, setEquipmentVisible] = useState(false)
  const [saveLoadVisible, setSaveLoadVisible] = useState(false)
  const [debugOverlayVisible, setDebugOverlayVisible] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(false)

  const toggleInventory = useCallback(() => setInventoryVisible(v => !v), [])
  const toggleEquipment = useCallback(() => setEquipmentVisible(v => !v), [])
  const toggleSaveLoad = useCallback(() => setSaveLoadVisible(v => !v), [])
  const toggleDebugOverlay = useCallback(() => setDebugOverlayVisible(v => !v), [])
  const toggleControls = useCallback(() => setControlsVisible(v => !v), [])

  const closeInventory = useCallback(() => setInventoryVisible(false), [])
  const closeEquipment = useCallback(() => setEquipmentVisible(false), [])
  const closeSaveLoad = useCallback(() => setSaveLoadVisible(false), [])
  const closeControls = useCallback(() => setControlsVisible(false), [])

  const handleEsc = useCallback(
    (dialogVisible: boolean, onCloseDialog: () => void): boolean => {
      if (dialogVisible) { onCloseDialog(); return true }
      if (saveLoadVisible) { setSaveLoadVisible(false); return true }
      if (inventoryVisible) { setInventoryVisible(false); return true }
      if (equipmentVisible) { setEquipmentVisible(false); return true }
      if (controlsVisible) { setControlsVisible(false); return true }
      return false
    },
    [saveLoadVisible, inventoryVisible, equipmentVisible, controlsVisible]
  )

  return {
    inventoryVisible,
    equipmentVisible,
    saveLoadVisible,
    debugOverlayVisible,
    controlsVisible,
    toggleInventory,
    toggleEquipment,
    toggleSaveLoad,
    toggleDebugOverlay,
    toggleControls,
    closeInventory,
    closeEquipment,
    closeSaveLoad,
    closeControls,
    handleEsc,
  }
}
