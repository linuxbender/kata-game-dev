import React, { useEffect, useRef, useState } from 'react'
import './App.css'
import { createWorld } from '@game/setupWorld'
import { createMovementSystem } from '@engine/systems/MovementSystem'
import { createEnemyAISystem } from '@engine/systems/EnemyAISystem'
import { createRenderSystem } from '@engine/systems/RenderSystem'
import { createInputSystem, INPUT_ACTIONS } from '@engine/systems/InputSystem'
import { createQuadTree } from '@engine/spatial/QuadTree'
import { createDebugOverlay } from '@engine/systems/DebugOverlay'
import { ReactiveWorld } from '@engine/ReactiveWorld'
import { COMPONENTS, EVENT_TYPES } from '@engine/constants'
import { useCanvas } from '@hooks/useCanvas'
import { useQuadConfig } from '@contexts/QuadConfigContext'
import { GameStateProvider } from '@contexts/GameStateContext'
import { HealthBar } from '@ui/components/HealthBar'
import { pickupItem, consumeItem, dropItem, startDialog, chooseDialogOption, endDialog, getDialogState } from '@game/GameActions'
import { createItemInstance } from '@game/configs/ItemConfig'
import { getDialogTree, getDialogNode } from '@game/configs/DialogConfig'
import type { DialogNode } from '@game/configs/DialogConfig'
import InventoryPanel from '@ui/components/InventoryPanel'
import EquipmentPanel from '@ui/components/EquipmentPanel'
import SaveLoadMenu from '@ui/components/SaveLoadMenu'
import DialogBox from '@ui/components/DialogBox'
import { WeaponSystem } from '@engine/systems/WeaponSystem'
import ITEM_CATALOG from '@game/configs/ItemConfig'
import { LevelManager } from '@game/LevelManager'
import { LevelTransition } from '@ui/components/LevelTransition'
import { saveGame, loadGame } from '@game/SaveSystem'
import GameHUD from '@ui/layouts/GameHUD'
import HUDBar from '@ui/components/HUDBar'
import DebugOverlay from '@ui/components/DebugOverlay'
import { createPerformanceMonitor, type PerformanceMetrics } from '@/debug/PerformanceMonitor'

