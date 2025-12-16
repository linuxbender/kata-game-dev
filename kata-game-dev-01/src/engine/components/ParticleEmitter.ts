// Particle emitter component (prepared, not yet integrated)
export interface ParticleEmitter {
  active: boolean
  rate: number // particles per second
  lifetime: number // particle lifetime in seconds
  speed: number // initial particle speed
  speedVariation: number // random variation (0-1)
  spread: number // emission cone angle in radians
  direction: number // base direction in radians (0 = right, Math.PI/2 = down)
  color: string
  colorVariation?: string // optional second color for variation
  size: number
  sizeVariation: number
  gravity: number // gravity acceleration (pixels/s²)
  fade: boolean // fade out over lifetime
}

