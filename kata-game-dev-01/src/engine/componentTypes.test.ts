import { describe, it, expect } from 'vitest'
import type { Transform } from '@components/Transform'
import type { Health } from '@components/Health'
import type { Velocity } from '@components/Velocity'
import type { Renderable } from '@components/Renderable'
import type { Collider } from '@components/Collider'
import type { Point } from '@components/Transform'
import {
  // Type Guards
  isTransform,
  isVelocity,
  isHealth,
  isDamage,
  isStats,
  isInventory,
  isEquipment,
  isRenderable,
  isCollider,
  isAI,
  isEnemy,
  isParticleEmitter,
  isPoint,
  // Extractors
  extractComponentIfType,
  extractTransform,
  extractHealth,
  extractVelocity,
  extractDamage,
  extractStats,
  extractInventory,
  extractEquipment,
  extractRenderable,
  extractCollider,
  extractAI,
  extractEnemy,
  extractParticleEmitter,
  // Factories
  createTransform,
  createVelocity,
  createHealthComponent,
  createDamage,
  createStats,
  createInventory,
  createEquipment,
  createAI,
  createEnemy,
  createParticleEmitter,
  // Types from componentTypes
  type Damage,
  type Stats,
  type Inventory,
  type Equipment,
  type AI,
  type Enemy,
  type ParticleEmitter,
} from './componentTypes'