// Main app component that manages game loop, systems, and quad-tree spatial indexing
const App = () => {
  const { canvasRef, ready, dpr, canvasSize } = useCanvas()
  const worldRef = useRef<ReactiveWorld | null>(null)
  const playerRef = useRef<number | null>(null)
  const levelManagerRef = useRef<LevelManager | null>(null)

  // State for GameStateProvider
  const [gameWorld, setGameWorld] = useState<ReactiveWorld | null>(null)
  const [gamePlayerId, setGamePlayerId] = useState<number | null>(null)
  const [inventoryVisible, setInventoryVisible] = useState(false)
  const [equipmentVisible, setEquipmentVisible] = useState(false)
  const [inventoryVersion, setInventoryVersion] = useState(0)
  const [saveLoadVisible, setSaveLoadVisible] = useState(false)
  
  // Dialog system state
  const [dialogVisible, setDialogVisible] = useState(false)
  const [currentDialogNode, setCurrentDialogNode] = useState<DialogNode | null>(null)
  const [currentDialogTreeId, setCurrentDialogTreeId] = useState<string | null>(null)
  const [questFlags, setQuestFlags] = useState<Record<string, any>>({})
  
  // Refs to track current state for keyboard handlers
  const inventoryVisibleRef = useRef(inventoryVisible)
  const equipmentVisibleRef = useRef(equipmentVisible)
  const saveLoadVisibleRef = useRef(saveLoadVisible)
  const dialogVisibleRef = useRef(dialogVisible)
  
  // Keep refs in sync with state
  React.useEffect(() => { inventoryVisibleRef.current = inventoryVisible }, [inventoryVisible])
  React.useEffect(() => { equipmentVisibleRef.current = equipmentVisible }, [equipmentVisible])
  React.useEffect(() => { saveLoadVisibleRef.current = saveLoadVisible }, [saveLoadVisible])
  React.useEffect(() => { dialogVisibleRef.current = dialogVisible }, [dialogVisible])
  
  // Level transition state
  const [transitionActive, setTransitionActive] = useState(false)
  const [transitionLevel, setTransitionLevel] = useState<{ name: string; description: string } | null>(null)

  // Performance monitoring state
  const [debugOverlayVisible, setDebugOverlayVisible] = useState(false)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    avgFps: 0,
    minFps: 0,
    maxFps: 0,
    frameTime: 0,
    avgFrameTime: 0,
    entityCount: 0,
    systemTimings: [],
    totalFrames: 0
  })

  // Read persisted quad config from context outside the effect (follows React hooks rules)
  const { config: persistedConfig, setConfig: persistConfig } = useQuadConfig()

  useEffect(() => {
    if (!ready) return

    const canvas = canvasRef.current
    if (!canvas) return

    try {
      // Create ReactiveWorld instance
      const reactiveWorld = new ReactiveWorld()

      // Setup world with entities
      const { player, quadConfig } = createWorld(reactiveWorld)

      worldRef.current = reactiveWorld
      playerRef.current = player

      // Set state for GameStateProvider
      setGameWorld(reactiveWorld)
      setGamePlayerId(player)

      // Initialize Level Manager
      const levelManager = new LevelManager(reactiveWorld)
      levelManager.setPlayer(player)
      levelManagerRef.current = levelManager

      // Load initial level (Forest Clearing)
      levelManager.loadLevel('level_1_forest')

      const { update: movementUpdate } = createMovementSystem()
      const { update: enemyAIUpdate } = createEnemyAISystem()

      // Initialize input system with configurable settings
      const inputSystem = createInputSystem({
        movementSpeed: 150,
        enableDiagonalNormalization: true
      })

      // Initialize quad tree with persisted config merged with defaults
      const quad = createQuadTree(
        quadConfig.boundary,
        quadConfig.capacity ?? 8,
        quadConfig.maxDepth ?? 8,
        {
          mergeThreshold: persistedConfig.mergeThreshold ?? quadConfig.mergeThreshold,
          rebalanceInterval: persistedConfig.rebalanceInterval ?? quadConfig.rebalanceInterval,
          // Persist tuning changes to localStorage via context
          onConfigChange: (c: { mergeThreshold: number; rebalanceInterval: number }) => {
            try { persistConfig(c) } catch (e) { /* ignore persistence errors */ }
          }
        }
      )

      // Initialize debug overlay (toggle with Shift+D)
      const debugOverlay = createDebugOverlay(canvas)

      // Initialize render system with smooth camera follow and spatial culling
      // NOTE: we no longer use a canvas-based HUD renderer; UI is React-based.
      const { update: renderUpdate } = createRenderSystem(canvas, player, {
        dpr,
        camera: {
          dampingSeconds: 0.12,
          deadZoneRadius: 3,
          lookAheadFactor: 0.2
        }
      }, quad, debugOverlay)

      // Track entities in quad tree for incremental updates
      const trackedEntities = new Set<number>()

      // Populate quad tree with initial entities
      const initial = reactiveWorld.query(COMPONENTS.TRANSFORM, COMPONENTS.RENDERABLE)
      for (const e of initial) {
        const id = e.entity
        const t = e.comps[0]
        quad.insert({ x: t.x, y: t.y, entity: id })
        trackedEntities.add(id)
      }

      // Subscribe to world component events to keep spatial index synchronized
      const unsubscribe = reactiveWorld.onComponentEvent((ev: any) => {
        if (ev.name !== COMPONENTS.TRANSFORM) return
        if (ev.type === EVENT_TYPES.ADD) {
          const id = ev.entity
          const pos = (ev.component as any)
          quad.insert({ x: pos.x, y: pos.y, entity: id })
          trackedEntities.add(id)
        } else if (ev.type === EVENT_TYPES.UPDATE) {
          const id = ev.entity
          const pos = reactiveWorld.getComponent(id, COMPONENTS.TRANSFORM)
          if (pos) {
            if (quad.has(id)) quad.update(id, pos.x, pos.y)
            else { quad.insert({ x: pos.x, y: pos.y, entity: id }); trackedEntities.add(id) }
          }
        } else if (ev.type === EVENT_TYPES.REMOVE) {
          const id = ev.entity
          if (quad.has(id)) quad.remove(id)
          trackedEntities.delete(id)
        }
      })

      // Subscribe to inventory changes to force React updates for UI
      const unsubInv = reactiveWorld.onComponentEventFor(COMPONENTS.INVENTORY as any, (ev: any) => {
        // bump a version so we re-render InventoryPanel with latest items
        setInventoryVersion(v => v + 1)
      })

      // Attach input system listeners
      inputSystem.attach()

      // Canvas click handler for NPC interaction
      const handleCanvasClick = (e: MouseEvent) => {
        const w = worldRef.current
        const p = playerRef.current
        if (!w || p == null) return
        
        // Get canvas bounds and calculate world coordinates
        const rect = canvas.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const clickY = e.clientY - rect.top
        
        // Get camera offset from render system
        const playerTransform = w.getComponent(p, COMPONENTS.TRANSFORM)
        if (!playerTransform) return
        
        // Convert screen coordinates to world coordinates (accounting for camera)
        // Assuming camera is centered on player
        const worldX = clickX - canvasSize.width / 2 + playerTransform.x
        const worldY = clickY - canvasSize.height / 2 + playerTransform.y
        
        // Find NPCs in range of click (within 30 pixels)
        const npcs = reactiveWorld.query(COMPONENTS.TRANSFORM, COMPONENTS.METADATA)
          .filter(e => {
            const metadata = e.comps[1]
            return metadata.isNPC === true
          })
        
        for (const npc of npcs) {
          const npcTransform = npc.comps[0]
          const dx = npcTransform.x - worldX
          const dy = npcTransform.y - worldY
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 30) {
            // NPC clicked! Determine which dialog to show
            // For now, all NPCs show merchant dialog
            // TODO: Add dialog tree ID to NPC metadata
            const dialogTreeId = 'merchant_dialog'
            
            if (startDialog(w, p, npc.entity, dialogTreeId)) {
              const dialogTree = getDialogTree(dialogTreeId)
              if (dialogTree) {
                const startNode = dialogTree.nodes[dialogTree.startNodeId]
                setCurrentDialogNode(startNode)
                setCurrentDialogTreeId(dialogTreeId)
                setDialogVisible(true)
                
                // Update quest flags from player component
                const flags = w.getComponent(p, COMPONENTS.QUEST_FLAGS) as Record<string, any> || {}
                setQuestFlags(flags)
              }
            }
            break
          }
        }
      }
      
      canvas.addEventListener('click', handleCanvasClick)

      // Track last debug toggle state to detect changes
      let lastDebugState = false

      // Debug keys: H = damage -10, J = heal +10, I = inventory toggle
      const debugDamageKey = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase()
        const w = worldRef.current
        const p = playerRef.current
        if (!w || p == null) return
        if (key === 'h') {
          const hp = w.getComponent(p, COMPONENTS.HEALTH)
          if (hp) {
            const newHp = { ...hp, current: Math.max(0, hp.current - 10) }
            w.addComponent(p, COMPONENTS.HEALTH, newHp)
            try { w.markComponentUpdated(p, COMPONENTS.HEALTH) } catch (err) {/*ignore*/}
          }
        }
        if (key === 'j') {
          const hp = w.getComponent(p, COMPONENTS.HEALTH)
          if (hp) {
            const newHp = { ...hp, current: Math.min(hp.max, hp.current + 10) }
            w.addComponent(p, COMPONENTS.HEALTH, newHp)
            try { w.markComponentUpdated(p, COMPONENTS.HEALTH) } catch (err) {/*ignore*/}
          }
        }
      }
      const inventoryKey = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase()
        if (key === 'i') setInventoryVisible(v => !v)
      }
      const equipmentKey = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase()
        if (key === 'e') setEquipmentVisible(v => !v)
      }
      
      // Save/Load menu hotkey
      const saveLoadKey = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase()
        if (key === 's') {
          setSaveLoadVisible(v => !v)
        }
      }
      
      // ESC key handler to close all overlays/modals
      const escapeKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          // Close overlays in order of priority (modals first, then overlays)
          if (dialogVisibleRef.current) {
            setDialogVisible(false)
            const w = worldRef.current
            const p = playerRef.current
            if (w && p != null) {
              endDialog(w, p)
            }
          } else if (saveLoadVisibleRef.current) {
            setSaveLoadVisible(false)
          } else if (inventoryVisibleRef.current) {
            setInventoryVisible(false)
          } else if (equipmentVisibleRef.current) {
            setEquipmentVisible(false)
          }
        }
      }
      
      // Level switching keys: 1, 2, 3 for different levels
      const levelSwitchKey = (e: KeyboardEvent) => {
        const key = e.key
        const lm = levelManagerRef.current
        if (!lm) return
        
        const levelMap: Record<string, { id: string; name: string; description: string }> = {
          '1': { id: 'level_1_forest', name: 'Forest Clearing', description: 'A peaceful forest with scattered goblin scouts' },
          '2': { id: 'level_2_cave', name: 'Dark Cave', description: 'A dangerous cave filled with goblins and orcs' },
          '3': { id: 'level_3_fortress', name: 'Orc Fortress', description: 'A heavily fortified orc stronghold' }
        }
        
        const levelInfo = levelMap[key]
        if (levelInfo) {
          // Trigger transition
          setTransitionLevel({ name: levelInfo.name, description: levelInfo.description })
          setTransitionActive(true)
          
          // Load level after brief delay to show transition
          setTimeout(() => {
            lm.transitionToLevel(levelInfo.id, () => {
              console.log(`[App] Level transition to ${levelInfo.name} complete`)
            })
          }, 400)
        }
      }
      
      // Debug overlay hotkey (D key)
      const debugOverlayKey = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase()
        if (key === 'd') {
          setDebugOverlayVisible(v => !v)
        }
      }
      
      window.addEventListener('keydown', debugDamageKey)
      window.addEventListener('keydown', inventoryKey)
      window.addEventListener('keydown', equipmentKey)
      window.addEventListener('keydown', saveLoadKey)
      window.addEventListener('keydown', escapeKey)
      window.addEventListener('keydown', levelSwitchKey)
      window.addEventListener('keydown', debugOverlayKey)

      let last = performance.now()
      let running = true

      // WeaponSystem initialization
      const weaponSystem = new WeaponSystem(reactiveWorld)

      // Performance monitor initialization
      const performanceMonitor = createPerformanceMonitor(60)

      // Main game loop frame
      const frame = (now: number) => {
        // Start performance tracking
        performanceMonitor.startFrame()

        const dt = Math.min((now - last) / 1000, 0.05)
        last = now

        // Update world time for game logic (cooldowns, timers, etc.)
        reactiveWorld.updateTime(dt)

        // Update input and player movement
        let inputStart = performance.now()
        inputSystem.update(reactiveWorld, player, dt)
        performanceMonitor.recordSystemTime('input', performance.now() - inputStart)

        // Handle debug overlay toggle
        const debugPressed = inputSystem.isActionPressed(INPUT_ACTIONS.DEBUG_TOGGLE)
        if (debugPressed && !lastDebugState) {
          debugOverlay.toggle()
        }
        lastDebugState = debugPressed

        // Update movement
        let movementStart = performance.now()
        movementUpdate(reactiveWorld, dt)
        performanceMonitor.recordSystemTime('movement', performance.now() - movementStart)

        // Update enemy AI (targeting, movement, attacks)
        let aiStart = performance.now()
        enemyAIUpdate(reactiveWorld)
        performanceMonitor.recordSystemTime('ai', performance.now() - aiStart)

        // --- WeaponSystem: Attack with space bar ---
        if (inputSystem.isActionPressed(INPUT_ACTIONS.ACTION_PRIMARY)) {
          // Find enemies in range
          const playerTransform = reactiveWorld.getComponent(player, COMPONENTS.TRANSFORM)
          const equipment = reactiveWorld.getComponent(player, COMPONENTS.EQUIPMENT)
          const inventory = reactiveWorld.getComponent(player, COMPONENTS.INVENTORY) || []
          const mainHandUid = equipment?.slots?.mainHand
          const invItem = mainHandUid ? inventory.find((it: any) => it.uid === mainHandUid) : null
          let weapon: any = null
          if (invItem) {
            const def = ITEM_CATALOG[invItem.id]
            if (def && def.type === 'weapon') {
              weapon = {
                id: def.id,
                name: def.name,
                type: 'sword',
                damage: { baseValue: def.stats?.attack ?? 5, variance: 2, type: 'physical' },
                attackSpeed: 1.0,
                range: 60,
                weight: def.weight ?? 5,
                durability: { current: invItem.durability ?? (def.stats?.durability ?? 100), max: def.stats?.durability ?? 100 },
                effects: [],
                rarity: def.rarity,
                level: 1,
                description: def.description,
              }
            }
          }
          if (playerTransform && weapon) {
            const enemies = reactiveWorld.query(COMPONENTS.TRANSFORM, COMPONENTS.HEALTH)
              .filter(e => e.entity !== player)
            for (const e of enemies) {
              const t = e.comps[0]
              const dx = t.x - playerTransform.x
              const dy = t.y - playerTransform.y
              const dist = Math.sqrt(dx*dx + dy*dy)
              if (dist < 120) {
                // Execute attack
                const result = weaponSystem.executeAttack(player, e.entity, weapon)
                console.log(`[Attack] hit=${result.hit}`, { player, target: e.entity, dist, weapon, result })
                break
              }
            }
          }
        }

        // Render frame (pass quad for debug metrics)
        let renderStart = performance.now()
        try {
          renderUpdate(reactiveWorld, dt, { width: canvasSize.width, height: canvasSize.height }, quad)
        } catch (renderError) {
          console.error('❌ [Frame] Render error:', renderError)
        }
        performanceMonitor.recordSystemTime('render', performance.now() - renderStart)

        // End performance tracking and update metrics
        const entityCount = reactiveWorld.query(COMPONENTS.TRANSFORM).length
        const quadStats = quad.getMetrics()
        performanceMonitor.endFrame(entityCount, quadStats)

        // Update performance metrics state (throttle to every 10 frames to avoid excessive re-renders)
        if (performanceMonitor.getMetrics().totalFrames % 10 === 0) {
          setPerformanceMetrics(performanceMonitor.getMetrics())
        }

        if (running) requestAnimationFrame(frame)
      }

      requestAnimationFrame(frame)

      // Cleanup on unmount or ready change
      return () => {
        running = false
        inputSystem.detach()
        canvas.removeEventListener('click', handleCanvasClick)
        window.removeEventListener('keydown', debugDamageKey)
        window.removeEventListener('keydown', inventoryKey)
        window.removeEventListener('keydown', equipmentKey)
        window.removeEventListener('keydown', saveLoadKey)
        window.removeEventListener('keydown', escapeKey)
        window.removeEventListener('keydown', levelSwitchKey)
        window.removeEventListener('keydown', debugOverlayKey)
        unsubscribe()
        unsubInv()
      }
    } catch (error) {
      console.error('❌ [App] Initialization error:', error)
      if (error instanceof Error) {
        console.error('Message:', error.message)
        console.error('Stack:', error.stack)
      }
    }
  }, [ready, dpr])

  return (
    <GameStateProvider world={gameWorld} playerId={gamePlayerId}>
      <GameHUD
        canvas={<canvas ref={canvasRef} />}
        worldUI={
          <div className="health-bar-overlay">
            <HealthBar entity={gamePlayerId} width={250} height={35} />
          </div>
        }
        hudBar={
          <HUDBar 
            playerId={gamePlayerId}
            levelName={levelManagerRef.current?.getCurrentLevel()?.name}
            showExperience={true}
            showTime={true}
          />
        }
        overlays={
          <>
            {/* Inventory Panel */}
            {inventoryVisible && (
              <div className="inventory-panel-container fade-in">
                <InventoryPanel
                  onClose={() => setInventoryVisible(false)}
                  items={
                    (gameWorld && gamePlayerId != null) ? ((gameWorld.getComponent(gamePlayerId, COMPONENTS.INVENTORY) as any[]) || []) : []
                  }
                  key={inventoryVersion}
                  onUse={(it) => {
                    const w = worldRef.current
                    const p = playerRef.current
                    if (!w || p == null) return
                    consumeItem(w as any, p, it.uid)
                  }}
                  onDrop={(it) => {
                    const w = worldRef.current
                    const p = playerRef.current
                    if (!w || p == null) return
                    dropItem(w as any, p, it.uid, 1)
                  }}
                />
              </div>
            )}
            {/* Equipment Panel */}
            {equipmentVisible && (
              <div className="equipment-panel-container fade-in">
                <EquipmentPanel
                  equipment={
                    (gameWorld && gamePlayerId != null)
                      ? ((gameWorld.getComponent(gamePlayerId, COMPONENTS.EQUIPMENT)?.slots) || {})
                      : {}
                  }
                  items={
                    (gameWorld && gamePlayerId != null)
                      ? (Array.isArray(gameWorld.getComponent(gamePlayerId, COMPONENTS.INVENTORY))
                          ? (gameWorld.getComponent(gamePlayerId, COMPONENTS.INVENTORY) as any[])
                          : []
                        ).reduce((acc, it) => { acc[it.uid] = it; return acc }, {} as Record<string, any>)
                      : {}
                  }
                  onUnequip={(slot) => {
                    const w = worldRef.current
                    const p = playerRef.current
                    if (!w || p == null) return
                    const equipment = w.getComponent(p, COMPONENTS.EQUIPMENT)
                    if (!equipment || !equipment.slots) return
                    const uid = equipment.slots[slot]
                    if (!uid) return
                    const newSlots = { ...equipment.slots }
                    delete newSlots[slot]
                    w.addComponent(p, COMPONENTS.EQUIPMENT, { slots: newSlots })
                    setInventoryVersion(v => v + 1)
                  }}
                />
              </div>
            )}
            {/* Dialog Box */}
            {dialogVisible && currentDialogNode && currentDialogTreeId && (
              <DialogBox
                node={currentDialogNode}
                questFlags={questFlags}
                onChoiceSelected={(choiceIndex) => {
                  const w = worldRef.current
                  const p = playerRef.current
                  if (!w || p == null) return
                  
                  if (chooseDialogOption(w, p, choiceIndex)) {
                    const dialogState = getDialogState(w, p)
                    
                    if (!dialogState) {
                      // Dialog ended
                      setDialogVisible(false)
                      setCurrentDialogNode(null)
                      setCurrentDialogTreeId(null)
                    } else {
                      // Navigate to next node
                      const nextNode = getDialogNode(dialogState.treeId, dialogState.currentNodeId)
                      if (nextNode) {
                        setCurrentDialogNode(nextNode)
                        
                        // Update quest flags
                        const flags = w.getComponent(p, COMPONENTS.QUEST_FLAGS) as Record<string, any> || {}
                        setQuestFlags(flags)
                        
                        // Force inventory update in case items were given
                        setInventoryVersion(v => v + 1)
                      }
                    }
                  }
                }}
                onClose={() => {
                  const w = worldRef.current
                  const p = playerRef.current
                  if (w && p != null) {
                    endDialog(w, p)
                  }
                  setDialogVisible(false)
                  setCurrentDialogNode(null)
                  setCurrentDialogTreeId(null)
                }}
              />
            )}
            {/* Debug Overlay */}
            <DebugOverlay
              metrics={performanceMetrics}
              isVisible={debugOverlayVisible}
              onToggle={() => setDebugOverlayVisible(v => !v)}
            />
          </>
        }
        modals={
          <>
            {/* Save/Load Menu */}
            {saveLoadVisible && (
              <SaveLoadMenu
                onClose={() => setSaveLoadVisible(false)}
                onSave={(slot, name) => {
                  const w = worldRef.current
                  const p = playerRef.current
                  const lm = levelManagerRef.current
                  if (!w || p == null || !lm) return
                  const currentLevel = lm.getCurrentLevel()
                  const levelId = currentLevel?.id || 'unknown'
                  saveGame(w, p, levelId, slot, name)
                  console.log(`[App] Game saved to slot ${slot}`)
                }}
                onLoad={(slot) => {
                  const w = worldRef.current
                  const lm = levelManagerRef.current
                  if (!w || !lm) return
                  const saveData = loadGame(w, slot)
                  if (saveData) {
                    console.log(`[App] Game loaded from slot ${slot}`)
                    lm.transitionToLevel(saveData.levelId, () => {
                      console.log(`[App] Level transition complete after load`)
                    })
                    if (saveData.playerData.entityId !== playerRef.current) {
                      playerRef.current = saveData.playerData.entityId
                      setGamePlayerId(saveData.playerData.entityId)
                    }
                  }
                }}
                currentLevelId={levelManagerRef.current?.getCurrentLevel()?.id}
              />
            )}
            {/* Level Transition Overlay */}
            <LevelTransition
              isActive={transitionActive}
              levelName={transitionLevel?.name}
              levelDescription={transitionLevel?.description}
              duration={2000}
              onComplete={() => {
                setTransitionActive(false)
                setTransitionLevel(null)
              }}
            />
          </>
        }
        debugInfo={
          <div className="debug-info">
            <div>World: {gameWorld ? '✓' : '✗'}</div>
            <div>Player: {gamePlayerId ? '✓' : '✗'}</div>
            <div>Ready: {ready ? '✓' : '✗'}</div>
            <div className="debug-info-hotkeys">
              Level Hotkeys: 1 (Forest), 2 (Cave), 3 (Fortress)
            </div>
            <div className="debug-info-hotkeys">
              Hotkeys: I (Inventory), E (Equipment), S (Save/Load), ESC (Close)
            </div>
            {/* Debug buttons (pointerEvents enabled) */}
            <div className="debug-buttons">
              <button onClick={() => {
                 const w = worldRef.current; const p = playerRef.current; if (!w || p==null) return; const hp = w.getComponent(p, COMPONENTS.HEALTH); if (!hp) return; const newHp = { ...hp, current: Math.max(0, hp.current - 10) }; w.addComponent(p, COMPONENTS.HEALTH, newHp); try{ w.markComponentUpdated(p, COMPONENTS.HEALTH) }catch{};
               }}>Damage -10</button>
              <button onClick={() => {
                 const w = worldRef.current; const p = playerRef.current; if (!w || p==null) return; const hp = w.getComponent(p, COMPONENTS.HEALTH); if (!hp) return; const newHp = { ...hp, current: Math.min(hp.max, hp.current + 10) }; w.addComponent(p, COMPONENTS.HEALTH, newHp); try{ w.markComponentUpdated(p, COMPONENTS.HEALTH) }catch{};
               }}>Heal +10</button>
              <button onClick={() => {
                const w = worldRef.current; const p = playerRef.current; if (!w || p==null) return;
                const item = createItemInstance('potion_health', 1);
                pickupItem(w as any, p, item);
              }}>Pick Up</button>
              <button onClick={() => setInventoryVisible(v => !v)}>Toggle Inventory (I)</button>
             </div>
           </div>
        }
      />
    </GameStateProvider>
  )
}

export default App
