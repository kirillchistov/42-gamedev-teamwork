/**
 * renderer.ts отвечает только за отрисовку и hit-test (попадание в клетку по координатам).
 * Он не хранит состояние партии и не знает ничего о таймерах, очках или правилах обмена.
 * На вход подаётся текущая матрица поля и опции подсветки, на выходе — кадр на canvas.
 * Такой разнос позволяет безопасно улучшать визуал, не ломая core-логику игры.
 */

import type { Board } from './core/grid'
import type { CellRC } from './core/match'

export type RenderOpts = {
  highlight?: CellRC[]
  alpha?: number
  selected?: CellRC | null
  target?: CellRC | null
  targetPulse?: boolean
  showSwapArrow?: boolean
}

/** roundRect есть в современных DOM typings; в старых — только в рантайме */
type Canvas2DWithRoundRect =
  CanvasRenderingContext2D & {
    roundRect?: (
      x: number,
      y: number,
      w: number,
      h: number,
      radii: number
    ) => void
  }

function pathRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const c = ctx as Canvas2DWithRoundRect
  if (typeof c.roundRect === 'function') {
    c.roundRect(x, y, w, h, r)
  } else {
    ctx.rect(x, y, w, h)
  }
}

function dims(board: Board) {
  const rows = board.length
  const cols =
    rows > 0 ? board[0]?.length ?? 0 : 0
  return { rows, cols }
}

function polygonPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotation = 0
) {
  ctx.beginPath()
  for (let i = 0; i < sides; i += 1) {
    const a = rotation + (Math.PI * 2 * i) / sides
    const px = cx + Math.cos(a) * radius
    const py = cy + Math.sin(a) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function colorForKind(kind: number): string {
  // безопасная палитра (можно заменить в config.ts проекта)
  const COLORS = [
    '#ff4d6d',
    '#ffd166',
    '#06d6a0',
    '#4cc9f0',
    '#b517ff',
    '#f72585',
    '#a8dadc',
    '#9b5de5',
  ]
  const idx = Math.abs(kind) % COLORS.length
  return COLORS[idx] ?? '#888'
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  idx: number,
  x: number,
  y: number,
  cell: number,
  color: string
) {
  const cx = x + cell / 2
  const cy = y + cell / 2
  const s = Math.max(8, Math.floor(cell * 0.28))

  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = Math.max(
    8,
    Math.floor(cell * 0.16)
  )
  ctx.strokeStyle = '#f3fbff'
  ctx.lineWidth = Math.max(
    1.5,
    Math.floor(cell * 0.06)
  )
  ctx.fillStyle = color

  switch (idx % 8) {
    case 0: // Бриллиант
      polygonPath(ctx, cx, cy, s, 4, Math.PI / 4)
      ctx.fill()
      ctx.stroke()
      break
    case 1: // звезда
      ctx.beginPath()
      for (let i = 0; i < 10; i += 1) {
        const r = i % 2 === 0 ? s : s * 0.45
        const a = -Math.PI / 2 + (Math.PI * i) / 5
        const px = cx + Math.cos(a) * r
        const py = cy + Math.sin(a) * r
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      break
    case 2: // Овал с точками
      ctx.beginPath()
      ctx.ellipse(
        cx,
        cy,
        s * 1.05,
        s * 0.7,
        0,
        0,
        Math.PI * 2
      )
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = 'rgba(7, 18, 36, 0.8)'
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath()
        ctx.arc(
          cx + i * s * 0.38,
          cy,
          Math.max(1.5, s * 0.12),
          0,
          Math.PI * 2
        )
        ctx.fill()
      }
      break
    case 3: // Прямоугольник с антеннами
      ctx.beginPath()
      pathRoundRect(
        ctx,
        cx - s * 0.9,
        cy - s * 0.65,
        s * 1.8,
        s * 1.3,
        s * 0.15
      )
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx - s * 0.5, cy - s * 0.65)
      ctx.lineTo(cx - s * 0.75, cy - s * 1.05)
      ctx.moveTo(cx + s * 0.5, cy - s * 0.65)
      ctx.lineTo(cx + s * 0.75, cy - s * 1.05)
      ctx.stroke()
      break
    case 4: // спираль
      ctx.beginPath()
      for (
        let t = 0;
        t <= Math.PI * 4;
        t += 0.15
      ) {
        const r = (s * t) / (Math.PI * 4)
        const px = cx + Math.cos(t) * r
        const py = cy + Math.sin(t) * r
        if (t === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      break
    case 5: // знак бесконечности
      ctx.beginPath()
      for (
        let t = 0;
        t <= Math.PI * 2;
        t += 0.03
      ) {
        const denom =
          1 + Math.sin(t) * Math.sin(t)
        const px = cx + (s * Math.cos(t)) / denom
        const py =
          cy +
          (s * Math.sin(t) * Math.cos(t)) / denom
        if (t === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      break
    case 6: // круг с глазами
      ctx.beginPath()
      ctx.arc(cx, cy, s * 0.85, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#f3fbff'
      ctx.beginPath()
      ctx.arc(
        cx - s * 0.28,
        cy - s * 0.1,
        s * 0.16,
        0,
        Math.PI * 2
      )
      ctx.arc(
        cx + s * 0.28,
        cy - s * 0.1,
        s * 0.16,
        0,
        Math.PI * 2
      )
      ctx.fill()
      ctx.fillStyle = '#0c1f3c'
      ctx.beginPath()
      ctx.arc(
        cx - s * 0.28,
        cy - s * 0.08,
        s * 0.08,
        0,
        Math.PI * 2
      )
      ctx.arc(
        cx + s * 0.28,
        cy - s * 0.08,
        s * 0.08,
        0,
        Math.PI * 2
      )
      ctx.fill()
      break
    default: // шестиугольник
      polygonPath(ctx, cx, cy, s, 6, Math.PI / 6)
      ctx.fill()
      ctx.stroke()
  }

  ctx.restore()
}

function getClientXY(
  ev: MouseEvent | PointerEvent | TouchEvent
): {
  x: number
  y: number
} {
  if ('clientX' in ev && 'clientY' in ev) {
    return { x: ev.clientX, y: ev.clientY }
  }
  const te = ev as TouchEvent
  const t = te.changedTouches?.[0]
  return t
    ? { x: t.clientX, y: t.clientY }
    : { x: 0, y: 0 }
}

/** Тест канваса */
export function pickCellAt(
  board: Board,
  canvas: HTMLCanvasElement,
  ev: MouseEvent | PointerEvent | TouchEvent
): { r: number; c: number } | null {
  const { rows, cols } = dims(board)
  if (rows === 0 || cols === 0) return null

  const rect = canvas.getBoundingClientRect()
  const { x: cx, y: cy } = getClientXY(ev)
  const px =
    (cx - rect.left) * (canvas.width / rect.width)
  const py =
    (cy - rect.top) *
    (canvas.height / rect.height)

  const W = canvas.width
  const H = canvas.height
  const cell = Math.floor(
    Math.min(W / cols, H / rows)
  )
  const ox = Math.floor((W - cols * cell) / 2)
  const oy = Math.floor((H - rows * cell) / 2)

  const c = Math.floor((px - ox) / cell)
  const r = Math.floor((py - oy) / cell)
  if (r >= 0 && r < rows && c >= 0 && c < cols)
    return { r, c }
  return null
}

export function renderBoard(
  ctx: CanvasRenderingContext2D,
  board: Board,
  opts?: RenderOpts
): void {
  const { rows, cols } = dims(board)
  const W = ctx.canvas.width
  const H = ctx.canvas.height

  ctx.clearRect(0, 0, W, H)
  if (rows === 0 || cols === 0) return

  const cell = Math.floor(
    Math.min(W / cols, H / rows)
  )
  const ox = Math.floor((W - cols * cell) / 2)
  const oy = Math.floor((H - rows * cell) / 2)

  // frame
  ctx.save()
  ctx.fillStyle = 'rgba(5, 12, 28, 0.95)'
  ctx.fillRect(
    ox - 10,
    oy - 10,
    cols * cell + 20,
    rows * cell + 20
  )
  ctx.shadowColor = 'rgba(90, 219, 255, 0.75)'
  ctx.shadowBlur = 20
  ctx.strokeStyle = 'rgba(97, 222, 255, 0.9)'
  ctx.lineWidth = 2
  ctx.strokeRect(
    ox - 6,
    oy - 6,
    cols * cell + 12,
    rows * cell + 12
  )
  ctx.restore()

  for (let r = 0; r < rows; r += 1) {
    const row = board[r]
    if (!row) continue
    for (let c = 0; c < cols; c += 1) {
      const x = ox + c * cell
      const y = oy + r * cell

      // base
      ctx.fillStyle = 'rgba(18, 28, 53, 0.95)'
      ctx.fillRect(x, y, cell, cell)
      ctx.strokeStyle = 'rgba(95, 140, 210, 0.35)'
      ctx.strokeRect(x, y, cell, cell)

      const v = row[c]
      if (typeof v !== 'number' || v < 0) continue

      const color = colorForKind(v)
      drawShape(ctx, v, x, y, cell, color)
    }
  }

  // подсветка комбинаций
  if (
    opts?.highlight &&
    opts.highlight.length > 0
  ) {
    const alpha =
      typeof opts.alpha === 'number'
        ? Math.max(0, Math.min(1, opts.alpha))
        : 1
    ctx.save()
    const prev = ctx.globalAlpha
    ctx.globalAlpha = alpha
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(255,255,0,1)'

    for (const h of opts.highlight) {
      if (!h) continue
      if (
        h.r < 0 ||
        h.c < 0 ||
        h.r >= rows ||
        h.c >= cols
      )
        continue
      const x = ox + h.c * cell
      const y = oy + h.r * cell
      ctx.strokeRect(
        x + 1,
        y + 1,
        cell - 2,
        cell - 2
      )
    }

    ctx.globalAlpha = prev
    ctx.restore()
  }

  // Подсветка первой выбранной клетки
  if (opts?.selected) {
    const { r, c } = opts.selected
    if (
      Number.isInteger(r) &&
      Number.isInteger(c) &&
      r >= 0 &&
      c >= 0 &&
      r < rows &&
      c < cols
    ) {
      const x = ox + c * cell
      const y = oy + r * cell
      ctx.save()
      ctx.lineWidth = 4
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'
      ctx.shadowColor = 'rgba(255,255,255,0.8)'
      ctx.shadowBlur = 8
      ctx.strokeRect(
        x + 1,
        y + 1,
        cell - 2,
        cell - 2
      )
      ctx.restore()
    }
  }

  // Подсветка целевой (второй) клетки для обмена
  if (opts?.target) {
    const { r, c } = opts.target
    if (
      Number.isInteger(r) &&
      Number.isInteger(c) &&
      r >= 0 &&
      c >= 0 &&
      r < rows &&
      c < cols
    ) {
      const x = ox + c * cell
      const y = oy + r * cell
      const pulseInset = opts.targetPulse ? 0 : 2
      const pulseBlur = opts.targetPulse ? 14 : 9

      ctx.save()
      ctx.lineWidth = 3
      ctx.setLineDash([6, 4])
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.95)'
      ctx.shadowColor = 'rgba(56, 189, 248, 0.85)'
      ctx.shadowBlur = pulseBlur
      ctx.strokeRect(
        x + pulseInset,
        y + pulseInset,
        cell - pulseInset * 2,
        cell - pulseInset * 2
      )
      ctx.setLineDash([])
      ctx.restore()
    }
  }

  // Линия/стрелка между первой и второй клеткой
  if (
    opts?.showSwapArrow &&
    opts?.selected &&
    opts?.target
  ) {
    const a = opts.selected
    const b = opts.target
    const inBounds = (p: CellRC) =>
      p.r >= 0 &&
      p.c >= 0 &&
      p.r < rows &&
      p.c < cols
    if (inBounds(a) && inBounds(b)) {
      const ax = ox + a.c * cell + cell / 2
      const ay = oy + a.r * cell + cell / 2
      const bx = ox + b.c * cell + cell / 2
      const by = oy + b.r * cell + cell / 2
      const dx = bx - ax
      const dy = by - ay
      const len = Math.hypot(dx, dy)
      if (len > 1) {
        const ux = dx / len
        const uy = dy / len
        const startX = ax + ux * (cell * 0.2)
        const startY = ay + uy * (cell * 0.2)
        const endX = bx - ux * (cell * 0.28)
        const endY = by - uy * (cell * 0.28)

        ctx.save()
        ctx.strokeStyle =
          'rgba(125, 211, 252, 0.95)'
        ctx.lineWidth = 3
        ctx.shadowColor =
          'rgba(56, 189, 248, 0.9)'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()

        const headLen = Math.max(8, cell * 0.18)
        const headW = Math.max(6, cell * 0.14)
        const nx = -uy
        const ny = ux
        const hx1 =
          endX - ux * headLen + nx * headW * 0.5
        const hy1 =
          endY - uy * headLen + ny * headW * 0.5
        const hx2 =
          endX - ux * headLen - nx * headW * 0.5
        const hy2 =
          endY - uy * headLen - ny * headW * 0.5
        ctx.fillStyle =
          'rgba(125, 211, 252, 0.98)'
        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(hx1, hy1)
        ctx.lineTo(hx2, hy2)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
    }
  }
}