describe('Component Type Guards', () => {
  describe('isTransform', () => {
    it('should identify valid Transform', () => {
      const transform: Transform = { x: 10, y: 20, rotation: 45 }
      expect(isTransform(transform)).toBe(true)
    })

    it('should identify Transform without rotation', () => {
      const transform = { x: 10, y: 20 }
      expect(isTransform(transform)).toBe(true)
    })

    it('should reject missing x or y', () => {
      expect(isTransform({ x: 10 })).toBe(false)
      expect(isTransform({ y: 20 })).toBe(false)
      expect(isTransform({})).toBe(false)
    })

    it('should reject non-objects', () => {
      expect(isTransform(null)).toBe(false)
      expect(isTransform(undefined)).toBe(false)
      expect(isTransform('transform')).toBe(false)
      expect(isTransform(42)).toBe(false)
    })
  })

  describe('isVelocity', () => {
    it('should identify valid Velocity', () => {
      const velocity: Velocity = { vx: 5, vy: 10 }
      expect(isVelocity(velocity)).toBe(true)
    })

    it('should identify zero velocity', () => {
      expect(isVelocity({ vx: 0, vy: 0 })).toBe(true)
    })

    it('should reject missing properties', () => {
      expect(isVelocity({ vx: 5 })).toBe(false)
      expect(isVelocity({ vy: 10 })).toBe(false)
    })
  })

  describe('isHealth', () => {
    it('should identify valid Health', () => {
      const health: Health = { current: 50, max: 100 }
      expect(isHealth(health)).toBe(true)
    })

    it('should reject missing properties', () => {
      expect(isHealth({ current: 50 })).toBe(false)
      expect(isHealth({ max: 100 })).toBe(false)
    })
  })

  describe('isDamage', () => {
    it('should identify valid Damage', () => {
      const damage: Damage = { baseValue: 10, variance: 2 }
      expect(isDamage(damage)).toBe(true)
    })

    it('should reject invalid Damage', () => {
      expect(isDamage({ baseValue: 10 })).toBe(false)
      expect(isDamage({ variance: 2 })).toBe(false)
    })
  })

  describe('isStats', () => {
    it('should identify valid Stats', () => {
      const stats: Stats = { level: 1, experience: 0, experienceToNextLevel: 100 }
      expect(isStats(stats)).toBe(true)
    })

    it('should reject incomplete Stats', () => {
      expect(isStats({ level: 1, experience: 0 })).toBe(false)
      expect(isStats({ level: 1 })).toBe(false)
    })
  })

  describe('isInventory', () => {
    it('should identify valid Inventory', () => {
      const inventory: Inventory = { maxSlots: 20, items: [] }
      expect(isInventory(inventory)).toBe(true)
    })

    it('should identify Inventory with items', () => {
      const inventory = {
        maxSlots: 20,
        items: [{ id: 'sword', type: 'weapon', quantity: 1 }],
      }
      expect(isInventory(inventory)).toBe(true)
    })

    it('should reject invalid Inventory', () => {
      expect(isInventory({ maxSlots: 20 })).toBe(false)
      expect(isInventory({ items: [] })).toBe(false)
      expect(isInventory({ maxSlots: 20, items: 'not array' })).toBe(false)
    })
  })

  describe('isEquipment', () => {
    it('should identify valid Equipment', () => {
      const equipment: Equipment = {
        slots: { mainHand: 'sword', offHand: undefined },
      }
      expect(isEquipment(equipment)).toBe(true)
    })

    it('should identify Equipment with empty slots', () => {
      const equipment = { slots: {} }
      expect(isEquipment(equipment)).toBe(true)
    })

    it('should reject invalid Equipment', () => {
      expect(isEquipment({ mainHand: 'sword' })).toBe(false)
      expect(isEquipment({})).toBe(false)
    })
  })

  describe('isRenderable', () => {
    it('should identify valid Renderable', () => {
      const renderable: Renderable = { color: '#ff0000', size: 10 }
      expect(isRenderable(renderable)).toBe(true)
    })

    it('should reject incomplete Renderable', () => {
      expect(isRenderable({ color: '#ff0000' })).toBe(false)
      expect(isRenderable({ size: 10 })).toBe(false)
    })
  })

  describe('isCollider', () => {
    it('should identify valid Collider', () => {
      const collider: Collider = {
        radius: 10,
        layer: 1,
        isTrigger: false,
        solid: true,
      }
      expect(isCollider(collider)).toBe(true)
    })

    it('should reject incomplete Collider', () => {
      expect(isCollider({ radius: 10, layer: 1 })).toBe(false)
    })
  })

  describe('isAI', () => {
    it('should identify valid AI', () => {
      const ai: AI = {
        type: 'aggressive',
        detectionRange: 200,
        attackRange: 30,
        speed: 100,
      }
      expect(isAI(ai)).toBe(true)
    })

    it('should reject incomplete AI', () => {
      expect(isAI({ type: 'aggressive', detectionRange: 200 })).toBe(false)
    })
  })

  describe('isEnemy', () => {
    it('should identify valid Enemy', () => {
      const enemy: Enemy = { type: 'goblin', difficulty: 'easy', spawnX: 100, spawnY: 100 }
      expect(isEnemy(enemy)).toBe(true)
    })

    it('should reject incomplete Enemy', () => {
      expect(isEnemy({ type: 'goblin', spawnX: 100 })).toBe(false)
    })
  })

  describe('isParticleEmitter', () => {
    it('should identify valid ParticleEmitter', () => {
      const emitter: ParticleEmitter = {
        emissionRate: 10,
        lifetime: 1000,
        particleCount: 100,
      }
      expect(isParticleEmitter(emitter)).toBe(true)
    })

    it('should reject incomplete ParticleEmitter', () => {
      // Missing particleCount
      expect(isParticleEmitter({ emissionRate: 10, lifetime: 1000 })).toBe(false)
      // Missing lifetime
      expect(isParticleEmitter({ emissionRate: 10, particleCount: 100 })).toBe(false)
      // Missing emissionRate
      expect(isParticleEmitter({ lifetime: 1000, particleCount: 100 })).toBe(false)
    })
  })

  describe('isPoint', () => {
    it('should identify valid Point', () => {
      const point: Point = { x: 10, y: 20 }
      expect(isPoint(point)).toBe(true)
    })

    it('should reject invalid Point', () => {
      expect(isPoint({ x: 10 })).toBe(false)
      expect(isPoint({})).toBe(false)
    })

    it('should only accept numeric x and y values', () => {
      expect(isPoint({ x: 'ten', y: 20 })).toBe(false)
      expect(isPoint({ x: 10, y: 'twenty' })).toBe(false)
      expect(isPoint({ x: null, y: 20 })).toBe(false)
      expect(isPoint({ x: 10, y: undefined })).toBe(false)
    })
  })
})

