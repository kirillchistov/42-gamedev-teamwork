/**
 * 6.1.6 Спец-фишки:
 * cell.ts - модуль клеток
 * кодирование спец-фишек в текущей числовой модели поля
 * типы: line (горизонтальная/вертикальная зачистка), bomb (зачистка 3x3)
 */

export type LineOrientation = 'row' | 'col'
export type SpecialType = 'line' | 'bomb'

const LINE_ROW_BASE = 100
const LINE_COL_BASE = 200
const BOMB_BASE = 300
const KIND_RANGE = 100

export function isEmptyCell(
  value: number
): boolean {
  return value < 0
}

export function getCellKind(
  value: number
): number {
  if (value < 0) return -1
  return value % KIND_RANGE
}

export function getSpecialType(
  value: number
): SpecialType | null {
  if (value >= BOMB_BASE) return 'bomb'
  if (value >= LINE_COL_BASE) return 'line'
  if (value >= LINE_ROW_BASE) return 'line'
  return null
}

export function getLineOrientation(
  value: number
): LineOrientation | null {
  if (value >= LINE_COL_BASE && value < BOMB_BASE)
    return 'col'
  if (
    value >= LINE_ROW_BASE &&
    value < LINE_COL_BASE
  )
    return 'row'
  return null
}

export function isSpecialCell(
  value: number
): boolean {
  return getSpecialType(value) !== null
}

export function encodeLineCell(
  kind: number,
  orientation: LineOrientation
): number {
  const safeKind = Math.max(0, Math.floor(kind))
  return (
    (orientation === 'row'
      ? LINE_ROW_BASE
      : LINE_COL_BASE) + safeKind
  )
}

export function encodeBombCell(
  kind: number
): number {
  const safeKind = Math.max(0, Math.floor(kind))
  return BOMB_BASE + safeKind
}
