/**
 * renderer.ts отвечает только за отрисовку и hit-test (попадание в клетку по координатам).
 * Он не хранит состояние партии и не знает ничего о таймерах, очках или правилах обмена.
 * На вход подаётся текущая матрица поля и опции подсветки, на выходе — кадр на canvas.
 * Такой разнос позволяет безопасно улучшать визуал, не ломая core-логику игры.
 * 6.1.2 Игровые настройки перед стартом:
 * renderBoard теперь принимает theme в RenderOpts
 * Цвета фишек берутся из TILE_COLORS_BY_THEME по выбранной теме
 * 6.1.6 Спец-фишки:
 * у спец-клеток рисуются отличительные маркеры поверх базовой фигуры
 * визуально сразу видно, что это “особая” фишка
 * 6.1.8 Таймер бездействия и подсказка хода
 * Расширил RenderOpts: hintFrom, hintTo
 * Добавил отрисовку подсказки: пунктирная желтая рамка на клетках возможного свопа
 * 6.3.1 VFX при матче (частицы + вспышка):
 * Экспорт boardLayout(board, canvasW, canvasH) — общая геометрия клетки и отступов
 * renderBoard, pickCellAt и matchFx используют {@link MATCH3_BOARD_LOGICAL_PX} как логический размер поля
 * 6.3.3 Улучшенный HUD (сбоку на ПК, компактная шапка в мобильной версии)
 * 6.3.4 Улучшенная геометрия поля (ширина поля на 20% больше высоты)
 * 6.3.5 Добавлен выбор тематики фишек
 */

import type { Board } from './core/grid'
import type { CellRC } from './core/match'
import {
  getLineOrientation,
  getSpecialType,
} from './core/cell'
import {
  TILE_COLORS_BY_THEME,
  type BoardFieldThemeOption,
  type GameIconThemeOption,
  type GameThemeOption,
} from './config'
import {
  MATCH3_COSMIC_ICON_URLS,
  MATCH3_FOOD_ICON_URLS,
} from './match3IconUrls'

export type RenderOpts = {
  tileMotions?: {
    from: CellRC
    to: CellRC
  }[]
  motionProgress?: number
  highlight?: CellRC[]
  alpha?: number
  selected?: CellRC | null
  target?: CellRC | null
  targetPulse?: boolean
  hintFrom?: CellRC | null
  hintTo?: CellRC | null
  /** 0..1 циклическая фаза анимации idle-подсказки (3 вспышки за цикл). */
  hintPulsePhase?: number
  theme?: GameThemeOption
  iconTheme?: GameIconThemeOption
  /** Оформление поля: космическая сетка или светлая «столешница» под иконки еды. */
  boardField?: BoardFieldThemeOption
  iceGrid?: number[][]
  goalGrid?: number[][]
}

/**
 * Координаты отрисовки и {@link boardLayout} — в этой логической системе;
 * буфер канваса увеличивается по `devicePixelRatio` в bootstrap (резкие SVG).
 */
export const MATCH3_BOARD_LOGICAL_PX = 480

const COSMIC_ICON_PATHS = [
  ...MATCH3_COSMIC_ICON_URLS,
]

const FOOD_ICON_PATHS = [...MATCH3_FOOD_ICON_URLS]

const iconCache: Partial<
  Record<GameIconThemeOption, HTMLImageElement[]>
> = {}

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

