import { World, Entity } from '../engine/ECS'

export function createWorld(): { world: World; player: Entity } {
  const world = new World()

  // player
  const player = world.createEntity()
  world.addComponent(player, 'Transform', { x: 0, y: 0 })
  world.addComponent(player, 'Velocity', { vx: 0, vy: 0 })
  world.addComponent(player, 'Renderable', { color: '#4EE21E', size: 12 })

  // some NPCs
  for (let i = 0; i < 30; i++) {
    const e = world.createEntity()
    world.addComponent(e, 'Transform', { x: (Math.random() - 0.5) * 2000, y: (Math.random() - 0.5) * 2000 })
    world.addComponent(e, 'Velocity', { vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20 })
    world.addComponent(e, 'Renderable', { color: '#E2A14E', size: 6 })
  }

  return { world, player }
}
