import type { TypedWorld } from '@engine/componentTypes'

/**
 * Particle system (prepared, not yet integrated)
 * Renders visual effects like explosions, trails, smoke.
 */

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number // remaining lifetime
  maxLife: number // initial lifetime
  size: number
  color: string
}

export const createParticleSystem = () => {
  const particles: Particle[] = []
  const maxParticles = 1000 // performance limit

  const update = (world: TypedWorld, dt: number) => {
    // Update existing particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]

      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 200 * dt // apply gravity
      p.life -= dt

      if (p.life <= 0) {
        particles.splice(i, 1)
      }
    }

    // TODO: Emit new particles from ParticleEmitter components when integrated
    // const emitters = world.query(COMPONENTS.TRANSFORM, COMPONENTS.PARTICLE_EMITTER)
  }

  const render = (
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewWidth: number,
    viewHeight: number
  ) => {
    ctx.save()

    for (const p of particles) {
      const screenX = p.x - camX
      const screenY = p.y - camY

      // Cull particles outside view
      if (screenX < -50 || screenX > viewWidth + 50 ||
          screenY < -50 || screenY > viewHeight + 50) {
        continue
      }

      const alpha = p.life / p.maxLife
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color

      const halfSize = p.size / 2
      ctx.fillRect(
        Math.round(screenX - halfSize),
        Math.round(screenY - halfSize),
        p.size,
        p.size
      )
    }

    ctx.globalAlpha = 1
    ctx.restore()
  }

  // Spawn particle manually (for testing or direct spawning)
  const spawnParticle = (
    x: number,
    y: number,
    vx: number,
    vy: number,
    lifetime: number,
    size: number,
    color: string
  ) => {
    if (particles.length >= maxParticles) return

    particles.push({
      x,
      y,
      vx,
      vy,
      life: lifetime,
      maxLife: lifetime,
      size,
      color
    })
  }

  // Spawn burst of particles (utility for effects)
  const spawnBurst = (
    x: number,
    y: number,
    count: number,
    speed: number,
    lifetime: number,
    size: number,
    color: string
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const vx = Math.cos(angle) * speed
      const vy = Math.sin(angle) * speed
      spawnParticle(x, y, vx, vy, lifetime, size, color)
    }
  }

  return {
    update,
    render,
    spawnParticle,
    spawnBurst,
    getParticleCount: () => particles.length,
    clear: () => particles.length = 0
  }
}

