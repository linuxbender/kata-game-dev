/**
 * GameHUD Layout Component
 * 
 * Manages the layered UI structure for the game:
 * - Layer 1: Canvas (game rendering)
 * - Layer 2: WorldUILayer (health bars on entities)
 * - Layer 3: HUDBar (bottom UI with player stats)
 * - Layer 4: OverlayPanel (toggleable panels like inventory)
 * - Layer 5: Modal Stack (dialogs, menus)
 */

import React, { ReactNode } from 'react'
import './GameHUD.css'

/**
 * GameHUD props
 */
export interface GameHUDProps {
  /** Canvas element (layer 1) */
  canvas: ReactNode
  /** World UI elements like entity health bars (layer 2) */
  worldUI?: ReactNode
  /** HUD bar component at bottom (layer 3) */
  hudBar?: ReactNode
  /** Overlay panels like inventory, equipment (layer 4) */
  overlays?: ReactNode
  /** Modals like dialogs, save/load menu (layer 5) */
  modals?: ReactNode
  /** Debug info panel */
  debugInfo?: ReactNode
}

/**
 * GameHUD Component
 * 
 * Provides a professional layered UI structure for the game.
 * Each layer is positioned absolutely and stacked using z-index.
 * 
 * @example
 * ```tsx
 * <GameHUD
 *   canvas={<canvas ref={canvasRef} />}
 *   worldUI={<HealthBar entity={player} />}
 *   hudBar={<HUDBar player={player} />}
 *   overlays={<>
 *     {inventoryVisible && <InventoryPanel />}
 *     {equipmentVisible && <EquipmentPanel />}
 *   </>}
 *   modals={<>
 *     {saveLoadVisible && <SaveLoadMenu />}
 *     {dialogVisible && <DialogBox />}
 *   </>}
 * />
 * ```
 */
const GameHUD: React.FC<GameHUDProps> = ({
  canvas,
  worldUI,
  hudBar,
  overlays,
  modals,
  debugInfo
}) => {
  return (
    <div className="game-hud-container">
      {/* Layer 1: Canvas - Game rendering */}
      <div className="game-hud-layer game-hud-canvas">
        {canvas}
      </div>
      
      {/* Layer 2: World UI - Entity health bars, labels */}
      {worldUI && (
        <div className="game-hud-layer game-hud-world-ui">
          {worldUI}
        </div>
      )}
      
      {/* Layer 3: HUD Bar - Player stats, hotbar, minimap */}
      {hudBar && (
        <div className="game-hud-layer game-hud-bar">
          {hudBar}
        </div>
      )}
      
      {/* Layer 4: Overlays - Inventory, equipment, etc */}
      {overlays && (
        <div className="game-hud-layer game-hud-overlays">
          {overlays}
        </div>
      )}
      
      {/* Layer 5: Modals - Dialogs, save/load, pause menu */}
      {modals && (
        <div className="game-hud-layer game-hud-modals">
          {modals}
        </div>
      )}
      
      {/* Debug info (highest layer) */}
      {debugInfo && (
        <div className="game-hud-layer game-hud-debug">
          {debugInfo}
        </div>
      )}
    </div>
  )
}

export default GameHUD