/** Геометрия поля в пикселях канваса (как в renderBoard / pickCellAt). */
export function boardLayout(
  board: Board,
  canvasWidth: number,
  canvasHeight: number
): {
  rows: number
  cols: number
  cell: number
  ox: number
  oy: number
} | null {
  const { rows, cols } = dims(board)
  if (rows === 0 || cols === 0) return null
  const cell = Math.floor(
    Math.min(
      canvasWidth / cols,
      canvasHeight / rows
    )
  )
  const ox = Math.floor(
    (canvasWidth - cols * cell) / 2
  )
  const oy = Math.floor(
    (canvasHeight - rows * cell) / 2
  )
  return { rows, cols, cell, ox, oy }
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

function colorForKind(
  kind: number,
  theme: GameThemeOption = 'standard'
): string {
  const colors =
    TILE_COLORS_BY_THEME[theme] ??
    TILE_COLORS_BY_THEME.standard
  const idx = Math.abs(kind) % colors.length
  return colors[idx] ?? '#888'
}

function loadIcons(
  paths: string[]
): HTMLImageElement[] {
  return paths.map(path => {
    const img = new Image()
    img.src = path
    return img
  })
}

function iconsForTheme(
  theme: GameIconThemeOption
): HTMLImageElement[] | null {
  if (theme === 'standard') return null
  const cached = iconCache[theme]
  if (cached?.length) {
    const allFailed = cached.every(
      im => im.complete && im.naturalWidth <= 0
    )
    if (!allFailed) return cached
    delete iconCache[theme]
  }
  const paths =
    theme === 'cosmic'
      ? COSMIC_ICON_PATHS
      : FOOD_ICON_PATHS
  const icons = loadIcons(paths)
  iconCache[theme] = icons
  return icons
}

function waitForImage(
  img: HTMLImageElement
): Promise<void> {
  if (img.complete && img.naturalWidth > 0) {
    return Promise.resolve()
  }
  return new Promise(resolve => {
    const done = () => {
      img.removeEventListener('load', done)
      img.removeEventListener('error', done)
      resolve()
    }
    img.addEventListener('load', done, {
      once: true,
    })
    img.addEventListener('error', done, {
      once: true,
    })
  })
}

export function preloadIconTheme(
  theme: GameIconThemeOption
): Promise<void> {
  const icons = iconsForTheme(theme)
  if (!icons || icons.length === 0) {
    return Promise.resolve()
  }
  return Promise.all(
    icons.map(waitForImage)
  ).then(() => undefined)
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

function drawSpecialMarker(
  ctx: CanvasRenderingContext2D,
  value: number,
  x: number,
  y: number,
  cell: number
) {
  const specialType = getSpecialType(value)
  if (!specialType) return
  const cx = x + cell / 2
  const cy = y + cell / 2
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
  ctx.fillStyle = 'rgba(15, 23, 42, 0.68)'
  ctx.lineWidth = Math.max(1.5, cell * 0.06)

  if (specialType === 'line') {
    const orientation = getLineOrientation(value)
    if (orientation === 'row') {
      const h = Math.max(3, cell * 0.12)
      ctx.beginPath()
      pathRoundRect(
        ctx,
        x + cell * 0.18,
        cy - h / 2,
        cell * 0.64,
        h,
        h / 2
      )
      ctx.fill()
      ctx.stroke()
    } else {
      const w = Math.max(3, cell * 0.12)
      ctx.beginPath()
      pathRoundRect(
        ctx,
        cx - w / 2,
        y + cell * 0.18,
        w,
        cell * 0.64,
        w / 2
      )
      ctx.fill()
      ctx.stroke()
    }
  } else {
    const radius = Math.max(5, cell * 0.18)
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx, cy - radius - cell * 0.08)
    ctx.lineTo(cx, cy + radius + cell * 0.08)
    ctx.moveTo(cx - radius - cell * 0.08, cy)
    ctx.lineTo(cx + radius + cell * 0.08, cy)
    ctx.stroke()
  }

  ctx.restore()
}

function drawIceOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  hp: number
) {
  const alpha =
    hp >= 3 ? 0.46 : hp === 2 ? 0.34 : 0.24
  ctx.save()
  ctx.fillStyle = `rgba(167, 243, 255, ${alpha})`
  ctx.strokeStyle = 'rgba(226, 248, 255, 0.75)'
  ctx.lineWidth = Math.max(1, cell * 0.04)
  const inset = Math.max(1, cell * 0.06)
  ctx.beginPath()
  pathRoundRect(
    ctx,
    x + inset,
    y + inset,
    cell - inset * 2,
    cell - inset * 2,
    Math.max(3, cell * 0.15)
  )
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
  ctx.lineWidth = Math.max(1, cell * 0.025)
  ctx.beginPath()
  ctx.moveTo(x + cell * 0.28, y + cell * 0.35)
  ctx.lineTo(x + cell * 0.72, y + cell * 0.5)
  if (hp >= 2) {
    ctx.moveTo(x + cell * 0.52, y + cell * 0.2)
    ctx.lineTo(x + cell * 0.36, y + cell * 0.68)
  }
  if (hp >= 3) {
    ctx.moveTo(x + cell * 0.22, y + cell * 0.58)
    ctx.lineTo(x + cell * 0.64, y + cell * 0.3)
  }
  ctx.stroke()
  ctx.restore()
}

/** Доля площади клетки под SVG-иконку еды (остальное — поле и рамка). */
const FOOD_ICON_AREA_RATIO = 0.98

/** Фон клетки с фишкой (еда). */
const FOOD_TILE_FILL = '#424242'