describe('Component Extractors', () => {
  describe('extractComponentIfType', () => {
    it('should extract matching component', () => {
      const transform = { x: 10, y: 20 }
      const result = extractComponentIfType(transform, isTransform)
      expect(result).toEqual(transform)
    })

    it('should return undefined for non-matching', () => {
      const velocity = { vx: 5, vy: 10 }
      const result = extractComponentIfType(velocity, isTransform)
      expect(result).toBeUndefined()
    })
  })

  describe('extractTransform', () => {
    it('should extract valid Transform', () => {
      const transform = { x: 10, y: 20 }
      const result = extractTransform(transform)
      expect(result).toEqual(transform)
    })

    it('should return undefined for invalid', () => {
      expect(extractTransform({ x: 10 })).toBeUndefined()
    })
  })

  describe('extractHealth', () => {
    it('should extract valid Health', () => {
      const health = { current: 50, max: 100 }
      const result = extractHealth(health)
      expect(result).toEqual(health)
    })

    it('should return undefined for invalid', () => {
      expect(extractHealth({ current: 50 })).toBeUndefined()
    })
  })

  describe('extractVelocity', () => {
    it('should extract valid Velocity', () => {
      const velocity = { vx: 5, vy: 10 }
      const result = extractVelocity(velocity)
      expect(result).toEqual(velocity)
    })
  })

  describe('extractDamage', () => {
    it('should extract valid Damage', () => {
      const damage = { baseValue: 10, variance: 2 }
      const result = extractDamage(damage)
      expect(result).toEqual(damage)
    })
  })

  describe('extractStats', () => {
    it('should extract valid Stats', () => {
      const stats = { level: 1, experience: 0, experienceToNextLevel: 100 }
      const result = extractStats(stats)
      expect(result).toEqual(stats)
    })
  })

  describe('extractInventory', () => {
    it('should extract valid Inventory', () => {
      const inventory = { maxSlots: 20, items: [] }
      const result = extractInventory(inventory)
      expect(result).toEqual(inventory)
    })
  })

  describe('extractEquipment', () => {
    it('should extract valid Equipment', () => {
      const equipment = { slots: { mainHand: 'sword' } }
      const result = extractEquipment(equipment)
      expect(result).toEqual(equipment)
    })
  })

  describe('extractRenderable', () => {
    it('should extract valid Renderable', () => {
      const renderable = { color: '#ff0000', size: 10 }
      const result = (isRenderable(renderable) ? renderable : undefined)
      expect(result).toEqual(renderable)
    })
  })

  describe('extractCollider', () => {
    it('should extract valid Collider', () => {
      const collider = { radius: 10, layer: 1, isTrigger: false, solid: true }
      const result = (isCollider(collider) ? collider : undefined)
      expect(result).toEqual(collider)
    })
  })

  describe('extractAI', () => {
    it('should extract valid AI', () => {
      const ai = { type: 'aggressive' as const, detectionRange: 200, attackRange: 30, speed: 100 }
      const result = (isAI(ai) ? ai : undefined)
      expect(result).toEqual(ai)
    })
  })

  describe('extractParticleEmitter', () => {
    it('should extract valid ParticleEmitter', () => {
      const emitter = { emissionRate: 10, lifetime: 1000, particleCount: 100 }
      const result = (isParticleEmitter(emitter) ? emitter : undefined)
      expect(result).toEqual(emitter)
    })
  })
})

