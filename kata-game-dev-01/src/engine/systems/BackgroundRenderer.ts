/**
 * Background Renderer
 *
 * Draws procedural level backgrounds based on the current theme.
 * Uses seeded pseudo-random to produce stable decorations
 * (same position = same decoration, no flickering between frames).
 *
 * All positions are in world-space; the renderer converts them to
 * screen-space using the camera's (camX, camY) offset.
 */

/** Seeded pseudo-random in [0, 1) derived from tile coordinates */
function rand(x: number, y: number, seed = 0): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.3) * 43758.5453
  return n - Math.floor(n)
}

/**
 * Draw the full level background for the current frame.
 *
 * @param ctx      Canvas 2D context
 * @param theme    Level theme key: 'forest' | 'cave' | 'fortress'
 * @param camX     Camera center world-X
 * @param camY     Camera center world-Y
 * @param viewW    Viewport width  (logical pixels)
 * @param viewH    Viewport height (logical pixels)
 * @param time     Total elapsed seconds (for animations)
 */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  theme: string,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
  time: number
): void {
  switch (theme) {
    case 'cave':     drawCave(ctx, camX, camY, viewW, viewH, time); break
    case 'fortress': drawFortress(ctx, camX, camY, viewW, viewH, time); break
    default:         drawForest(ctx, camX, camY, viewW, viewH, time)
  }

  // Atmospheric vignette (dark edges on every theme)
  drawVignette(ctx, viewW, viewH)
}

// ─── Vignette ────────────────────────────────────────────────────────────────
function drawVignette(ctx: CanvasRenderingContext2D, vw: number, vh: number): void {
  const grad = ctx.createRadialGradient(vw / 2, vh / 2, vw * 0.28, vw / 2, vh / 2, vw * 0.75)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(1, 'rgba(0,0,0,0.48)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, vw, vh)
}

// ─── Forest ───────────────────────────────────────────────────────────────────
function drawForest(
  ctx: CanvasRenderingContext2D,
  camX: number, camY: number,
  vw: number, vh: number,
  _time: number
): void {
  const ox = camX - vw / 2
  const oy = camY - vh / 2

  // Ground tiles — slightly varied greens
  const TILE = 64
  const tx0 = Math.floor(ox / TILE) - 1
  const ty0 = Math.floor(oy / TILE) - 1
  const tx1 = Math.ceil((ox + vw) / TILE) + 1
  const ty1 = Math.ceil((oy + vh) / TILE) + 1

  for (let tx = tx0; tx <= tx1; tx++) {
    for (let ty = ty0; ty <= ty1; ty++) {
      const r = rand(tx, ty)
      const gv = Math.round(44 + r * 18)
      const bv = Math.round(24 + r * 10)
      ctx.fillStyle = `rgb(26,${gv},${bv})`
      const sx = tx * TILE - ox
      const sy = ty * TILE - oy
      ctx.fillRect(sx, sy, TILE + 0.5, TILE + 0.5)

      // Sparse grass tufts
      if (rand(tx, ty, 1) > 0.68) {
        const gx = sx + rand(tx, ty, 2) * TILE * 0.78 + TILE * 0.1
        const gy = sy + rand(tx, ty, 3) * TILE * 0.78 + TILE * 0.1
        drawGrassTuft(ctx, gx, gy, 4.5 + rand(tx, ty, 4) * 4.5)
      }
    }
  }

  // Trees (on a coarser grid, seeded offsets)
  const TG = 140
  const ttx0 = Math.floor((ox - 90) / TG) - 1
  const tty0 = Math.floor((oy - 90) / TG) - 1
  const ttx1 = Math.ceil((ox + vw + 90) / TG) + 1
  const tty1 = Math.ceil((oy + vh + 90) / TG) + 1

  for (let tx = ttx0; tx <= ttx1; tx++) {
    for (let ty = tty0; ty <= tty1; ty++) {
      if (rand(tx, ty, 10) > 0.55) continue    // ~45 % chance
      const wx = tx * TG + (rand(tx, ty, 11) - 0.5) * TG * 0.55
      const wy = ty * TG + (rand(tx, ty, 12) - 0.5) * TG * 0.55
      const sx = wx - ox
      const sy = wy - oy
      if (sx < -90 || sx > vw + 90 || sy < -90 || sy > vh + 90) continue
      drawTree(ctx, sx, sy, 18 + rand(tx, ty, 13) * 16)
    }
  }
}

function drawGrassTuft(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.strokeStyle = 'rgba(80,160,60,0.68)'
  ctx.lineWidth = 1.2
  ctx.lineCap = 'round'
  for (let i = 0; i < 3; i++) {
    const angle = -Math.PI / 2 + (i - 1) * 0.42
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size)
    ctx.stroke()
  }
  ctx.lineCap = 'butt'
}