/**
 * Акцент конца градиента рамки (1 синий … 6 коричневый; 7+ — фиолет., оранж., бирюз., индиго).
 * Индекс: `Math.abs(kind) % length`.
 */
const FOOD_TILE_BORDER_ACCENTS: readonly string[] =
  [
    '#2563eb',
    '#16a34a',
    '#ca8a04',
    '#dc2626',
    '#db2777',
    '#92400e',
    '#7c3aed',
    '#ea580c',
    '#0d9488',
    '#4338ca',
  ]

function foodTileBorderAccent(
  kind: number
): string {
  const idx =
    Math.abs(kind) %
    FOOD_TILE_BORDER_ACCENTS.length
  return (
    FOOD_TILE_BORDER_ACCENTS[idx] ??
    FOOD_TILE_BORDER_ACCENTS[0]
  )
}

function strokeFoodCellBorderByKind(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  /** `null` — пустая клетка: золото → приглушённый серый */
  kindOrNull: number | null
) {
  // Фиксированная толщина для стабильной читаемости фаски.
  const lw = 4
  const inset = lw / 2
  const accentEnd =
    kindOrNull === null
      ? '#4f4f4f'
      : foodTileBorderAccent(kindOrNull)

  ctx.save()
  const g = ctx.createLinearGradient(
    x,
    y,
    x + cell,
    y + cell
  )
  g.addColorStop(0, '#fff6d6')
  // Усиливаем 2-й цвет для объема
  g.addColorStop(0.16, '#ffd24f')
  g.addColorStop(0.46, '#f0b83f')
  g.addColorStop(0.82, accentEnd)
  g.addColorStop(1, accentEnd)
  ctx.strokeStyle = g
  ctx.lineWidth = lw
  ctx.strokeRect(
    x + inset,
    y + inset,
    cell - lw,
    cell - lw
  )
  // Блестящая фаска: светлый блик сверху/слева
  ctx.lineWidth = Math.max(1.2, lw * 0.24)
  ctx.strokeStyle = 'rgba(255, 248, 220, 0.72)'
  ctx.beginPath()
  ctx.moveTo(
    x + inset + lw * 0.35,
    y + inset + lw * 0.42
  )
  ctx.lineTo(
    x + cell - inset - lw * 0.5,
    y + inset + lw * 0.42
  )
  ctx.moveTo(
    x + inset + lw * 0.42,
    y + inset + lw * 0.35
  )
  ctx.lineTo(
    x + inset + lw * 0.42,
    y + cell - inset - lw * 0.5
  )
  ctx.stroke()
  // Тень фаски снизу/справа для глубины
  ctx.lineWidth = Math.max(1, lw * 0.2)
  ctx.strokeStyle = 'rgba(24, 16, 10, 0.55)'
  ctx.beginPath()
  ctx.moveTo(
    x + inset + lw * 0.55,
    y + cell - inset - lw * 0.38
  )
  ctx.lineTo(
    x + cell - inset - lw * 0.25,
    y + cell - inset - lw * 0.38
  )
  ctx.moveTo(
    x + cell - inset - lw * 0.38,
    y + inset + lw * 0.55
  )
  ctx.lineTo(
    x + cell - inset - lw * 0.38,
    y + cell - inset - lw * 0.25
  )
  ctx.stroke()
  ctx.restore()
}

function drawMutedGoldSelection(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  opts?: {
    pulse?: boolean
  }
) {
  const pulse = Boolean(opts?.pulse)
  const inset = pulse ? 1.2 : 1.8
  const lineW = pulse ? 3.8 : 3.2
  const r = Math.max(4, cell * 0.15)
  ctx.save()
  const g = ctx.createLinearGradient(
    x,
    y,
    x + cell,
    y + cell
  )
  g.addColorStop(0, 'rgba(255, 236, 176, 0.9)')
  g.addColorStop(0.45, 'rgba(212, 169, 85, 0.86)')
  g.addColorStop(1, 'rgba(144, 107, 44, 0.82)')
  ctx.strokeStyle = g
  ctx.lineWidth = lineW
  ctx.shadowColor = pulse
    ? 'rgba(251, 191, 36, 0.52)'
    : 'rgba(212, 169, 85, 0.42)'
  ctx.shadowBlur = pulse ? 12 : 8
  ctx.beginPath()
  pathRoundRect(
    ctx,
    x + inset,
    y + inset,
    cell - inset * 2,
    cell - inset * 2,
    r
  )
  ctx.stroke()
  ctx.restore()
}

