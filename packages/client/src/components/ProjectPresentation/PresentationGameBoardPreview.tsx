import type { CSSProperties } from 'react'
import clsx from 'clsx'

import { GAME_BOARD_PREVIEW, GAME_GEM_COLORS } from './presentationData'

type Props = {
  onOpen: () => void
  className?: string
}

export function PresentationGameBoardPreview({ onOpen, className }: Props) {
  return (
    <button
      type="button"
      className={clsx('presentation-game-board', className)}
      onClick={onOpen}
      aria-label="Открыть игру в новой вкладке">
      <span className="presentation-game-board__hud">
        <span className="presentation-game-board__hud-pill">Уровень 1</span>
        <span className="presentation-game-board__hud-pill presentation-game-board__hud-pill--score">
          12 480
        </span>
      </span>
      <span className="presentation-game-board__frame">
        <span className="presentation-game-board__grid" aria-hidden>
          {GAME_BOARD_PREVIEW.map((row, r) =>
            row.map((kind, c) => (
              <span
                key={`${r}-${c}`}
                className="presentation-game-board__cell"
                style={
                  {
                    ['--gem-color' as string]:
                      kind != null ? GAME_GEM_COLORS[kind % 8] : '#1e293b',
                    ['--gem-delay' as string]: `${(r * 8 + c) * 0.07}s`,
                  } as CSSProperties
                }
              />
            ))
          )}
        </span>
        <span className="presentation-game-board__shine" aria-hidden />
      </span>
      <span className="presentation-game-board__cta">
        Нажмите, чтобы сыграть
      </span>
    </button>
  )
}
