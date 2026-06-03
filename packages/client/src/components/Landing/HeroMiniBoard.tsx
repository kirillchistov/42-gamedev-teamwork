import React from 'react'

const BOARD_ROWS = 6
const BOARD_COLS = 6

const GEM_COLORS = [
  'hero-board__gem--blue',
  'hero-board__gem--pink',
  'hero-board__gem--green',
  'hero-board__gem--amber',
]

const isMatchCell = (row: number, col: number) =>
  (row === 2 && col >= 1 && col <= 3) || (col === 4 && row >= 1 && row <= 3)

const getGemColorClass = (row: number, col: number) => {
  const idx = (row * BOARD_COLS + col) % GEM_COLORS.length
  return GEM_COLORS[idx]
}

type Props = {
  className?: string
  asButton?: boolean
  onClick?: () => void
  showPresentationHint?: boolean
  ariaLabel?: string
}

export function HeroMiniBoard({
  className,
  asButton = false,
  onClick,
  showPresentationHint = false,
  ariaLabel,
}: Props) {
  const boardClass =
    'hero-board' +
    (asButton ? ' hero-board--presentation' : '') +
    (className ? ` ${className}` : '')

  const cells = Array.from({ length: BOARD_ROWS }).map((_, row) => (
    <div className="hero-board__row" key={row}>
      {Array.from({ length: BOARD_COLS }).map((__, col) => {
        const isMatch = isMatchCell(row, col)
        const gemColorClass = getGemColorClass(row, col)
        return (
          <div
            key={col}
            className={
              'hero-board__cell' + (isMatch ? ' hero-board__cell--match' : '')
            }>
            <div
              className={
                'hero-board__gem ' +
                gemColorClass +
                (isMatch ? ' hero-board__gem--pulse' : '')
              }
            />
          </div>
        )
      })}
    </div>
  ))

  const effects = (
    <>
      <div className="hero-board__flash hero-board__flash--one" />
      <div className="hero-board__flash hero-board__flash--two" />
      <div className="hero-board__combo-burst" />
      <div className="hero-board__combo-line hero-board__combo-line--h" />
      <div className="hero-board__combo-line hero-board__combo-line--v" />
      <div className="hero-board__combo-tag">MEGA COMBO x8</div>
      <div className="hero-board__effect" />
      {showPresentationHint ? (
        <span className="hero-board__presentation-hint">
          Презентация проекта
        </span>
      ) : null}
    </>
  )

  if (asButton) {
    return (
      <button
        type="button"
        className={boardClass}
        onClick={onClick}
        aria-label={ariaLabel ?? 'Открыть презентацию проекта'}>
        {cells}
        {effects}
      </button>
    )
  }

  return (
    <div className={boardClass} role="img" aria-label={ariaLabel}>
      {cells}
      {effects}
    </div>
  )
}
