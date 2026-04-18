/**
 * Слой VFX для match-3: частицы при срыве матча и короткая радиальная вспышка.
 * Рисуется на отдельном canvas поверх поля; ядро игры не зависит от этого модуля.
 * 6.3.1 VFX при матче (частицы + вспышка):
 * Заметная обратная связь при очистке матча без изменения core match-3.
 * Релизовал createMatchFx — burstFromMatches, step, draw, isActive, reset;
 * цвета из TILE_COLORS_BY_THEME; геометрия центров клеток через boardLayout из renderer.
 * См. также: bootstrap.ts (подключение fxCanvas и rAF), Match3Screen.tsx + match3.pcss (второй canvas).
 */

import type { Board } from './core/grid'
import type { CellRC } from './core/match'
import {
  MATCH3_ANIM_TIME_MULT,
  TILE_COLORS_BY_THEME,
  type GameThemeOption,
} from './config'

const VFX_PACE = MATCH3_ANIM_TIME_MULT
const vfxSpd = 1 / VFX_PACE
const FLASH_DECAY_PER_K = Math.pow(
  0.92,
  1 / VFX_PACE
)
import {
  boardLayout,
  MATCH3_BOARD_LOGICAL_PX,
} from './renderer'
import type { LineOrientation } from './core/cell'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

type FloatingText = {
  x: number
  y: number
  vy: number
  life: number
  maxLife: number
  text: string
  color: string
  size: number
}

type SpecialActivationFx = {
  cell: CellRC
  type: 'line' | 'bomb'
  orientation?: LineOrientation
}

function colorForTileKind(
  kind: number,
  theme: GameThemeOption
): string {
  const colors =
    TILE_COLORS_BY_THEME[theme] ??
    TILE_COLORS_BY_THEME.standard
  const idx = Math.abs(kind) % colors.length
  return colors[idx] ?? '#ffffff'
}

