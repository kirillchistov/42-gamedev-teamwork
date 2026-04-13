// Главный блок лендинга с заголовком, описанием и кнопками
// client/src/components/Landing/Hero.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from '../../store'
import { selectUser } from '../../slices/userSlice'

const BOARD_ROWS = 6
const BOARD_COLS = 6

const GEM_COLORS = [
  'hero-board__gem--blue',
  'hero-board__gem--pink',
  'hero-board__gem--green',
  'hero-board__gem--amber',
]

const isMatchCell = (row: number, col: number) =>
  (row === 2 && col >= 1 && col <= 3) ||
  (col === 4 && row >= 1 && row <= 3)

const getGemColorClass = (
  row: number,
  col: number
) => {
  const idx =
    (row * BOARD_COLS + col) % GEM_COLORS.length
  return GEM_COLORS[idx]
}

export const Hero: React.FC = () => {
  const user = useSelector(selectUser)
  const ctaLink = user ? '/profile' : '/signup'
  const ctaText = user
    ? 'Профиль'
    : 'Зарегистрироваться'

  return (
    <section className="hero" id="top-hero">
      <div className="hero__text">
        <h1>
          Cosmic Match: match‑3 с прогрессией и
          живыми событиями
        </h1>
        <p>
          Уже сейчас в браузере доступны уровни,
          цели и комбо‑каскады. В ближайших
          итерациях добавим игру по ходам,
          расширенные цели, бустеры и мета‑слой с
          персонажем и историей.
        </p>
        <div className="hero__actions">
          <Link
            className="btn btn--primary"
            to="/game">
            Перейти к игре
          </Link>
          <Link
            className="btn btn--outline"
            to={ctaLink}>
            {ctaText}
          </Link>
        </div>
      </div>

      <div className="hero__visual">
        <div className="hero-board">
          {Array.from({ length: BOARD_ROWS }).map(
            (_, row) => (
              <div
                className="hero-board__row"
                key={row}>
                {Array.from({
                  length: BOARD_COLS,
                }).map((__, col) => {
                  const isMatch = isMatchCell(
                    row,
                    col
                  )
                  const gemColorClass =
                    getGemColorClass(row, col)
                  return (
                    <div
                      key={col}
                      className={
                        'hero-board__cell' +
                        (isMatch
                          ? ' hero-board__cell--match'
                          : '')
                      }>
                      <div
                        className={
                          'hero-board__gem ' +
                          gemColorClass +
                          (isMatch
                            ? ' hero-board__gem--pulse'
                            : '')
                        }
                      />
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* пара неоновых вспышек поверх доски */}
          <div className="hero-board__flash hero-board__flash--one" />
          <div className="hero-board__flash hero-board__flash--two" />
          <div className="hero-board__combo-burst" />
          <div className="hero-board__combo-line hero-board__combo-line--h" />
          <div className="hero-board__combo-line hero-board__combo-line--v" />
          <div className="hero-board__combo-tag">
            MEGA COMBO x8
          </div>
          <div className="hero-board__effect" />
        </div>
      </div>
    </section>
  )
}

export default Hero
