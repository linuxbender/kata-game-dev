import type { TypedWorld } from '@engine/componentTypes'

/**
 * Scene interface for state management (prepared, not yet integrated)
 * Allows switching between menu, gameplay, pause states.
 */
export interface Scene {
  name: string
  onEnter: (world: TypedWorld, context?: any) => void
  onExit: (world: TypedWorld) => void
  update: (world: TypedWorld, dt: number) => void
  render?: (ctx: CanvasRenderingContext2D, world: TypedWorld) => void
  onInput?: (action: string) => void
}

export enum SCENE_NAMES {
  MENU = 'menu',
  GAMEPLAY = 'gameplay',
  PAUSE = 'pause',
  GAME_OVER = 'gameOver'
}

/**
 * Scene manager (prepared, not yet integrated)
 * Manages scene transitions and lifecycle.
 */
export const createSceneManager = () => {
  let current: Scene | null = null
  const scenes = new Map<string, Scene>()
  const history: string[] = []

  const register = (scene: Scene) => {
    scenes.set(scene.name, scene)
  }

  const switchTo = (name: string, world: TypedWorld, context?: any) => {
    if (current) {
      current.onExit(world)
      history.push(current.name)
    }

    const next = scenes.get(name)
    if (!next) throw new Error(`Scene '${name}' not registered`)

    current = next
    current.onEnter(world, context)
  }

  const back = (world: TypedWorld) => {
    if (history.length === 0) return
    const previous = history.pop()!
    if (current) current.onExit(world)

    const prev = scenes.get(previous)
    if (prev) {
      current = prev
      current.onEnter(world)
    }
  }

  const update = (world: TypedWorld, dt: number) => {
    if (current) current.update(world, dt)
  }

  const render = (ctx: CanvasRenderingContext2D, world: TypedWorld) => {
    if (current?.render) current.render(ctx, world)
  }

  const handleInput = (action: string) => {
    if (current?.onInput) current.onInput(action)
  }

  return {
    register,
    switchTo,
    back,
    update,
    render,
    handleInput,
    getCurrentScene: () => current,
    getSceneNames: () => Array.from(scenes.keys())
  }
}