function drawTree(ctx: CanvasRenderingContext2D, sx: number, sy: number, size: number): void {
  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath()
  ctx.ellipse(sx, sy + size * 0.28, size * 0.88, size * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Trunk
  ctx.fillStyle = '#5a3a1a'
  ctx.beginPath()
  ctx.ellipse(sx, sy + size * 0.38, size * 0.17, size * 0.35, 0, 0, Math.PI * 2)
  ctx.fill()

  // Canopy layers
  const layers: [string, number, number, number, number][] = [
    ['#1a5a18', -size * 0.22, -size * 0.12, size * 0.55, size * 0.52],
    ['#226a22', size * 0.22, -size * 0.08, size * 0.52, size * 0.48],
    ['#2a7a30', 0, -size * 0.3, size * 0.5, size * 0.46],
    ['#2a8a38', 0, -size * 0.48, size * 0.4, size * 0.38],
  ]
  for (const [col, ox2, oy2, rx, ry] of layers) {
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.ellipse(sx + ox2, sy + oy2, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Highlight dot
  ctx.fillStyle = 'rgba(80,200,80,0.32)'
  ctx.beginPath()
  ctx.arc(sx - size * 0.17, sy - size * 0.46, size * 0.14, 0, Math.PI * 2)
  ctx.fill()
}

// ─── Cave ─────────────────────────────────────────────────────────────────────
function drawCave(
  ctx: CanvasRenderingContext2D,
  camX: number, camY: number,
  vw: number, vh: number,
  time: number
): void {
  const ox = camX - vw / 2
  const oy = camY - vh / 2

  // Stone floor tiles
  const TILE = 48
  const tx0 = Math.floor(ox / TILE) - 1
  const ty0 = Math.floor(oy / TILE) - 1
  const tx1 = Math.ceil((ox + vw) / TILE) + 1
  const ty1 = Math.ceil((oy + vh) / TILE) + 1

  for (let tx = tx0; tx <= tx1; tx++) {
    for (let ty = ty0; ty <= ty1; ty++) {
      const r = rand(tx, ty, 5)
      const v = Math.round(24 + r * 16)
      const b = Math.round(30 + r * 18)
      ctx.fillStyle = `rgb(${v},${v},${b})`
      const sx = tx * TILE - ox
      const sy = ty * TILE - oy
      ctx.fillRect(sx, sy, TILE + 0.5, TILE + 0.5)

      // Crack marks on some tiles
      if (r > 0.74) {
        ctx.strokeStyle = 'rgba(0,0,0,0.28)'
        ctx.lineWidth = 0.8
        ctx.beginPath()
        const cx2 = sx + rand(tx, ty, 6) * TILE
        const cy2 = sy + rand(tx, ty, 7) * TILE
        ctx.moveTo(cx2, cy2)
        ctx.lineTo(cx2 + (rand(tx, ty, 8) - 0.5) * 22, cy2 + (rand(tx, ty, 9) - 0.5) * 22)
        ctx.stroke()
      }
    }
  }

  // Rock formations
  const RG = 100
  const rtx0 = Math.floor((ox - 60) / RG) - 1
  const rty0 = Math.floor((oy - 60) / RG) - 1
  const rtx1 = Math.ceil((ox + vw + 60) / RG) + 1
  const rty1 = Math.ceil((oy + vh + 60) / RG) + 1

  for (let tx = rtx0; tx <= rtx1; tx++) {
    for (let ty = rty0; ty <= rty1; ty++) {
      if (rand(tx, ty, 20) < 0.58) continue
      const wx = tx * RG + (rand(tx, ty, 21) - 0.5) * RG * 0.6
      const wy = ty * RG + (rand(tx, ty, 22) - 0.5) * RG * 0.6
      const sx = wx - ox
      const sy = wy - oy
      if (sx < -60 || sx > vw + 60 || sy < -60 || sy > vh + 60) continue
      drawCaveRock(ctx, sx, sy, 10 + rand(tx, ty, 23) * 14, rand(tx, ty, 24))
    }
  }

  // Crystal formations
  const CG = 180
  const ctx0 = Math.floor((ox - 40) / CG) - 1
  const cty0 = Math.floor((oy - 40) / CG) - 1
  const ctx1 = Math.ceil((ox + vw + 40) / CG) + 1
  const cty1 = Math.ceil((oy + vh + 40) / CG) + 1

  for (let tx = ctx0; tx <= ctx1; tx++) {
    for (let ty = cty0; ty <= cty1; ty++) {
      if (rand(tx, ty, 30) < 0.55) continue
      const wx = tx * CG + (rand(tx, ty, 31) - 0.5) * CG * 0.5
      const wy = ty * CG + (rand(tx, ty, 32) - 0.5) * CG * 0.5
      const sx = wx - ox
      const sy = wy - oy
      if (sx < -40 || sx > vw + 40 || sy < -40 || sy > vh + 40) continue
      const hue = rand(tx, ty, 33) > 0.5 ? 240 : 290
      drawCrystal(ctx, sx, sy, 8 + rand(tx, ty, 34) * 10, hue, time, rand(tx, ty, 35))
    }
  }
}

function drawCaveRock(
  ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number
): void {
  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  ctx.beginPath()
  ctx.ellipse(x, y + size * 0.5, size * 0.82, size * 0.26, 0, 0, Math.PI * 2)
  ctx.fill()

  const pts = 6
  ctx.fillStyle = `rgb(${Math.round(45 + seed * 20)},${Math.round(45 + seed * 20)},${Math.round(55 + seed * 18)})`
  ctx.beginPath()
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2 - Math.PI / 2
    const r = size * (0.7 + rand(i, seed * 100, 40) * 0.3)
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r * 0.65
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = 'rgba(180,180,200,0.18)'
  ctx.beginPath()
  ctx.ellipse(x - size * 0.2, y - size * 0.14, size * 0.3, size * 0.22, -0.5, 0, Math.PI * 2)
  ctx.fill()
}

function drawCrystal(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number, hue: number,
  time: number, seed: number
): void {
  const pulse = Math.sin(time * 1.5 + seed * Math.PI * 2) * 0.3 + 0.7

  const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, size * 1.8)
  glowGrad.addColorStop(0, `hsla(${hue},100%,70%,${pulse * 0.35})`)
  glowGrad.addColorStop(1, `hsla(${hue},100%,60%,0)`)
  ctx.fillStyle = glowGrad
  ctx.beginPath()
  ctx.arc(x, y, size * 1.8, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = `hsla(${hue},80%,55%,0.88)`
  ctx.beginPath()
  ctx.moveTo(x, y - size)
  ctx.lineTo(x + size * 0.35, y - size * 0.1)
  ctx.lineTo(x + size * 0.28, y + size * 0.5)
  ctx.lineTo(x, y + size * 0.3)
  ctx.lineTo(x - size * 0.28, y + size * 0.5)
  ctx.lineTo(x - size * 0.35, y - size * 0.1)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = `hsla(${hue},100%,82%,0.52)`
  ctx.beginPath()
  ctx.moveTo(x, y - size)
  ctx.lineTo(x + size * 0.35, y - size * 0.1)
  ctx.lineTo(x, y - size * 0.05)
  ctx.closePath()
  ctx.fill()
}

// ─── Fortress ─────────────────────────────────────────────────────────────────
function drawFortress(
  ctx: CanvasRenderingContext2D,
  camX: number, camY: number,
  vw: number, vh: number,
  time: number
): void {
  const ox = camX - vw / 2
  const oy = camY - vh / 2

  // Stone brick floor
  const BW = 56
  const BH = 28
  const tx0 = Math.floor(ox / BW) - 1
  const ty0 = Math.floor(oy / BH) - 1
  const tx1 = Math.ceil((ox + vw) / BW) + 1
  const ty1 = Math.ceil((oy + vh) / BH) + 1

  for (let ty = ty0; ty <= ty1; ty++) {
    const rowOffset = (ty % 2) * (BW / 2)
    for (let tx = tx0; tx <= tx1; tx++) {
      const r = rand(tx + (ty % 2) * 1000, ty, 50)
      const v = Math.round(48 + r * 22)
      ctx.fillStyle = `rgb(${v},${Math.round(v * 0.88)},${Math.round(v * 0.78)})`
      const sx = tx * BW + rowOffset - ox
      const sy = ty * BH - oy
      ctx.fillRect(sx + 1, sy + 1, BW - 2, BH - 2)

      // Mortar lines
      ctx.strokeStyle = 'rgba(25,18,10,0.65)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(sx + 0.75, sy + 0.75, BW - 1.5, BH - 1.5)

      // Wear marks
      if (r > 0.76) {
        ctx.strokeStyle = 'rgba(0,0,0,0.18)'
        ctx.lineWidth = 0.7
        ctx.beginPath()
        ctx.moveTo(sx + r * 12, sy + 4)
        ctx.lineTo(sx + r * 28, sy + BH - 4)
        ctx.stroke()
      }
    }
  }

  // Wall torches (seeded)
  const TG = 200
  const ttx0 = Math.floor((ox - 50) / TG) - 1
  const tty0 = Math.floor((oy - 50) / TG) - 1
  const ttx1 = Math.ceil((ox + vw + 50) / TG) + 1
  const tty1 = Math.ceil((oy + vh + 50) / TG) + 1

  for (let tx = ttx0; tx <= ttx1; tx++) {
    for (let ty = tty0; ty <= tty1; ty++) {
      if (rand(tx, ty, 60) < 0.5) continue
      const wx = tx * TG + (rand(tx, ty, 61) - 0.5) * TG * 0.4
      const wy = ty * TG + (rand(tx, ty, 62) - 0.5) * TG * 0.4
      const sx = wx - ox
      const sy = wy - oy
      if (sx < -50 || sx > vw + 50 || sy < -50 || sy > vh + 50) continue
      drawTorch(ctx, sx, sy, time, rand(tx, ty, 63) * Math.PI * 2)
    }
  }
}

function drawTorch(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  time: number, phase: number
): void {
  const flicker = Math.sin(time * 8.5 + phase) * 0.25 + 0.75
  const flickX  = Math.sin(time * 13 + phase) * 2

  // Warm light halo
  const halo = ctx.createRadialGradient(x, y - 8, 0, x, y - 8, 32)
  halo.addColorStop(0, `rgba(255,200,80,${flicker * 0.38})`)
  halo.addColorStop(1, 'rgba(255,120,0,0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(x, y - 8, 32, 0, Math.PI * 2)
  ctx.fill()

  // Torch body
  ctx.fillStyle = '#7a4818'
  ctx.beginPath()
  ctx.ellipse(x, y + 5, 3, 10, 0, 0, Math.PI * 2)
  ctx.fill()

  // Outer flame
  ctx.fillStyle = `rgba(255,80,0,${flicker * 0.9})`
  ctx.beginPath()
  ctx.moveTo(x + flickX, y - 15)
  ctx.bezierCurveTo(x + 7, y - 8, x + 5, y - 2, x, y - 2)
  ctx.bezierCurveTo(x - 5, y - 2, x - 7, y - 8, x + flickX, y - 15)
  ctx.closePath()
  ctx.fill()

  // Inner flame (brighter)
  ctx.fillStyle = `rgba(255,220,60,${flicker})`
  ctx.beginPath()
  ctx.moveTo(x + flickX * 0.5, y - 11)
  ctx.bezierCurveTo(x + 4, y - 6, x + 3, y - 2, x, y - 2)
  ctx.bezierCurveTo(x - 3, y - 2, x - 4, y - 6, x + flickX * 0.5, y - 11)
  ctx.closePath()
  ctx.fill()
}