describe('Component Factory Functions', () => {
  describe('createTransform', () => {
    it('should create Transform with defaults', () => {
      const transform = createTransform(10, 20)
      expect(transform).toEqual({ x: 10, y: 20, rotation: 0 })
    })

    it('should create Transform with rotation', () => {
      const transform = createTransform(10, 20, 45)
      expect(transform).toEqual({ x: 10, y: 20, rotation: 45 })
    })
  })

  describe('createVelocity', () => {
    it('should create Velocity with defaults', () => {
      const velocity = createVelocity()
      expect(velocity).toEqual({ vx: 0, vy: 0 })
    })

    it('should create Velocity with values', () => {
      const velocity = createVelocity(5, 10)
      expect(velocity).toEqual({ vx: 5, vy: 10 })
    })
  })

  describe('createHealthComponent', () => {
    it('should create Health component', () => {
      const health = createHealthComponent(100)
      expect(health).toEqual({ current: 100, max: 100 })
    })

    it('should set current equal to max', () => {
      const health = createHealthComponent(75)
      expect(health.current).toBe(health.max)
    })
  })

  describe('createDamage', () => {
    it('should create Damage with defaults', () => {
      const damage = createDamage(10)
      expect(damage).toEqual({ baseValue: 10, variance: 0 })
    })

    it('should create Damage with variance', () => {
      const damage = createDamage(10, 2)
      expect(damage).toEqual({ baseValue: 10, variance: 2 })
    })
  })

  describe('createStats', () => {
    it('should create Stats with defaults', () => {
      const stats = createStats()
      expect(stats).toEqual({ level: 1, experience: 0, experienceToNextLevel: 100 })
    })

    it('should create Stats with level', () => {
      const stats = createStats(5)
      expect(stats.level).toBe(5)
    })
  })

  describe('createInventory', () => {
    it('should create Inventory with defaults', () => {
      const inventory = createInventory()
      expect(inventory).toEqual({ maxSlots: 20, items: [] })
    })

    it('should create Inventory with custom slots', () => {
      const inventory = createInventory(30)
      expect(inventory.maxSlots).toBe(30)
    })
  })

  describe('createEquipment', () => {
    it('should create Equipment', () => {
      const equipment = createEquipment()
      expect(equipment.slots.mainHand).toBeUndefined()
      expect(equipment.slots.offHand).toBeUndefined()
    })
  })

  describe('createAI', () => {
    it('should create AI with defaults', () => {
      const ai = createAI()
      expect(ai.type).toBe('aggressive')
      expect(ai.detectionRange).toBe(200)
      expect(ai.attackRange).toBe(30)
      expect(ai.speed).toBe(100)
    })

    it('should create AI with custom values', () => {
      const ai = createAI('defensive', 300, 50, 80)
      expect(ai.type).toBe('defensive')
      expect(ai.detectionRange).toBe(300)
    })
  })

  describe('createEnemy', () => {
    it('should create Enemy with defaults', () => {
      const enemy = createEnemy('goblin')
      expect(enemy.type).toBe('goblin')
      expect(enemy.difficulty).toBe('easy')
    })

    it('should create Enemy with all values', () => {
      const enemy = createEnemy('boss', 'hard', 500, 600)
      expect(enemy.difficulty).toBe('hard')
      expect(enemy.spawnX).toBe(500)
    })
  })

  describe('createParticleEmitter', () => {
    it('should create ParticleEmitter with defaults', () => {
      const emitter = createParticleEmitter()
      expect(emitter.emissionRate).toBe(10)
      expect(emitter.lifetime).toBe(1000)
      expect(emitter.particleCount).toBe(100)
    })

    it('should create ParticleEmitter with custom values', () => {
      const emitter = createParticleEmitter(20, 2000, 200)
      expect(emitter.emissionRate).toBe(20)
    })
  })
})

describe('Integration Tests', () => {
  it('should type-guard and extract in sequence', () => {
    const transform = createTransform(10, 20)

    if (isTransform(transform)) {
      const extracted = extractTransform(transform)
      expect(extracted).toBeDefined()
      expect(extracted?.x).toBe(10)
    }
  })

  it('should handle multiple components with guards', () => {
    const components = [
      createTransform(10, 20),
      createVelocity(5, 10),
      createHealthComponent(100),
    ]

    const transforms = components.filter(isTransform)
    const velocities = components.filter(isVelocity)
    const healths = components.filter(isHealth)

    expect(transforms.length).toBe(1)
    expect(velocities.length).toBe(1)
    expect(healths.length).toBe(1)
  })

  it('should create, guard, and extract workflow', () => {
    const enemy = createEnemy('goblin', 'easy', 100, 100)

    const extracted = extractEnemy(enemy)
    expect(extracted?.type).toBe('goblin')
    expect(extracted?.difficulty).toBe('easy')
  })
})

