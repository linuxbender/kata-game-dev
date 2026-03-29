/**
 * Sprite Renderer
 *
 * Procedural pixel-art-style sprites for all entity types.
 * All sprites are drawn centered at (0, 0) — callers must translate first.
 * Uses time (total elapsed seconds) for smooth looping animations.
 */

export type SpriteType =
  | 'player'
  | 'goblin'
  | 'orc'
  | 'merchant'
  | 'potion_health'
  | 'circle'

/**
 * Draw an entity sprite centered at (x, y).
 * Falls back to a plain circle for unknown types.
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  type: string,
  x: number,
  y: number,
  r: number,
  time: number,
  fallbackColor = '#888'
): void {
  ctx.save()
  ctx.translate(x, y)

  switch (type) {
    case 'player':        drawPlayer(ctx, r, time);   break
    case 'goblin':        drawGoblin(ctx, r, time);   break
    case 'orc':           drawOrc(ctx, r, time);      break
    case 'merchant':      drawMerchant(ctx, r, time); break
    case 'potion_health': drawPotion(ctx, r, time);   break
    default:
      ctx.fillStyle = fallbackColor
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fill()
  }

  ctx.restore()
}

// ─── Health bar above entity (shown when HP is not full) ────────────────────
export function drawEntityHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  current: number,
  max: number
): void {
  if (current >= max || max <= 0) return
  const pct = Math.max(0, current / max)
  const bw = r * 3.0
  const bh = 4
  const bx = x - bw / 2
  const by = y - r * 2.3

  ctx.fillStyle = 'rgba(0,0,0,0.75)'
  ctx.fillRect(bx, by, bw, bh)

  const col = pct > 0.55 ? '#44ee55' : pct > 0.28 ? '#ffaa22' : '#ff3322'
  ctx.fillStyle = col
  ctx.fillRect(bx, by, bw * pct, bh)

  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 0.5
  ctx.strokeRect(bx, by, bw, bh)
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function shadow(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.38)'
  ctx.beginPath()
  ctx.ellipse(0, r * 0.88, r * 0.78, r * 0.27, 0, 0, Math.PI * 2)
  ctx.fill()
}

function rrect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, rad: number
): void {
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.lineTo(x + w - rad, y)
  ctx.arcTo(x + w, y, x + w, y + rad, rad)
  ctx.lineTo(x + w, y + h - rad)
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad)
  ctx.lineTo(x + rad, y + h)
  ctx.arcTo(x, y + h, x, y + h - rad, rad)
  ctx.lineTo(x, y + rad)
  ctx.arcTo(x, y, x + rad, y, rad)
  ctx.closePath()
}

// ─── Player ──────────────────────────────────────────────────────────────────
function drawPlayer(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  shadow(ctx, r)

  // Cape behind body
  ctx.fillStyle = '#1a2a5a'
  ctx.beginPath()
  ctx.moveTo(-r * 0.3, -r * 0.42)
  ctx.lineTo(-r * 0.58, r * 0.82)
  ctx.lineTo(r * 0.58, r * 0.82)
  ctx.lineTo(r * 0.3, -r * 0.42)
  ctx.closePath()
  ctx.fill()

  // Body armor — blue-steel gradient
  const bg = ctx.createLinearGradient(-r * 0.38, -r * 0.5, r * 0.38, r * 0.5)
  bg.addColorStop(0, '#4899ee')
  bg.addColorStop(0.6, '#1d5599')
  bg.addColorStop(1, '#0d2b55')
  ctx.fillStyle = bg
  rrect(ctx, -r * 0.38, -r * 0.5, r * 0.76, r * 0.98, r * 0.1)
  ctx.fill()

  // Armor highlight (specular)
  ctx.fillStyle = 'rgba(160,210,255,0.22)'
  rrect(ctx, -r * 0.26, -r * 0.44, r * 0.26, r * 0.28, r * 0.07)
  ctx.fill()

  // Boots
  ctx.fillStyle = '#0d2b55'
  ctx.beginPath()
  ctx.ellipse(-r * 0.16, r * 0.66, r * 0.17, r * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(r * 0.16, r * 0.66, r * 0.17, r * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()

  // Head (skin)
  ctx.fillStyle = '#d4956a'
  ctx.beginPath()
  ctx.arc(0, -r * 0.78, r * 0.34, 0, Math.PI * 2)
  ctx.fill()

  // Helmet
  ctx.fillStyle = '#3388ee'
  ctx.beginPath()
  ctx.arc(0, -r * 0.8, r * 0.36, Math.PI * 1.12, Math.PI * 1.88)
  ctx.fill()
  ctx.fillStyle = '#0d2255'
  ctx.beginPath()
  ctx.ellipse(0, -r * 0.68, r * 0.22, r * 0.09, 0, 0, Math.PI)
  ctx.fill()

  // Sword
  ctx.save()
  ctx.translate(r * 0.47, -r * 0.38)
  ctx.rotate(-Math.PI * 0.33)
  // Blade
  const bladeGrad = ctx.createLinearGradient(-r * 0.07, -r * 0.88, r * 0.07, 0)
  bladeGrad.addColorStop(0, '#ddeeff')
  bladeGrad.addColorStop(0.5, '#aaccff')
  bladeGrad.addColorStop(1, '#8899cc')
  ctx.fillStyle = bladeGrad
  ctx.beginPath()
  ctx.moveTo(-r * 0.07, -r * 0.88)
  ctx.lineTo(r * 0.07, -r * 0.88)
  ctx.lineTo(r * 0.04, 0)
  ctx.lineTo(-r * 0.04, 0)
  ctx.closePath()
  ctx.fill()
  // Edge glint
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.beginPath()
  ctx.moveTo(-r * 0.015, -r * 0.88)
  ctx.lineTo(r * 0.015, -r * 0.88)
  ctx.lineTo(r * 0.008, -r * 0.2)
  ctx.lineTo(-r * 0.008, -r * 0.2)
  ctx.closePath()
  ctx.fill()
  // Guard
  ctx.fillStyle = '#cc9933'
  ctx.beginPath()
  ctx.ellipse(0, 0, r * 0.25, r * 0.07, 0, 0, Math.PI * 2)
  ctx.fill()
  // Handle
  ctx.fillStyle = '#663322'
  ctx.beginPath()
  ctx.ellipse(0, r * 0.22, r * 0.07, r * 0.18, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Hero glow ring (subtle pulse)
  const glow = Math.sin(time * 2.2) * 0.1 + 0.2
  ctx.strokeStyle = `rgba(100,170,255,${glow})`
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2)
  ctx.stroke()
}

// ─── Goblin ───────────────────────────────────────────────────────────────────
function drawGoblin(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  shadow(ctx, r)

  // Body (round green blob)
  const bg = ctx.createRadialGradient(-r * 0.1, -r * 0.05, 0, 0, r * 0.05, r * 0.88)
  bg.addColorStop(0, '#55cc22')
  bg.addColorStop(1, '#1a6600')
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.ellipse(0, r * 0.1, r * 0.78, r * 0.72, 0, 0, Math.PI * 2)
  ctx.fill()

  // Pointy ears
  ctx.fillStyle = '#44aa11'
  ctx.beginPath()
  ctx.moveTo(-r * 0.6, -r * 0.52)
  ctx.lineTo(-r * 1.05, -r * 1.2)
  ctx.lineTo(-r * 0.28, -r * 0.75)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(r * 0.6, -r * 0.52)
  ctx.lineTo(r * 1.05, -r * 1.2)
  ctx.lineTo(r * 0.28, -r * 0.75)
  ctx.closePath()
  ctx.fill()

  // Head
  ctx.fillStyle = '#66dd33'
  ctx.beginPath()
  ctx.ellipse(0, -r * 0.56, r * 0.5, r * 0.44, 0, 0, Math.PI * 2)
  ctx.fill()

  // Eyes — occasional blink
  const blink = (Math.floor(time * 2) % 6 === 0) ? 0.25 : 1.0
  ctx.fillStyle = '#ffee00'
  ctx.beginPath()
  ctx.ellipse(-r * 0.17, -r * 0.63, r * 0.14, r * 0.13 * blink, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(r * 0.17, -r * 0.63, r * 0.14, r * 0.13 * blink, 0, 0, Math.PI * 2)
  ctx.fill()
  if (blink > 0.5) {
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.ellipse(-r * 0.17, -r * 0.61, r * 0.065, r * 0.085, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(r * 0.17, -r * 0.61, r * 0.065, r * 0.085, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Wicked grin
  ctx.strokeStyle = '#003300'
  ctx.lineWidth = r * 0.1
  ctx.beginPath()
  ctx.arc(0, -r * 0.39, r * 0.22, 0.15, Math.PI - 0.15)
  ctx.stroke()

  // Teeth
  ctx.fillStyle = '#ffffaa'
  ctx.beginPath()
  ctx.moveTo(-r * 0.14, -r * 0.36)
  ctx.lineTo(-r * 0.08, -r * 0.47)
  ctx.lineTo(-r * 0.02, -r * 0.36)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(r * 0.02, -r * 0.36)
  ctx.lineTo(r * 0.08, -r * 0.47)
  ctx.lineTo(r * 0.14, -r * 0.36)
  ctx.closePath()
  ctx.fill()

  // Dagger
  ctx.save()
  ctx.translate(r * 0.78, r * 0.18)
  ctx.rotate(-Math.PI * 0.18)
  ctx.fillStyle = '#888'
  ctx.beginPath()
  ctx.moveTo(0, -r * 0.55)
  ctx.lineTo(r * 0.08, -r * 0.12)
  ctx.lineTo(-r * 0.08, -r * 0.12)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#553311'
  ctx.beginPath()
  ctx.ellipse(0, r * 0.06, r * 0.09, r * 0.2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ─── Orc ─────────────────────────────────────────────────────────────────────
function drawOrc(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  shadow(ctx, r)

  // Massive body
  const bg = ctx.createLinearGradient(-r, -r * 0.3, r, r * 0.3)
  bg.addColorStop(0, '#5a7a38')
  bg.addColorStop(0.5, '#3d5522')
  bg.addColorStop(1, '#1e2a0e')
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.ellipse(0, r * 0.15, r * 0.88, r * 0.82, 0, 0, Math.PI * 2)
  ctx.fill()

  // Shoulder armour plates
  ctx.fillStyle = '#665533'
  ctx.beginPath()
  ctx.ellipse(-r * 0.84, -r * 0.12, r * 0.33, r * 0.22, Math.PI * 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(r * 0.84, -r * 0.12, r * 0.33, r * 0.22, -Math.PI * 0.1, 0, Math.PI * 2)
  ctx.fill()

  // Chest plate
  ctx.fillStyle = '#554422'
  ctx.beginPath()
  ctx.ellipse(0, r * 0.08, r * 0.47, r * 0.52, 0, 0, Math.PI * 2)
  ctx.fill()
  // Rivets
  ctx.fillStyle = '#998855'
  for (const [rx, ry] of [[-r*0.2, -r*0.1], [r*0.2, -r*0.1], [0, r*0.22], [-r*0.2, r*0.36], [r*0.2, r*0.36]] as [number,number][]) {
    ctx.beginPath()
    ctx.arc(rx, ry, r * 0.044, 0, Math.PI * 2)
    ctx.fill()
  }

  // Head
  ctx.fillStyle = '#4d6a2a'
  ctx.beginPath()
  ctx.ellipse(0, -r * 0.75, r * 0.58, r * 0.52, 0, 0, Math.PI * 2)
  ctx.fill()

  // Horns
  ctx.strokeStyle = '#2e1a0a'
  ctx.lineWidth = r * 0.22
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-r * 0.38, -r * 1.0)
  ctx.quadraticCurveTo(-r * 0.9, -r * 1.88, -r * 0.56, -r * 2.05)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(r * 0.38, -r * 1.0)
  ctx.quadraticCurveTo(r * 0.9, -r * 1.88, r * 0.56, -r * 2.05)
  ctx.stroke()
  ctx.lineCap = 'butt'

  // Glowing red eyes
  const ep = Math.sin(time * 2.8) * 0.25 + 0.75
  ctx.fillStyle = `rgba(255,30,0,${ep})`
  ctx.beginPath()
  ctx.ellipse(-r * 0.2, -r * 0.8, r * 0.14, r * 0.1, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(r * 0.2, -r * 0.8, r * 0.14, r * 0.1, 0, 0, Math.PI * 2)
  ctx.fill()
  // Eye aura
  ctx.fillStyle = `rgba(255,80,0,${ep * 0.25})`
  ctx.beginPath()
  ctx.arc(-r * 0.2, -r * 0.8, r * 0.28, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(r * 0.2, -r * 0.8, r * 0.28, 0, Math.PI * 2)
  ctx.fill()

  // Tusks
  ctx.fillStyle = '#eeeebb'
  ctx.beginPath()
  ctx.moveTo(-r * 0.15, -r * 0.56)
  ctx.lineTo(-r * 0.24, -r * 0.36)
  ctx.lineTo(-r * 0.06, -r * 0.55)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(r * 0.15, -r * 0.56)
  ctx.lineTo(r * 0.24, -r * 0.36)
  ctx.lineTo(r * 0.06, -r * 0.55)
  ctx.closePath()
  ctx.fill()

  // Battle axe
  ctx.save()
  ctx.translate(r * 0.98, r * 0.08)
  ctx.rotate(Math.PI * 0.1)
  ctx.strokeStyle = '#5a3010'
  ctx.lineWidth = r * 0.2
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, r * 0.55)
  ctx.lineTo(0, -r * 0.55)
  ctx.stroke()
  ctx.lineCap = 'butt'
  ctx.fillStyle = '#888'
  ctx.strokeStyle = '#aaa'
  ctx.lineWidth = r * 0.055
  ctx.beginPath()
  ctx.moveTo(-r * 0.08, -r * 0.55)
  ctx.lineTo(-r * 0.08, -r * 0.12)
  ctx.bezierCurveTo(-r * 0.08, -r * 0.12, r * 0.68, -r * 0.08, r * 0.68, -r * 0.55)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

// ─── Merchant ─────────────────────────────────────────────────────────────────
function drawMerchant(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  shadow(ctx, r)

  // Golden robe
  const rg = ctx.createLinearGradient(-r * 0.6, -r * 0.3, r * 0.6, r * 0.72)
  rg.addColorStop(0, '#c49028')
  rg.addColorStop(0.5, '#8a6018')
  rg.addColorStop(1, '#5a3a08')
  ctx.fillStyle = rg
  ctx.beginPath()
  ctx.moveTo(-r * 0.58, r * 0.72)
  ctx.lineTo(-r * 0.42, -r * 0.3)
  ctx.lineTo(r * 0.42, -r * 0.3)
  ctx.lineTo(r * 0.58, r * 0.72)
  ctx.closePath()
  ctx.fill()

  // Robe trim
  ctx.strokeStyle = '#ffcc44'
  ctx.lineWidth = r * 0.06
  ctx.beginPath()
  ctx.moveTo(-r * 0.58, r * 0.72)
  ctx.lineTo(-r * 0.42, -r * 0.3)
  ctx.moveTo(r * 0.42, -r * 0.3)
  ctx.lineTo(r * 0.58, r * 0.72)
  ctx.stroke()

  // Belt buckle
  ctx.fillStyle = '#ffcc44'
  ctx.beginPath()
  ctx.arc(0, r * 0.12, r * 0.12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#aa8800'
  ctx.beginPath()
  ctx.arc(0, r * 0.12, r * 0.07, 0, Math.PI * 2)
  ctx.fill()

  // Head (skin)
  ctx.fillStyle = '#d4a070'
  ctx.beginPath()
  ctx.arc(0, -r * 0.65, r * 0.37, 0, Math.PI * 2)
  ctx.fill()

  // Hood
  ctx.fillStyle = '#6a4010'
  ctx.beginPath()
  ctx.arc(0, -r * 0.68, r * 0.41, Math.PI * 1.05, Math.PI * 1.95)
  ctx.fill()

  // Beard
  ctx.fillStyle = '#ccaa55'
  ctx.beginPath()
  ctx.ellipse(0, -r * 0.4, r * 0.25, r * 0.2, 0, 0, Math.PI)
  ctx.fill()

  // Eyes
  ctx.fillStyle = '#222'
  ctx.beginPath()
  ctx.arc(-r * 0.13, -r * 0.72, r * 0.055, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(r * 0.13, -r * 0.72, r * 0.055, 0, Math.PI * 2)
  ctx.fill()
  // Sparkles
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(-r * 0.115, -r * 0.735, r * 0.018, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(r * 0.115, -r * 0.735, r * 0.018, 0, Math.PI * 2)
  ctx.fill()

  // Staff
  ctx.strokeStyle = '#7a4818'
  ctx.lineWidth = r * 0.14
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-r * 0.7, r * 0.72)
  ctx.lineTo(-r * 0.72, -r * 1.05)
  ctx.stroke()
  ctx.lineCap = 'butt'
  // Staff orb
  ctx.fillStyle = '#8888ff'
  ctx.beginPath()
  ctx.arc(-r * 0.72, -r * 1.15, r * 0.18, 0, Math.PI * 2)
  ctx.fill()
  const orbGlow = Math.sin(time * 3.0) * 0.18 + 0.38
  ctx.fillStyle = `rgba(150,150,255,${orbGlow})`
  ctx.beginPath()
  ctx.arc(-r * 0.72, -r * 1.15, r * 0.32, 0, Math.PI * 2)
  ctx.fill()

  // "!" indicator (bouncing)
  const bounce = Math.sin(time * 3.0) * r * 0.12
  ctx.fillStyle = '#ffee00'
  ctx.strokeStyle = '#aa8800'
  ctx.lineWidth = r * 0.05
  ctx.beginPath()
  ctx.arc(r * 0.56, -r * 1.42 + bounce, r * 0.27, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#7a4400'
  ctx.font = `bold ${Math.round(r * 0.38)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('!', r * 0.56, -r * 1.4 + bounce)
}

// ─── Health Potion ───────────────────────────────────────────────────────────
function drawPotion(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  const s = r * 2.2  // render at 2.2× radius

  // Float bob
  const bob = Math.sin(time * 2.5) * s * 0.08
  ctx.translate(0, bob)

  // Outer glow (pulsing)
  const glow = Math.sin(time * 3.5) * 0.18 + 0.48
  const glowGrad = ctx.createRadialGradient(0, 0, s * 0.4, 0, 0, s * 1.5)
  glowGrad.addColorStop(0, `rgba(255,0,80,${glow})`)
  glowGrad.addColorStop(1, 'rgba(255,0,80,0)')
  ctx.fillStyle = glowGrad
  ctx.beginPath()
  ctx.arc(0, 0, s * 1.5, 0, Math.PI * 2)
  ctx.fill()

  shadow(ctx, s * 0.75)

  // Bottle body
  ctx.fillStyle = '#cc0044'
  ctx.beginPath()
  ctx.ellipse(0, s * 0.15, s * 0.64, s * 0.62, 0, 0, Math.PI * 2)
  ctx.fill()

  // Neck
  ctx.fillStyle = '#aa0038'
  ctx.beginPath()
  ctx.moveTo(-s * 0.2, -s * 0.18)
  ctx.lineTo(-s * 0.14, -s * 0.66)
  ctx.lineTo(s * 0.14, -s * 0.66)
  ctx.lineTo(s * 0.2, -s * 0.18)
  ctx.closePath()
  ctx.fill()

  // Cork
  ctx.fillStyle = '#9a6825'
  ctx.beginPath()
  ctx.ellipse(0, -s * 0.7, s * 0.17, s * 0.12, 0, 0, Math.PI * 2)
  ctx.fill()

  // Liquid (bright, animated)
  const lv = Math.sin(time * 1.8) * 0.04 + 0.72
  const liqGrad = ctx.createRadialGradient(-s * 0.18, s * 0.05, 0, 0, s * 0.15, s * 0.54)
  liqGrad.addColorStop(0, `rgba(255,100,140,${lv})`)
  liqGrad.addColorStop(1, `rgba(220,0,60,${lv * 0.8})`)
  ctx.fillStyle = liqGrad
  ctx.beginPath()
  ctx.ellipse(0, s * 0.18, s * 0.52, s * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Bottle shine
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.beginPath()
  ctx.ellipse(-s * 0.2, -s * 0.06, s * 0.14, s * 0.28, -Math.PI * 0.25, 0, Math.PI * 2)
  ctx.fill()

  // Cross symbol
  ctx.strokeStyle = 'rgba(255,255,255,0.82)'
  ctx.lineWidth = s * 0.1
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(s * 0.2, s * 0.08)
  ctx.lineTo(s * 0.2, s * 0.44)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(s * 0.04, s * 0.26)
  ctx.lineTo(s * 0.36, s * 0.26)
  ctx.stroke()
  ctx.lineCap = 'butt'
}
