import type { Board } from './core/grid'
import type { CellRC } from './core/match'
import { pickCellAt } from './renderer'

export function isAdjacentCell(
  a: CellRC,
  b: CellRC
): boolean {
  const dr = Math.abs(a.r - b.r)
  const dc = Math.abs(a.c - b.c)
  return (
    (dr === 1 && dc === 0) ||
    (dr === 0 && dc === 1)
  )
}

export function isSameCell(
  a: CellRC | null,
  b: CellRC | null
): boolean {
  return Boolean(
    a && b && a.r === b.r && a.c === b.c
  )
}

export function clampCursor(
  current: CellRC | null,
  dr: number,
  dc: number,
  rows: number,
  cols: number
): CellRC | null {
  if (rows === 0 || cols === 0) return null
  const base = current ?? { r: 0, c: 0 }
  return {
    r: Math.max(
      0,
      Math.min(rows - 1, base.r + dr)
    ),
    c: Math.max(
      0,
      Math.min(cols - 1, base.c + dc)
    ),
  }
}

export type Match3InputController = {
  onPointerDown: (ev: PointerEvent) => void
  onPointerMove: (ev: PointerEvent) => void
  onPointerUpOrCancel: (ev: PointerEvent) => void
  onKeyDown: (ev: KeyboardEvent) => void
  onKeyUp: (ev: KeyboardEvent) => void
  clearDragState: () => void
  clearPressedKeys: () => void
}

/**
 * Единая подписка pointer + keyboard для match-3 на canvas.
 * Состояние выбора/свапа остаётся в bootstrap; здесь только захват, драг и клавиши.
 */
export function createMatch3InputController(params: {
  canvas: HTMLCanvasElement
  dragThresholdPx: number
  getBoard: () => Board
  pointerGuard: () => boolean
  keyboardGuard: () => boolean
  ensureAudio: () => void
  markActivity: () => void
  onPointerDownPick: (ev: PointerEvent) => void
  moveKeyboardCursor: (
    dr: number,
    dc: number
  ) => void
  submitKeyboardCursor: () => void
  renderInteraction: () => void
  onSelectCell: (
    cell: CellRC
  ) => void | Promise<void>
  setKeyboardCursor: (cell: CellRC) => void
  clearPointerPreview: () => void
  setPointerPreviewTarget: (cell: CellRC) => void
  /** Если не было drag-commit в соседнюю клетку — сбросить превью цели (как в bootstrap). */
  onPointerUpWithoutDragCommit: () => void
}): Match3InputController {
  let dragPointerId: number | null = null
  let dragStartCell: CellRC | null = null
  let dragPreviewCell: CellRC | null = null
  let dragStartX = 0
  let dragStartY = 0
  const pressedKeys = new Set<string>()

  const clearDragState = () => {
    dragPointerId = null
    dragStartCell = null
    dragPreviewCell = null
    dragStartX = 0
    dragStartY = 0
  }

  const onPointerDown = (ev: PointerEvent) => {
    if (!params.pointerGuard()) return
    params.ensureAudio()
    params.canvas.focus()
    dragPointerId = ev.pointerId
    dragStartX = ev.clientX
    dragStartY = ev.clientY
    dragStartCell = pickCellAt(
      params.getBoard(),
      params.canvas,
      ev
    )
    if (dragStartCell) {
      params.setKeyboardCursor(dragStartCell)
    }
    if (params.canvas.setPointerCapture) {
      params.canvas.setPointerCapture(
        ev.pointerId
      )
    }
    params.onPointerDownPick(ev)
  }

  const onPointerMove = (ev: PointerEvent) => {
    if (
      dragPointerId === null ||
      ev.pointerId !== dragPointerId
    ) {
      return
    }
    if (
      !params.pointerGuard() ||
      !dragStartCell
    ) {
      return
    }

    const dx = ev.clientX - dragStartX
    const dy = ev.clientY - dragStartY
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    const distance = Math.hypot(dx, dy)
    if (distance < params.dragThresholdPx) {
      if (dragPreviewCell) {
        dragPreviewCell = null
        params.clearPointerPreview()
      }
      return
    }

    const board = params.getBoard()
    const rows = board.length
    const cols =
      rows > 0 ? board[0]?.length ?? 0 : 0
    if (rows === 0 || cols === 0) return

    const preferHorizontal = absDx >= absDy
    const target: CellRC = preferHorizontal
      ? {
          r: dragStartCell.r,
          c: Math.max(
            0,
            Math.min(
              cols - 1,
              dragStartCell.c + (dx > 0 ? 1 : -1)
            )
          ),
        }
      : {
          r: Math.max(
            0,
            Math.min(
              rows - 1,
              dragStartCell.r + (dy > 0 ? 1 : -1)
            )
          ),
          c: dragStartCell.c,
        }

    if (
      target.r === dragStartCell.r &&
      target.c === dragStartCell.c
    ) {
      return
    }

    if (
      dragPreviewCell &&
      dragPreviewCell.r === target.r &&
      dragPreviewCell.c === target.c
    ) {
      return
    }

    dragPreviewCell = target
    params.setPointerPreviewTarget(target)
  }

  const onPointerUpOrCancel = (
    ev: PointerEvent
  ) => {
    const isTrackedPointer =
      dragPointerId !== null &&
      ev.pointerId === dragPointerId
    const previewTarget = dragPreviewCell
    if (
      isTrackedPointer &&
      params.canvas.releasePointerCapture
    ) {
      try {
        params.canvas.releasePointerCapture(
          ev.pointerId
        )
      } catch {
        // ignore release errors if capture was already lost
      }
    }
    clearDragState()
    if (
      isTrackedPointer &&
      ev.type === 'pointerup' &&
      previewTarget
    ) {
      void params.onSelectCell(previewTarget)
    } else {
      params.onPointerUpWithoutDragCommit()
    }
  }

  const onKeyDown = (ev: KeyboardEvent) => {
    if (!params.keyboardGuard()) return
    params.markActivity()
    const code = ev.code
    if (pressedKeys.has(code)) return
    pressedKeys.add(code)

    if (code === 'ArrowUp' || code === 'KeyW') {
      ev.preventDefault()
      params.moveKeyboardCursor(-1, 0)
      return
    }
    if (code === 'ArrowDown' || code === 'KeyS') {
      ev.preventDefault()
      params.moveKeyboardCursor(1, 0)
      return
    }
    if (code === 'ArrowLeft' || code === 'KeyA') {
      ev.preventDefault()
      params.moveKeyboardCursor(0, -1)
      return
    }
    if (
      code === 'ArrowRight' ||
      code === 'KeyD'
    ) {
      ev.preventDefault()
      params.moveKeyboardCursor(0, 1)
      return
    }
    if (code === 'Enter' || code === 'Space') {
      ev.preventDefault()
      params.ensureAudio()
      params.submitKeyboardCursor()
    }
  }

  const onKeyUp = (ev: KeyboardEvent) => {
    pressedKeys.delete(ev.code)
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUpOrCancel,
    onKeyDown,
    onKeyUp,
    clearDragState,
    clearPressedKeys: () => {
      pressedKeys.clear()
    },
  }
}
