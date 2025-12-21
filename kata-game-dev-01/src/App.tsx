import React, { useEffect, useRef, useState } from 'react'
import { createWorld } from '@game/setupWorld'
import { createMovementSystem } from '@engine/systems/MovementSystem'
import { createEnemyAISystem } from '@engine/systems/EnemyAISystem'
import { createRenderSystem } from '@engine/systems/RenderSystem'
import { createInputSystem, INPUT_ACTIONS } from '@engine/systems/InputSystem'
import { createQuadTree } from '@engine/spatial/QuadTree'
import { createDebugOverlay } from '@engine/systems/DebugOverlay'
import { ReactiveWorld } from '@engine/ReactiveWorld'
import { COMPONENTS, EVENT_TYPES } from '@engine/constants'
import { useCanvas } from './hooks/useCanvas'
import { useQuadConfig } from './contexts/QuadConfigContext'
import { GameStateProvider } from './contexts/GameStateContext'
import { HealthBar } from './ui/components/HealthBar'
import { pickupItem, consumeItem, dropItem } from '@game/GameActions'
import { createItemInstance } from '@game/configs/ItemConfig'
import InventoryPanel from './ui/components/InventoryPanel'
import EquipmentPanel from './ui/components/EquipmentPanel'
import { WeaponSystem } from '@engine/systems/WeaponSystem'
import ITEM_CATALOG from '@game/configs/ItemConfig'

// Main app component that manages game loop, systems, and quad-tree spatial indexing
const App = () => {
  const { canvasRef, ready, dpr, canvasSize } = useCanvas()
  const worldRef = useRef<ReactiveWorld | null>(null)
  const playerRef = useRef<number | null>(null)

  // State for GameStateProvider
  const [gameWorld, setGameWorld] = useState<ReactiveWorld | null>(null)
  const [gamePlayerId, setGamePlayerId] = useState<number | null>(null)
  const [inventoryVisible, setInventoryVisible] = useState(false)
  const [equipmentVisible, setEquipmentVisible] = useState(false)
  const [inventoryVersion, setInventoryVersion] = useState(0)

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
        if (key === 'escape') setInventoryVisible(false)
      }
      const equipmentKey = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase()
        if (key === 'e') setEquipmentVisible(v => !v)
        if (key === 'escape') setEquipmentVisible(false)
      }
      window.addEventListener('keydown', debugDamageKey)
      window.addEventListener('keydown', inventoryKey)
      window.addEventListener('keydown', equipmentKey)

      let last = performance.now()
      let running = true

      // WeaponSystem initialization
      const weaponSystem = new WeaponSystem(reactiveWorld)

      // Main game loop frame
      const frame = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.05)
        last = now

        // Update world time for game logic (cooldowns, timers, etc.)
        reactiveWorld.updateTime(dt)

        // Update input and player movement
        inputSystem.update(reactiveWorld, player, dt)

        // Handle debug overlay toggle
        const debugPressed = inputSystem.isActionPressed(INPUT_ACTIONS.DEBUG_TOGGLE)
        if (debugPressed && !lastDebugState) {
          debugOverlay.toggle()
        }
        lastDebugState = debugPressed

        // Update movement
        movementUpdate(reactiveWorld, dt)

        // Update enemy AI (targeting, movement, attacks)
        enemyAIUpdate(reactiveWorld)

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
        try {
          renderUpdate(reactiveWorld, dt, { width: canvasSize.width, height: canvasSize.height }, quad)
        } catch (renderError) {
          console.error('❌ [Frame] Render error:', renderError)
        }

        if (running) requestAnimationFrame(frame)
      }

      requestAnimationFrame(frame)

      // Cleanup on unmount or ready change
      return () => {
        running = false
        inputSystem.detach()
        window.removeEventListener('keydown', debugDamageKey)
        window.removeEventListener('keydown', inventoryKey)
        window.removeEventListener('keydown', equipmentKey)
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
      {/* Main game container */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#000',
        }}
      >
        {/* Canvas - now uses fixed positioning from useCanvas */}
        <canvas ref={canvasRef} />

        {/* React-based HealthBar overlay (single source of truth) */}
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          <HealthBar entity={gamePlayerId} width={250} height={35} />
        </div>

        {/* Inventory Panel - small fixed panel (no fullscreen backdrop) */}
        {inventoryVisible && (
          <div style={{ position: 'fixed', top: '80px', left: '20px', zIndex: 1002, pointerEvents: 'auto' }}>
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
                // call consumeItem which applies effects and decrements quantity
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
        {/* Equipment Panel - right next to InventoryPanel */}
        {equipmentVisible && (
          <div style={{ position: 'fixed', top: '80px', left: '340px', zIndex: 1002, pointerEvents: 'auto' }}>
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
                // Get equipment and inventory
                const equipment = w.getComponent(p, COMPONENTS.EQUIPMENT)
                if (!equipment || !equipment.slots) return
                const uid = equipment.slots[slot]
                if (!uid) return
                // Clear slot
                const newSlots = { ...equipment.slots }
                delete newSlots[slot]
                w.addComponent(p, COMPONENTS.EQUIPMENT, { slots: newSlots })
                // (Optional) Inventory update trigger (usually detected automatically)
                setInventoryVersion(v => v + 1)
              }}
            />
          </div>
        )}

        {/* Debug info */}
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: 1001,
            color: '#0f0',
            fontSize: '12px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '8px 12px',
            borderRadius: '4px',
          }}
        >
          <div>World: {gameWorld ? '✓' : '✗'}</div>
          <div>Player: {gamePlayerId ? '✓' : '✗'}</div>
          <div>Ready: {ready ? '✓' : '✗'}</div>
          {/* Debug buttons (pointerEvents enabled) */}
          <div style={{ marginTop: 8, pointerEvents: 'auto', display: 'flex', gap: 8 }}>
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
      </div>
    </GameStateProvider>
  )
}

export default App