export function createMatchFx(
  ctx: CanvasRenderingContext2D
) {
  let particles: Particle[] = []
  let texts: FloatingText[] = []
  let flash = 0
  type CelebrationStyle =
    | 'normal'
    | 'line4plus'
    | 'tOrL'

  function burstFromMatches(
    board: Board,
    matches: CellRC[],
    theme: GameThemeOption,
    chain: number
  ) {
    const L = boardLayout(
      board,
      MATCH3_BOARD_LOGICAL_PX,
      MATCH3_BOARD_LOGICAL_PX
    )
    if (!L || matches.length === 0) return

    const { cell, ox, oy } = L
    const boost = Math.min(
      2.15,
      0.88 + chain * 0.14
    )
    const baseN = Math.min(
      26,
      10 + Math.floor(matches.length * 1.05)
    )

    for (const m of matches) {
      const row = board[m.r]
      const v =
        row && typeof row[m.c] === 'number'
          ? row[m.c]
          : 0
      if (typeof v !== 'number' || v < 0) continue

      const color = colorForTileKind(v, theme)
      const cx = ox + m.c * cell + cell / 2
      const cy = oy + m.r * cell + cell / 2
      const n = Math.floor(baseN * boost)

      for (let i = 0; i < n; i += 1) {
        const a = Math.random() * Math.PI * 2
        const sp =
          (2.4 + Math.random() * 7) *
          (0.58 + boost * 0.32) *
          vfxSpd
        particles.push({
          x:
            cx +
            (Math.random() - 0.5) * cell * 0.42,
          y:
            cy +
            (Math.random() - 0.5) * cell * 0.42,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 1.4 * vfxSpd,
          life: 0,
          maxLife:
            (320 + Math.random() * 300) *
            VFX_PACE,
          size: 2.4 + Math.random() * 5.2,
          color,
        })
      }
    }

    flash = Math.min(
      1,
      0.42 +
        Math.min(matches.length, 24) * 0.024 +
        (chain - 1) * 0.1
    )
  }

  function burstCelebration(
    board: Board,
    cells: CellRC[],
    theme: GameThemeOption,
    style: CelebrationStyle
  ) {
    const L = boardLayout(
      board,
      MATCH3_BOARD_LOGICAL_PX,
      MATCH3_BOARD_LOGICAL_PX
    )
    if (!L || cells.length === 0) return

    const styleScale =
      style === 'tOrL'
        ? 1.95
        : style === 'line4plus'
        ? 1.45
        : 1
    const baseChain =
      style === 'tOrL'
        ? 3
        : style === 'line4plus'
        ? 2
        : 1

    burstFromMatches(
      board,
      cells,
      theme,
      baseChain
    )

    const { cell, ox, oy } = L
    const extraN =
      style === 'tOrL'
        ? 92
        : style === 'line4plus'
        ? 56
        : 26

    for (let i = 0; i < extraN; i += 1) {
      const pivot =
        cells[
          Math.floor(Math.random() * cells.length)
        ]
      if (!pivot) continue
      const value =
        board[pivot.r]?.[pivot.c] ??
        Math.floor(Math.random() * 8)
      const color = colorForTileKind(
        Number(value) || 0,
        theme
      )
      const cx = ox + pivot.c * cell + cell / 2
      const cy = oy + pivot.r * cell + cell / 2
      const a = Math.random() * Math.PI * 2
      const sp =
        (3.4 + Math.random() * 10.5) *
        styleScale *
        vfxSpd
      particles.push({
        x:
          cx +
          (Math.random() - 0.5) * cell * 0.55,
        y:
          cy +
          (Math.random() - 0.5) * cell * 0.55,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1.8 * vfxSpd,
        life: 0,
        maxLife:
          (260 +
            Math.random() * 280 +
            styleScale * 110) *
          VFX_PACE,
        size:
          2.2 + Math.random() * 4.8 * styleScale,
        color,
      })
    }

    flash = Math.min(
      1,
      flash +
        (style === 'tOrL'
          ? 0.82
          : style === 'line4plus'
          ? 0.62
          : 0.35)
    )
  }

  function burstScoreText(
    board: Board,
    cells: CellRC[],
    score: number,
    chain: number
  ) {
    const L = boardLayout(
      board,
      MATCH3_BOARD_LOGICAL_PX,
      MATCH3_BOARD_LOGICAL_PX
    )
    if (!L || cells.length === 0 || score <= 0)
      return
    const { cell, ox, oy } = L
    let sumX = 0
    let sumY = 0
    for (const c of cells) {
      sumX += ox + c.c * cell + cell / 2
      sumY += oy + c.r * cell + cell / 2
    }
    const cx = sumX / cells.length
    const cy = sumY / cells.length
    const combo = chain > 1 ? `  x${chain}` : ''
    texts.push({
      x: cx,
      y: cy - cell * 0.08,
      vy:
        -(0.38 + Math.min(0.3, chain * 0.06)) *
        vfxSpd,
      life: 0,
      maxLife: 760 * VFX_PACE,
      text: `+${score}${combo}`,
      color: chain > 1 ? '#fde68a' : '#bfdbfe',
      size: Math.max(
        14,
        Math.min(24, Math.floor(cell * 0.31))
      ),
    })
  }

  function burstSpecialActivations(
    board: Board,
    activations: SpecialActivationFx[],
    theme: GameThemeOption
  ) {
    const L = boardLayout(
      board,
      MATCH3_BOARD_LOGICAL_PX,
      MATCH3_BOARD_LOGICAL_PX
    )
    if (!L || activations.length === 0) return
    const { cell, ox, oy } = L
    for (const a of activations) {
      const cx = ox + a.cell.c * cell + cell / 2
      const cy = oy + a.cell.r * cell + cell / 2
      if (a.type === 'line') {
        const n = 62
        for (let i = 0; i < n; i += 1) {
          const t = (Math.random() - 0.5) * 2
          const along =
            (Math.random() - 0.5) *
            cell *
            (a.orientation === 'row' ? 7.6 : 7)
          const jitter =
            (Math.random() - 0.5) * cell * 0.6
          const isRow = a.orientation !== 'col'
          particles.push({
            x: isRow ? cx + along : cx + jitter,
            y: isRow ? cy + jitter : cy + along,
            vx:
              (isRow ? t * 8 : t * 1.7) * vfxSpd,
            vy:
              (isRow ? t * 1.7 : t * 8) * vfxSpd,
            life: 0,
            maxLife:
              (240 + Math.random() * 180) *
              VFX_PACE,
            size: 1.8 + Math.random() * 3.4,
            color:
              theme === 'space'
                ? '#a5f3fc'
                : '#dbeafe',
          })
        }
        continue
      }
      const n = 84
      for (let i = 0; i < n; i += 1) {
        const angle = Math.random() * Math.PI * 2
        const dist =
          Math.random() * cell * 1.6 + cell * 0.2
        const sp =
          (2.2 + Math.random() * 9.5) * vfxSpd
        particles.push({
          x: cx + Math.cos(angle) * dist * 0.18,
          y: cy + Math.sin(angle) * dist * 0.18,
          vx: Math.cos(angle) * sp,
          vy: Math.sin(angle) * sp,
          life: 0,
          maxLife:
            (260 + Math.random() * 220) *
            VFX_PACE,
          size: 2 + Math.random() * 4.6,
          color:
            theme === 'space'
              ? '#fca5a5'
              : '#fef3c7',
        })
      }
    }
    flash = Math.min(
      1,
      flash +
        Math.min(0.9, activations.length * 0.2)
    )
  }

  function burstGoalHits(
    board: Board,
    cells: CellRC[],
    theme: GameThemeOption
  ) {
    const L = boardLayout(
      board,
      MATCH3_BOARD_LOGICAL_PX,
      MATCH3_BOARD_LOGICAL_PX
    )
    if (!L || cells.length === 0) return
    const { cell, ox, oy } = L
    for (const hit of cells) {
      const cx = ox + hit.c * cell + cell / 2
      const cy = oy + hit.r * cell + cell / 2
      const n = 46
      for (let i = 0; i < n; i += 1) {
        const angle = Math.random() * Math.PI * 2
        const speed =
          (2 + Math.random() * 8.5) * vfxSpd
        particles.push({
          x:
            cx +
            (Math.random() - 0.5) * cell * 0.16,
          y:
            cy +
            (Math.random() - 0.5) * cell * 0.16,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife:
            (220 + Math.random() * 180) *
            VFX_PACE,
          size: 1.8 + Math.random() * 3.4,
          color:
            theme === 'space'
              ? '#fde68a'
              : '#fbbf24',
        })
      }
    }
    flash = Math.min(1, flash + 0.5)
  }

  function step(dtMs: number) {
    const k = Math.min(3, dtMs / 16.67)
    flash *= Math.pow(FLASH_DECAY_PER_K, k)

    const g = 0.11 * k
    const drag = Math.pow(0.984, k)

    particles = particles.filter(p => {
      p.life += dtMs
      p.vx *= drag
      p.vy = p.vy * drag + g
      p.x += p.vx * k
      p.y += p.vy * k
      return p.life < p.maxLife
    })
    texts = texts.filter(t => {
      t.life += dtMs
      t.y += t.vy * k * 2.1
      return t.life < t.maxLife
    })
  }

  function draw() {
    const w = MATCH3_BOARD_LOGICAL_PX
    const h = MATCH3_BOARD_LOGICAL_PX
    ctx.clearRect(0, 0, w, h)

    const hasParticles = particles.length > 0
    const hasFlash = flash > 0.02

    if (hasFlash) {
      const cx = w / 2
      const cy = h / 2
      const diag = Math.hypot(w, h)
      const a = flash * 0.58

      const core = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        diag * 0.22
      )
      core.addColorStop(
        0,
        `rgba(255, 255, 248, ${a * 0.55})`
      )
      core.addColorStop(
        1,
        'rgba(255, 250, 220, 0)'
      )
      ctx.fillStyle = core
      ctx.fillRect(0, 0, w, h)

      const r = diag * 0.62
      const grad = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        r
      )
      grad.addColorStop(
        0,
        `rgba(255, 252, 230, ${a * 0.95})`
      )
      grad.addColorStop(
        0.28,
        `rgba(255, 238, 190, ${a * 0.45})`
      )
      grad.addColorStop(
        0.55,
        `rgba(255, 220, 160, ${a * 0.18})`
      )
      grad.addColorStop(
        1,
        'rgba(255, 255, 255, 0)'
      )
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
    }

    if (hasParticles) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (const p of particles) {
        const t = p.life / p.maxLife
        const fade = 1 - t
        const alpha =
          fade * fade * 0.95 + fade * 0.08
        const rad = p.size * (1 - t * 0.35)
        ctx.globalAlpha = alpha * 0.22
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(
          p.x,
          p.y,
          rad * 2.1,
          0,
          Math.PI * 2
        )
        ctx.fill()
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
    if (texts.length > 0) {
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const t of texts) {
        const k = t.life / t.maxLife
        const fade = 1 - k
        ctx.globalAlpha = Math.max(0, fade * 0.95)
        ctx.font = `800 ${t.size}px system-ui, sans-serif`
        ctx.fillStyle = t.color
        ctx.shadowColor = 'rgba(15,23,42,0.85)'
        ctx.shadowBlur = 8
        ctx.fillText(t.text, t.x, t.y)
      }
      ctx.restore()
    }
  }

  function isActive() {
    return (
      particles.length > 0 ||
      texts.length > 0 ||
      flash > 0.02
    )
  }

  function reset() {
    particles = []
    texts = []
    flash = 0
    ctx.clearRect(
      0,
      0,
      MATCH3_BOARD_LOGICAL_PX,
      MATCH3_BOARD_LOGICAL_PX
    )
  }

  return {
    burstFromMatches,
    burstCelebration,
    burstScoreText,
    burstSpecialActivations,
    burstGoalHits,
    step,
    draw,
    isActive,
    reset,
  }
}

export type MatchFxApi = ReturnType<
  typeof createMatchFx
>
