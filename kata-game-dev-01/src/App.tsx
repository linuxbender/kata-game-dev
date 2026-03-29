import React, { useEffect, useRef, useState, useCallback } from 'react'
import './App.css'
import { createWorld } from '@game/setupWorld'
import { createMovementSystem } from '@engine/systems/MovementSystem'
import { createEnemyAISystem } from '@engine/systems/EnemyAISystem'
import { createRenderSystem } from '@engine/systems/RenderSystem'
import { createInputSystem, INPUT_ACTIONS } from '@engine/systems/InputSystem'
import { createQuadTree } from '@engine/spatial/QuadTree'
import { ReactiveWorld } from '@engine/ReactiveWorld'
import { COMPONENTS, EVENT_TYPES } from '@engine/constants'
import { useCanvas } from '@hooks/useCanvas'
import { useQuadConfig } from '@contexts/QuadConfigContext'
import { GameStateProvider } from '@contexts/GameStateContext'
import { HealthBar } from '@ui/components/HealthBar'
import { startDialog, chooseDialogOption, endDialog, getDialogState, pickupItem } from '@game/GameActions'
import { createItemInstance } from '@game/configs/ItemConfig'
import { getDialogTree, getDialogNode } from '@game/configs/DialogConfig'
import type { DialogNode } from '@game/configs/DialogConfig'
import InventoryPanel from '@ui/components/InventoryPanel'
import EquipmentPanel from '@ui/components/EquipmentPanel'
import SaveLoadMenu from '@ui/components/SaveLoadMenu'
import DialogBox from '@ui/components/DialogBox'
import ControlsOverlay from '@ui/components/ControlsOverlay'
import { WeaponSystem } from '@engine/systems/WeaponSystem'
import ITEM_CATALOG from '@game/configs/ItemConfig'
import { LevelManager } from '@game/LevelManager'
import { LevelTransition } from '@ui/components/LevelTransition'
import { saveGame, loadGame } from '@game/SaveSystem'
import GameHUD from '@ui/layouts/GameHUD'
import HUDBar from '@ui/components/HUDBar'
import DebugOverlay from '@ui/components/DebugOverlay'
import { createPerformanceMonitor, type PerformanceMetrics } from '@/debug/PerformanceMonitor'
import { useHotkeys } from '@hooks/useHotkeys'
import { useUIState } from '@hooks/useUIState'

// ---------------------------------------------------------------------------
// Level definitions — extend this map to add new levels
// ---------------------------------------------------------------------------
const LEVEL_MAP: Record<string, { id: string; name: string; description: string }> = {
  '1': { id: 'level_1_forest',   name: 'Forest Clearing', description: 'A peaceful forest with scattered goblin scouts' },
  '2': { id: 'level_2_cave',     name: 'Dark Cave',       description: 'A dangerous cave filled with goblins and orcs' },
  '3': { id: 'level_3_fortress', name: 'Orc Fortress',    description: 'A heavily fortified orc stronghold' },
}

