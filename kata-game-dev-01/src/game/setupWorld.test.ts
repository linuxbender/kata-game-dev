import { describe, it, expect, beforeEach } from 'vitest'
import { createWorld } from './setupWorld'
import { COMPONENTS } from '@engine/constants'

describe('createWorld (integration)', () => {
  let result: ReturnType<typeof createWorld>

  beforeEach(() => {
    result = createWorld()
  })

  it('returns world, player and quadConfig', () => {
    expect(result).toHaveProperty('world')
    expect(result).toHaveProperty('player')
    expect(result).toHaveProperty('quadConfig')
  })

  it('creates a player entity with expected components', () => {
    const { world, player } = result

    const transform = world.getComponent(player, COMPONENTS.TRANSFORM)
    expect(transform).toBeDefined()
    expect(typeof transform.x).toBe('number')
    expect(typeof transform.y).toBe('number')

    const velocity = world.getComponent(player, COMPONENTS.VELOCITY)
    expect(velocity).toBeDefined()

    const health = world.getComponent(player, COMPONENTS.HEALTH)
    expect(health).toBeDefined()
    expect(health.current).toBeGreaterThanOrEqual(0)
    expect(health.max).toBeGreaterThan(0)

    const renderable = world.getComponent(player, COMPONENTS.RENDERABLE)
    expect(renderable).toBeDefined()
    expect(renderable.type).toBeDefined()
  })

  it('spawns enemies and NPCs with renderable components', () => {
    const { world } = result
    const renderables = world.query(COMPONENTS.TRANSFORM, COMPONENTS.RENDERABLE)

    // We expect at least player + 6 enemies + 1 npc = 8 renderables
    expect(renderables.length).toBeGreaterThanOrEqual(8)

    // Ensure there is at least one goblin (health.max === 20) and one orc (health.max === 60)
    const healthValues = renderables
      .map(r => r.entity)
      .map(id => world.getComponent(id, COMPONENTS.HEALTH))
      .filter(Boolean)
      .map(h => h.max)

    expect(healthValues.includes(20)).toBe(true)
    expect(healthValues.includes(60)).toBe(true)
  })

  it('finds the merchant NPC by renderable color and validates its transform', () => {
    const { world } = result
    const renderables = world.query(COMPONENTS.TRANSFORM, COMPONENTS.RENDERABLE)

    const merchant = renderables.find(r => {
      const rend = r.comps[1] as any
      return rend && (rend.color === '#ffaa00' || rend.color === 'ffaa00')
    })

    expect(merchant).toBeDefined()
    const t = merchant!.comps[0] as any
    // Merchant spawn in setupWorld is (600, 500)
    expect(t.x).toBe(600)
    expect(t.y).toBe(500)
  })

  it('quadConfig has expected boundary and sane tuning', () => {
    const { quadConfig } = result
    expect(quadConfig.boundary).toBeDefined()
    expect(quadConfig.boundary.w).toBeGreaterThan(0)
    expect(quadConfig.boundary.h).toBeGreaterThan(0)
    expect(quadConfig.capacity).toBeGreaterThanOrEqual(4)
    expect(quadConfig.maxDepth).toBeGreaterThanOrEqual(4)
  })

  it('blueprint overrides (spawn positions) are applied', () => {
    const { world } = result
    // Look for an entity at one of the spawn positions (e.g. goblin at 300,300)
    const found = world.query(COMPONENTS.TRANSFORM, COMPONENTS.RENDERABLE).some(r => {
      const t = r.comps[0] as any
      return t.x === 300 && t.y === 300
    })
    expect(found).toBe(true)
  })

  it('world.getAllEntities returns a non-empty set and entity components are consistent', () => {
    const { world } = result
    const all = world.getAllEntities()
    expect(all.length).toBeGreaterThan(0)

    // Spot check: every entity returned has a transform component
    for (const id of all) {
      const t = world.getComponent(id, COMPONENTS.TRANSFORM)
      expect(t).toBeDefined()
    }
  })
})
