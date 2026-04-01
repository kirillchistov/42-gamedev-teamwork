/**
 * collapse.ts реализует «гравитацию»: после очистки все непустые клетки падают вниз.
 * Алгоритм проходит по каждому столбцу снизу вверх и сжимает значения без потери порядка.
 * Освободившиеся верхние позиции заполняются -1 и ждут шага refill.
 * Модуль не знает про очки/комбо и занимается только геометрией поля.
 */

import type { Board } from './grid'

function dims(board: Board) {
  const rows = board.length
  const cols =
    rows > 0
      ? board[0]
        ? board[0]?.length
        : 0
      : 0
  return { rows, cols }
}

function getCell(
  b: Board,
  r: number,
  c: number
): number | undefined {
  const row = b[r]
  if (!row) return undefined
  if (c < 0 || c >= row.length) return undefined
  return row[c]
}

function setCell(
  b: Board,
  r: number,
  c: number,
  v: number
): void {
  const row = b[r]
  if (!row) return
  if (c < 0 || c >= row.length) return
  row[c] = v
}

export function collapse(board: Board): void {
  const { rows, cols } = dims(board)
  if (rows === 0 || cols === 0) return

  for (let c = 0; c < cols; c++) {
    let write = rows - 1 // следующая позиция снизу

    // Спустить вниз все "живые" фишки (>=0).
    for (let r = rows - 1; r >= 0; r--) {
      const v = getCell(board, r, c)
      if (typeof v === 'number' && v >= 0) {
        if (write !== r) {
          setCell(board, write, c, v)
          setCell(board, r, c, -1)
        }
        write--
      }
    }

    // Заполнить освобожденные клетки (-1).
    for (let r = write; r >= 0; r--) {
      setCell(board, r, c, -1)
    }
  }
}
