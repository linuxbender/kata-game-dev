import { COMPONENTS } from '@engine/constants'
import type { TypedWorld } from '@engine/componentTypes'

// Input action types as enum for type safety
export enum INPUT_ACTIONS {
  MOVE_UP = 'moveUp',
  MOVE_DOWN = 'moveDown',
  MOVE_LEFT = 'moveLeft',
  MOVE_RIGHT = 'moveRight',
  ACTION_PRIMARY = 'actionPrimary',
  ACTION_SECONDARY = 'actionSecondary',
  DEBUG_TOGGLE = 'debugToggle',
  PAUSE = 'pause'
}

export type InputAction = `${INPUT_ACTIONS}`

// Input configuration mapping actions to key bindings
export interface InputMapping {
  [INPUT_ACTIONS.MOVE_UP]: string[]
  [INPUT_ACTIONS.MOVE_DOWN]: string[]
  [INPUT_ACTIONS.MOVE_LEFT]: string[]
  [INPUT_ACTIONS.MOVE_RIGHT]: string[]
  [INPUT_ACTIONS.ACTION_PRIMARY]?: string[]
  [INPUT_ACTIONS.ACTION_SECONDARY]?: string[]
  [INPUT_ACTIONS.DEBUG_TOGGLE]?: string[]
  [INPUT_ACTIONS.PAUSE]?: string[]
}

// Default WASD + Arrow keys configuration
export const DEFAULT_INPUT_MAPPING: InputMapping = {
  [INPUT_ACTIONS.MOVE_UP]: ['w', 'arrowup'],
  [INPUT_ACTIONS.MOVE_DOWN]: ['s', 'arrowdown'],
  [INPUT_ACTIONS.MOVE_LEFT]: ['a', 'arrowleft'],
  [INPUT_ACTIONS.MOVE_RIGHT]: ['d', 'arrowright'],
  [INPUT_ACTIONS.ACTION_PRIMARY]: ['space', 'enter'],
  [INPUT_ACTIONS.ACTION_SECONDARY]: ['shift'],
  [INPUT_ACTIONS.DEBUG_TOGGLE]: ['f3'],
  [INPUT_ACTIONS.PAUSE]: ['escape', 'p']
}

export interface InputSystemConfig {
  mapping: InputMapping
  movementSpeed: number
  enableDiagonalNormalization: boolean
}

/**
 * Input system: handles keyboard input and translates to game actions.
 * Supports configurable key bindings for future HUD-based configuration.
 */
export const createInputSystem = (config: Partial<InputSystemConfig> = {}) => {
  const mapping: InputMapping = config.mapping || DEFAULT_INPUT_MAPPING
  const movementSpeed = config.movementSpeed ?? 150
  const enableDiagonalNormalization = config.enableDiagonalNormalization ?? true

  // Track currently pressed keys
  const pressedKeys = new Set<string>()

  // Track action states for frame-based queries
  const actionStates = new Map<InputAction, boolean>()

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    pressedKeys.add(key)
    updateActionStates()
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    pressedKeys.delete(key)
    updateActionStates()
  }

  // Update action states based on current pressed keys
  const updateActionStates = () => {
    for (const [action, keys] of Object.entries(mapping) as [InputAction, string[]][]) {
      const isPressed = keys.some((k: string) => pressedKeys.has(k.toLowerCase()))
      actionStates.set(action, isPressed)
    }
  }

  // Check if a specific action is currently pressed
  const isActionPressed = (action: INPUT_ACTIONS): boolean => {
    return actionStates.get(action) || false
  }

  // Check if a specific key is pressed
  const isKeyPressed = (key: string): boolean => {
    return pressedKeys.has(key.toLowerCase())
  }

  // Update player movement based on input state
  const updateMovement = (world: TypedWorld, playerEntity: number, dt: number) => {
    let vx = 0
    let vy = 0

    if (isActionPressed(INPUT_ACTIONS.MOVE_RIGHT)) vx += 1
    if (isActionPressed(INPUT_ACTIONS.MOVE_LEFT)) vx -= 1
    if (isActionPressed(INPUT_ACTIONS.MOVE_DOWN)) vy += 1
    if (isActionPressed(INPUT_ACTIONS.MOVE_UP)) vy -= 1

    // Normalize diagonal movement to maintain constant speed
    if (enableDiagonalNormalization && vx !== 0 && vy !== 0) {
      const inv = 1 / Math.sqrt(2)
      vx *= inv
      vy *= inv
    }

    world.addComponent(playerEntity, COMPONENTS.VELOCITY, {
      vx: vx * movementSpeed,
      vy: vy * movementSpeed
    })
  }

  // Update function called each frame
  const update = (world: TypedWorld, playerEntity: number, dt: number) => {
    updateMovement(world, playerEntity, dt)
  }

  // Attach event listeners to window
  const attach = () => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    updateActionStates()
  }

  // Detach event listeners from window
  const detach = () => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    pressedKeys.clear()
    actionStates.clear()
  }

  // Get current configuration for saving/editing
  const getConfig = (): InputSystemConfig => ({
    mapping,
    movementSpeed,
    enableDiagonalNormalization
  })

  // Update configuration at runtime (for HUD settings)
  const updateConfig = (newConfig: Partial<InputSystemConfig>) => {
    if (newConfig.mapping) Object.assign(mapping, newConfig.mapping)
    if (newConfig.movementSpeed !== undefined) Object.assign({ movementSpeed: newConfig.movementSpeed })
    if (newConfig.enableDiagonalNormalization !== undefined) {
      Object.assign({ enableDiagonalNormalization: newConfig.enableDiagonalNormalization })
    }
  }

  return {
    update,
    attach,
    detach,
    isActionPressed,
    isKeyPressed,
    getConfig,
    updateConfig,
    getPressedKeys: () => Array.from(pressedKeys)
  }
}

