import { World, Entity } from '../engine/ECS'
import { COMPONENTS } from '../engine/constants'

// Initialize a world with a player entity and several NPCs.
export const createWorld = (): { world: World; player: Entity } => {
  const world = new World()

  // Create player entity
  const player = world.createEntity()
  world.addComponent(player, COMPONENTS.TRANSFORM, { x: 0, y: 0 })
  world.addComponent(player, COMPONENTS.VELOCITY, { vx: 0, vy: 0 })
  world.addComponent(player, COMPONENTS.RENDERABLE, { color: '#4EE21E', size: 12 })

  // Populate world with some NPCs
  for (let i = 0; i < 30; i++) {
    const e = world.createEntity()
    world.addComponent(e, COMPONENTS.TRANSFORM, { x: (Math.random() - 0.5) * 2000, y: (Math.random() - 0.5) * 2000 })
    world.addComponent(e, COMPONENTS.VELOCITY, { vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20 })
    world.addComponent(e, COMPONENTS.RENDERABLE, { color: '#E2A14E', size: 6 })
  }

  return { world, player }
}
