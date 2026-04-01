/**
 * refill.ts заполняет пустые клетки (-1) новыми случайными фишками.
 * Для каждой вставки есть несколько попыток, чтобы не создать мгновенный матч прямо на рефилле.
 * Это делает динамику партии более предсказуемой и уменьшает «бесплатные» каскады.
 * Модуль вызывается сразу после collapse на каждом проходе резолва.
 */
import type { Board } from './grid'

function randInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive)
}

function wouldFormMatch(
  board: Board,
  r: number,
  c: number,
  v: number
): boolean {
  //  По вертикали: проверяем две налево
  const a = board[r]?.[c - 1]
  const b = board[r]?.[c - 2]
  if (a === v && b === v) return true

  // По вертикали: проверяем две вверх
  const x = board[r - 1]?.[c]
  const y = board[r - 2]?.[c]
  if (x === v && y === v) return true

  return false
}

/**
 * Заполняем пустые ячейки (-1) рандомными фишками
 * Стараемся не выдать сразу готовую 3+ комбинацию
 */
export function refill(
  board: Board,
  kinds: number
): void {
  if (!Number.isInteger(kinds) || kinds <= 1)
    throw new Error(
      'kinds must be an integer > 1'
    )

  const rows = board.length
  const cols =
    rows > 0 ? board[0]?.length ?? 0 : 0
  if (rows === 0 || cols === 0) return

  const MAX_ATTEMPTS = Math.max(8, kinds * 2)

  for (let r = 0; r < rows; r += 1) {
    const row = board[r]
    if (!row) continue
    for (let c = 0; c < cols; c += 1) {
      if (row[c] !== -1) continue

      let candidate = randInt(kinds)
      let attempts = 0
      while (
        attempts < MAX_ATTEMPTS &&
        wouldFormMatch(board, r, c, candidate)
      ) {
        candidate = randInt(kinds)
        attempts += 1
      }

      // По умолчанию: ищем неподходящий тип фишки
      if (
        wouldFormMatch(board, r, c, candidate)
      ) {
        for (let k = 0; k < kinds; k += 1) {
          if (!wouldFormMatch(board, r, c, k)) {
            candidate = k
            break
          }
        }
      }

      row[c] = candidate
    }
  }
}
