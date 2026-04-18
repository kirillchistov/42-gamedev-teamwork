import React from 'react'
import type { BoardFieldThemeOption } from './engine/config'
import { MATCH3_FOOD_ICON_URLS } from './engine/match3FoodIconUrls'

const PREVIEW_ROWS = 4
const PREVIEW_COLS = 6

type BoardFieldThemePreviewProps = {
  theme: BoardFieldThemeOption
}

/**
 * Мини-сетка в настройках: для «Еды» показываем те же иконки, что на поле.
 */
export const BoardFieldThemePreview: React.FC<
  BoardFieldThemePreviewProps
> = ({ theme }) => {
  if (theme !== 'food') return null
  const n = PREVIEW_ROWS * PREVIEW_COLS
  const icons = MATCH3_FOOD_ICON_URLS
  return (
    <div className="match3-page__field-preview-wrap">
      <div
        className="match3-page__field-preview"
        role="img"
        aria-label="Предпросмотр поля в теме «Еда»">
        {Array.from({ length: n }, (_, i) => (
          <div
            key={i}
            className="match3-page__field-preview-cell">
            <img
              src={icons[i % icons.length]}
              alt=""
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