function hintBurstIntensity(
  phaseRaw: number
): number {
  const phase = ((phaseRaw % 1) + 1) % 1
  const centers = [1 / 6, 0.5, 5 / 6] as const
  let out = 0
  for (const c of centers) {
    const dist = Math.abs(phase - c)
    const wrapped = Math.min(dist, 1 - dist)
    const t = Math.max(0, 1 - wrapped / 0.14)
    out = Math.max(out, t)
  }
  return out
}

function drawGoalOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number
) {
  const cx = x + cell / 2
  const cy = y + cell / 2
  const r = Math.max(4, cell * 0.2)
  ctx.save()
  ctx.lineWidth = Math.max(1.4, cell * 0.05)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.95)'
  ctx.fillStyle = 'rgba(120, 53, 15, 0.2)'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.9)'
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.55, cy)
  ctx.lineTo(cx + r * 0.55, cy)
  ctx.moveTo(cx, cy - r * 0.55)
  ctx.lineTo(cx, cy + r * 0.55)
  ctx.stroke()
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
    (cx - rect.left) *
    (MATCH3_BOARD_LOGICAL_PX / rect.width)
  const py =
    (cy - rect.top) *
    (MATCH3_BOARD_LOGICAL_PX / rect.height)

  const W = MATCH3_BOARD_LOGICAL_PX
  const H = MATCH3_BOARD_LOGICAL_PX
  const layout = boardLayout(board, W, H)
  if (!layout) return null
  const { cell, ox, oy } = layout

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
  const theme = opts?.theme ?? 'standard'
  const iconTheme = opts?.iconTheme ?? 'cosmic'
  const themeIcons = iconsForTheme(iconTheme)
  const boardField: BoardFieldThemeOption =
    opts?.boardField ?? 'space'
  const isFoodField = boardField === 'food'

  const { rows, cols } = dims(board)
  const W = MATCH3_BOARD_LOGICAL_PX
  const H = MATCH3_BOARD_LOGICAL_PX

  ctx.clearRect(0, 0, W, H)
  if (rows === 0 || cols === 0) return

  const layout = boardLayout(board, W, H)
  if (!layout) return
  const { cell, ox, oy } = layout
  const motionProgress = Math.max(
    0,
    Math.min(1, opts?.motionProgress ?? 1)
  )
  const motionByDest = new Map<
    string,
    { from: CellRC; to: CellRC }
  >()
  for (const m of opts?.tileMotions ?? []) {
    if (!m) continue
    motionByDest.set(`${m.to.r},${m.to.c}`, m)
  }

  // frame
  ctx.save()
  if (isFoodField) {
    const pad = 10
    const fw = cols * cell + pad * 2
    const fh = rows * cell + pad * 2
    const gx = ctx.createLinearGradient(
      ox - pad,
      oy - pad,
      ox - pad + fw,
      oy - pad + fh
    )
    gx.addColorStop(0, '#6b3f2a')
    gx.addColorStop(0.45, '#4a2c1c')
    gx.addColorStop(1, '#2d1810')
    ctx.fillStyle = gx
    ctx.fillRect(ox - pad, oy - pad, fw, fh)
    ctx.shadowColor = 'rgba(251, 191, 36, 0.35)'
    ctx.shadowBlur = 18
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.88)'
    ctx.lineWidth = 2
    ctx.strokeRect(
      ox - 6,
      oy - 6,
      cols * cell + 12,
      rows * cell + 12
    )
  } else {
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
  }
  ctx.restore()

  for (let r = 0; r < rows; r += 1) {
    const row = board[r]
    if (!row) continue
    for (let c = 0; c < cols; c += 1) {
      const x = ox + c * cell
      const y = oy + r * cell

      const v = row[c]
      const hasTile =
        typeof v === 'number' && v >= 0

      // base
      if (isFoodField) {
        ctx.fillStyle = FOOD_TILE_FILL
        ctx.fillRect(x, y, cell, cell)
        strokeFoodCellBorderByKind(
          ctx,
          x,
          y,
          cell,
          hasTile ? v : null
        )
      } else {
        ctx.fillStyle = 'rgba(18, 28, 53, 0.95)'
        ctx.fillRect(x, y, cell, cell)
        ctx.strokeStyle =
          'rgba(95, 140, 210, 0.35)'
        ctx.strokeRect(x, y, cell, cell)
      }

      if (!hasTile) continue
      const motion = motionByDest.get(`${r},${c}`)
      const drawX = motion
        ? ox +
          (motion.from.c +
            (motion.to.c - motion.from.c) *
              motionProgress) *
            cell
        : x
      const drawY = motion
        ? oy +
          (motion.from.r +
            (motion.to.r - motion.from.r) *
              motionProgress) *
            cell
        : y

      const icon =
        themeIcons?.[
          Math.abs(v) % themeIcons.length
        ]
      if (
        icon &&
        typeof icon.naturalWidth === 'number' &&
        icon.naturalWidth > 0
      ) {
        ctx.save()
        ctx.shadowColor = isFoodField
          ? 'rgba(62, 39, 24, 0.28)'
          : 'rgba(148, 163, 184, 0.45)'
        ctx.shadowBlur = Math.max(
          4,
          Math.floor(cell * 0.12)
        )
        if (isFoodField) {
          const side =
            cell * Math.sqrt(FOOD_ICON_AREA_RATIO)
          const inset = (cell - side) / 2
          const dx = drawX + inset
          const dy = drawY + inset
          const s = Math.round(side * 2) / 2
          const ix = Math.round(dx * 2) / 2
          const iy = Math.round(dy * 2) / 2
          ctx.drawImage(icon, ix, iy, s, s)
        } else {
          const pad = Math.max(
            4,
            Math.floor(cell * 0.14)
          )
          ctx.drawImage(
            icon,
            drawX + pad,
            drawY + pad,
            cell - pad * 2,
            cell - pad * 2
          )
        }
        ctx.restore()
      } else {
        const color = colorForKind(v, theme)
        drawShape(
          ctx,
          v,
          drawX,
          drawY,
          cell,
          color
        )
      }
      drawSpecialMarker(
        ctx,
        v,
        drawX,
        drawY,
        cell
      )
      const iceHp = opts?.iceGrid?.[r]?.[c] ?? 0
      if (iceHp > 0) {
        drawIceOverlay(
          ctx,
          drawX,
          drawY,
          cell,
          iceHp
        )
      }
      const hasGoal =
        (opts?.goalGrid?.[r]?.[c] ?? 0) > 0
      if (hasGoal) {
        drawGoalOverlay(ctx, drawX, drawY, cell)
      }
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
      drawMutedGoldSelection(ctx, x, y, cell, {
        pulse: false,
      })
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
      drawMutedGoldSelection(ctx, x, y, cell, {
        pulse: Boolean(opts.targetPulse),
      })
    }
  }

  // Подсказка возможного хода при бездействии
  if (opts?.hintFrom && opts?.hintTo) {
    const a = opts.hintFrom
    const b = opts.hintTo
    const inBounds = (p: CellRC) =>
      p.r >= 0 &&
      p.c >= 0 &&
      p.r < rows &&
      p.c < cols
    if (inBounds(a) && inBounds(b)) {
      const burst = hintBurstIntensity(
        opts?.hintPulsePhase ?? 0
      )
      const drawHintCell = (p: CellRC) => {
        const x = ox + p.c * cell
        const y = oy + p.r * cell
        const ringInset = Math.max(
          0.8,
          cell * 0.03
        )
        const ringSize = cell - ringInset * 2
        ctx.save()
        const alpha = 0.2 + burst * 0.7
        const glowBlur = 4 + burst * 14
        const lineW = 1.6 + burst * 2.2
        const radius = Math.max(4, cell * 0.16)
        const core = ctx.createLinearGradient(
          x,
          y,
          x + cell,
          y + cell
        )
        core.addColorStop(
          0,
          `rgba(255, 243, 176, ${alpha})`
        )
        core.addColorStop(
          1,
          `rgba(227, 163, 61, ${alpha})`
        )
        ctx.strokeStyle = core
        ctx.lineWidth = lineW
        ctx.shadowColor = `rgba(251, 191, 36, ${
          0.35 + burst * 0.55
        })`
        ctx.shadowBlur = glowBlur
        ctx.beginPath()
        pathRoundRect(
          ctx,
          x + ringInset,
          y + ringInset,
          ringSize,
          ringSize,
          radius
        )
        ctx.stroke()
        ctx.globalAlpha = 0.16 + burst * 0.28
        ctx.lineWidth = Math.max(1, lineW * 0.58)
        ctx.shadowBlur = glowBlur * 0.45
        ctx.beginPath()
        pathRoundRect(
          ctx,
          x + ringInset - 1.6,
          y + ringInset - 1.6,
          ringSize + 3.2,
          ringSize + 3.2,
          radius + 1.5
        )
        ctx.stroke()
        ctx.restore()
      }
      drawHintCell(a)
      drawHintCell(b)
    }
  }
}