// ---------------------------------------------------------------------------
// App Component
// ---------------------------------------------------------------------------
const App = () => {
  const { canvasRef, ready, dpr, canvasSize } = useCanvas()
  const { config: persistedConfig, setConfig: persistConfig } = useQuadConfig()

  // Refs to ECS objects that must not trigger re-renders
  const worldRef      = useRef<ReactiveWorld | null>(null)
  const playerRef     = useRef<number | null>(null)
  const levelManagerRef  = useRef<LevelManager | null>(null)
  const inputSystemRef   = useRef<ReturnType<typeof createInputSystem> | null>(null)

  // State exposed to the React tree via GameStateProvider
  const [gameWorld,    setGameWorld]    = useState<ReactiveWorld | null>(null)
  const [gamePlayerId, setGamePlayerId] = useState<number | null>(null)

  // All panel open/close state via useUIState
  const ui = useUIState()

  // Dialog state lives here because it needs ECS coordination
  const [dialogVisible,        setDialogVisible]        = useState(false)
  const [currentDialogNode,    setCurrentDialogNode]    = useState<DialogNode | null>(null)
  const [currentDialogTreeId,  setCurrentDialogTreeId]  = useState<string | null>(null)
  const [questFlags,           setQuestFlags]           = useState<Record<string, unknown>>({})

  // Level transition overlay
  const [transitionActive, setTransitionActive] = useState(false)
  const [transitionLevel,  setTransitionLevel]  = useState<{ name: string; description: string } | null>(null)

  // Performance metrics (updated every 10 frames)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 0, avgFps: 0, minFps: 0, maxFps: 0,
    frameTime: 0, avgFrameTime: 0,
    entityCount: 0, systemTimings: [], totalFrames: 0,
  })

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const closeDialog = useCallback(() => {
    const w = worldRef.current; const p = playerRef.current
    if (w && p != null) endDialog(w, p)
    setDialogVisible(false)
    setCurrentDialogNode(null)
    setCurrentDialogTreeId(null)
  }, [])

  const modifyHealth = useCallback((delta: number) => {
    const w = worldRef.current; const p = playerRef.current
    if (!w || p == null) return
    const hp = w.getComponent(p, COMPONENTS.HEALTH)
    if (!hp) return
    const next = { ...hp, current: Math.max(0, Math.min(hp.max, hp.current + delta)) }
    w.addComponent(p, COMPONENTS.HEALTH, next)
    try { w.markComponentUpdated(p, COMPONENTS.HEALTH) } catch { /* noop */ }
  }, [])

  const loadLevel = useCallback((key: string) => {
    const lm = levelManagerRef.current
    const level = LEVEL_MAP[key]
    if (!lm || !level) return
    setTransitionLevel({ name: level.name, description: level.description })
    setTransitionActive(true)
    setTimeout(() => lm.transitionToLevel(level.id, () => {}), 400)
  }, [])

  // Weapon attack — runs inside the game loop, extracted to keep the loop readable
  const handleWeaponAttack = useCallback((world: ReactiveWorld, player: number) => {
    const inputSystem = inputSystemRef.current
    if (!inputSystem?.isActionPressed(INPUT_ACTIONS.ACTION_PRIMARY)) return

    const playerTransform = world.getComponent(player, COMPONENTS.TRANSFORM)
    const equipment = world.getComponent(player, COMPONENTS.EQUIPMENT)
    const inventory: any[] = (world.getComponent(player, COMPONENTS.INVENTORY) as any[]) || []
    const mainHandUid = equipment?.slots?.mainHand
    const invItem = mainHandUid ? inventory.find(it => it.uid === mainHandUid) : null
    if (!invItem) return

    const def = ITEM_CATALOG[invItem.id]
    if (!def || def.type !== 'weapon' || !playerTransform) return

    const weapon: any = {
      id: def.id, name: def.name, type: 'sword',
      damage: { baseValue: def.stats?.attack ?? 5, variance: 2, type: 'physical' },
      attackSpeed: 1.0, range: 60, weight: def.weight ?? 5,
      durability: {
        current: invItem.durability ?? (def.stats?.durability ?? 100),
        max: def.stats?.durability ?? 100,
      },
      effects: [], rarity: def.rarity, level: 1, description: def.description,
    }

    const weaponSystem = new WeaponSystem(world)
    const enemies = world.query(COMPONENTS.TRANSFORM, COMPONENTS.HEALTH).filter(e => e.entity !== player)
    for (const e of enemies) {
      const [t] = e.comps
      const dist = Math.sqrt((t.x - playerTransform.x) ** 2 + (t.y - playerTransform.y) ** 2)
      if (dist < 120) {
        weaponSystem.executeAttack(player, e.entity, weapon)
        break
      }
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Hotkeys — single listener, only active once canvas is ready
  // ---------------------------------------------------------------------------
  useHotkeys({
    // UI panels — all conflict-free with WASD movement (W/A/S/D)
    i:      ui.toggleInventory,            // Inventory
    e:      ui.toggleEquipment,            // Equipment
    p:      ui.toggleSaveLoad,             // Pause / Save-Load  (was S — conflicted with move-down)
    f3:     (ev) => { ev.preventDefault(); ui.toggleDebugOverlay() }, // Debug overlay — F3 is layout-independent
    '?':    ui.toggleControls,             // Controls reference

    // Debug helpers (H/J don't conflict with WASD)
    h:      () => modifyHealth(-10),
    j:      () => modifyHealth(10),

    // Level switching
    '1':    () => loadLevel('1'),
    '2':    () => loadLevel('2'),
    '3':    () => loadLevel('3'),

    // Close top-most open panel
    escape: (ev) => { ev.preventDefault(); ui.handleEsc(dialogVisible, closeDialog) },
  }, ready)

  // ---------------------------------------------------------------------------
  // Game initialization & loop
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!ready) return
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const reactiveWorld = new ReactiveWorld()
      const { player, quadConfig } = createWorld(reactiveWorld)

      worldRef.current   = reactiveWorld
      playerRef.current  = player
      setGameWorld(reactiveWorld)
      setGamePlayerId(player)

      const levelManager = new LevelManager(reactiveWorld)
      levelManager.setPlayer(player)
      levelManagerRef.current = levelManager
      levelManager.loadLevel('level_1_forest')

      const { update: movementUpdate }  = createMovementSystem()
      const { update: enemyAIUpdate }   = createEnemyAISystem()

      const inputSystem = createInputSystem({ movementSpeed: 150, enableDiagonalNormalization: true })
      inputSystemRef.current = inputSystem

      const quad = createQuadTree(
        quadConfig.boundary,
        quadConfig.capacity  ?? 8,
        quadConfig.maxDepth  ?? 8,
        {
          mergeThreshold:    persistedConfig.mergeThreshold    ?? quadConfig.mergeThreshold,
          rebalanceInterval: persistedConfig.rebalanceInterval ?? quadConfig.rebalanceInterval,
          onConfigChange: (c: { mergeThreshold: number; rebalanceInterval: number }) => {
            try { persistConfig(c) } catch { /* noop */ }
          },
        }
      )

      const { update: renderUpdate } = createRenderSystem(canvas, player, {
        dpr,
        camera: { dampingSeconds: 0.12, deadZoneRadius: 3, lookAheadFactor: 0.2 },
      }, quad)

      // Populate quad tree with initial entities
      const trackedEntities = new Set<number>()
      for (const e of reactiveWorld.query(COMPONENTS.TRANSFORM, COMPONENTS.RENDERABLE)) {
        const t = e.comps[0]
        quad.insert({ x: t.x, y: t.y, entity: e.entity })
        trackedEntities.add(e.entity)
      }

      // Keep quad tree in sync with ECS transform changes
      const unsubTransform = reactiveWorld.onComponentEvent((ev: any) => {
        if (ev.name !== COMPONENTS.TRANSFORM) return
        const id = ev.entity
        if (ev.type === EVENT_TYPES.ADD) {
          quad.insert({ x: ev.component.x, y: ev.component.y, entity: id })
          trackedEntities.add(id)
        } else if (ev.type === EVENT_TYPES.UPDATE) {
          const pos = reactiveWorld.getComponent(id, COMPONENTS.TRANSFORM)
          if (pos) {
            if (quad.has(id)) quad.update(id, pos.x, pos.y)
            else { quad.insert({ x: pos.x, y: pos.y, entity: id }); trackedEntities.add(id) }
          }
        } else if (ev.type === EVENT_TYPES.REMOVE) {
          if (quad.has(id)) quad.remove(id)
          trackedEntities.delete(id)
        }
      })

      inputSystem.attach()

      // Canvas click: start dialog when player clicks an NPC
      const handleCanvasClick = (e: MouseEvent) => {
        const w = worldRef.current; const p = playerRef.current
        if (!w || p == null) return
        const rect = canvas.getBoundingClientRect()
        const playerTransform = w.getComponent(p, COMPONENTS.TRANSFORM)
        if (!playerTransform) return

        // Convert screen coords → world coords (camera is centered on player)
        const worldX = (e.clientX - rect.left) - canvasSize.width  / 2 + playerTransform.x
        const worldY = (e.clientY - rect.top)  - canvasSize.height / 2 + playerTransform.y

        for (const npc of reactiveWorld.query(COMPONENTS.TRANSFORM, COMPONENTS.METADATA).filter(n => n.comps[1].isNPC)) {
          const [nt, meta] = npc.comps
          const dist = Math.sqrt((nt.x - worldX) ** 2 + (nt.y - worldY) ** 2)
          if (dist < 30) {
            // dialogTreeId is set per NPC in its metadata (EntityBlueprints.ts)
            const treeId: string = meta.dialogTreeId ?? 'merchant_dialog'
            if (startDialog(w, p, npc.entity, treeId)) {
              const tree = getDialogTree(treeId)
              if (tree) {
                setCurrentDialogNode(tree.nodes[tree.startNodeId])
                setCurrentDialogTreeId(treeId)
                setDialogVisible(true)
                setQuestFlags((w.getComponent(p, COMPONENTS.QUEST_FLAGS) as Record<string, unknown>) ?? {})
              }
            }
            break
          }
        }
      }
      canvas.addEventListener('click', handleCanvasClick)

      // Performance monitor
      const performanceMonitor = createPerformanceMonitor(60)
      let last = performance.now()
      let running = true

      // Main game loop
      const frame = (now: number) => {
        performanceMonitor.startFrame()
        const dt = Math.min((now - last) / 1000, 0.05)
        last = now
        reactiveWorld.updateTime(dt)

        let t = performance.now()
        inputSystem.update(reactiveWorld, player, dt)
        performanceMonitor.recordSystemTime('input', performance.now() - t)

        t = performance.now()
        movementUpdate(reactiveWorld, dt)
        performanceMonitor.recordSystemTime('movement', performance.now() - t)

        t = performance.now()
        enemyAIUpdate(reactiveWorld)
        performanceMonitor.recordSystemTime('ai', performance.now() - t)

        handleWeaponAttack(reactiveWorld, player)

        t = performance.now()
        try {
          renderUpdate(reactiveWorld, dt, { width: canvasSize.width, height: canvasSize.height }, quad)
        } catch (err) {
          console.error('[Frame] Render error:', err)
        }
        performanceMonitor.recordSystemTime('render', performance.now() - t)

        const entityCount = reactiveWorld.query(COMPONENTS.TRANSFORM).length
        performanceMonitor.endFrame(entityCount, quad.getMetrics())

        if (performanceMonitor.getMetrics().totalFrames % 10 === 0) {
          setPerformanceMetrics(performanceMonitor.getMetrics())
        }

        if (running) requestAnimationFrame(frame)
      }

      requestAnimationFrame(frame)

      return () => {
        running = false
        inputSystem.detach()
        canvas.removeEventListener('click', handleCanvasClick)
        unsubTransform()
      }
    } catch (error) {
      console.error('[App] Initialization error:', error)
    }
  }, [ready, dpr])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
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
            levelName={levelManagerRef.current?.getCurrentLevel()?.name}
            showExperience
            showTime
          />
        }

        overlays={
          <>
            {ui.inventoryVisible && (
              <div className="inventory-panel-container fade-in">
                <InventoryPanel onClose={ui.closeInventory} />
              </div>
            )}
            {ui.equipmentVisible && (
              <div className="equipment-panel-container fade-in">
                <EquipmentPanel onClose={ui.closeEquipment} />
              </div>
            )}
            {dialogVisible && currentDialogNode && currentDialogTreeId && (
              <DialogBox
                node={currentDialogNode}
                questFlags={questFlags}
                onChoiceSelected={(choiceIndex) => {
                  const w = worldRef.current; const p = playerRef.current
                  if (!w || p == null) return
                  if (chooseDialogOption(w, p, choiceIndex)) {
                    const state = getDialogState(w, p)
                    if (!state) {
                      closeDialog()
                    } else {
                      const nextNode = getDialogNode(state.treeId, state.currentNodeId)
                      if (nextNode) {
                        setCurrentDialogNode(nextNode)
                        setQuestFlags((w.getComponent(p, COMPONENTS.QUEST_FLAGS) as Record<string, unknown>) ?? {})
                      }
                    }
                  }
                }}
                onClose={closeDialog}
              />
            )}
            {ui.controlsVisible && <ControlsOverlay onClose={ui.closeControls} />}
            <DebugOverlay
              metrics={performanceMetrics}
              isVisible={ui.debugOverlayVisible}
              onToggle={ui.toggleDebugOverlay}
            />
          </>
        }

        modals={
          <>
            {ui.saveLoadVisible && (
              <SaveLoadMenu
                onClose={ui.closeSaveLoad}
                onSave={(slot, name) => {
                  const w = worldRef.current; const p = playerRef.current; const lm = levelManagerRef.current
                  if (!w || p == null || !lm) return
                  saveGame(w, p, lm.getCurrentLevel()?.id ?? 'unknown', slot, name)
                }}
                onLoad={(slot) => {
                  const w = worldRef.current; const lm = levelManagerRef.current
                  if (!w || !lm) return
                  const saveData = loadGame(w, slot)
                  if (saveData) {
                    lm.transitionToLevel(saveData.levelId, () => {})
                    if (saveData.playerData.entityId !== playerRef.current) {
                      playerRef.current = saveData.playerData.entityId
                      setGamePlayerId(saveData.playerData.entityId)
                    }
                  }
                }}
                currentLevelId={levelManagerRef.current?.getCurrentLevel()?.id}
              />
            )}
            <LevelTransition
              isActive={transitionActive}
              levelName={transitionLevel?.name}
              levelDescription={transitionLevel?.description}
              duration={2000}
              onComplete={() => { setTransitionActive(false); setTransitionLevel(null) }}
            />
          </>
        }

        debugInfo={
          <div className="debug-info">
            <div>World: {gameWorld ? '✓' : '✗'} &nbsp; Player: {gamePlayerId ?? '–'} &nbsp; Ready: {ready ? '✓' : '✗'}</div>
            <div className="debug-info-hotkeys">Levels: 1 Forest · 2 Cave · 3 Fortress &nbsp;|&nbsp; ? Controls</div>
            <div className="debug-buttons">
              <button onClick={() => modifyHealth(-10)}>Damage -10 (H)</button>
              <button onClick={() => modifyHealth(10)}>Heal +10 (J)</button>
              <button onClick={() => {
                const w = worldRef.current; const p = playerRef.current
                if (w && p != null) pickupItem(w as any, p, createItemInstance('potion_health', 1))
              }}>Pick Up Potion</button>
            </div>
          </div>
        }
      />
    </GameStateProvider>
  )
}

export default App
