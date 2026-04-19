import React from 'react'
import type { BoardFieldThemeOption } from './engine/config'
import { MATCH3_FOOD_ICON_URLS } from './engine/match3FoodIconUrls'
import { MATCH3_TECH_ICON_URLS } from './engine/match3TechIconUrls'
import { HIEROGLYPH_DECK } from './hieroglyphData'

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
  if (theme === 'space') return null
  const n = PREVIEW_ROWS * PREVIEW_COLS
  if (theme === 'hieroglyph') {
    return (
      <div className="match3-page__field-preview-wrap">
        <div
          className="match3-page__field-preview match3-page__field-preview--hiero"
          role="img"
          aria-label="Предпросмотр поля в теме «Иероглиф»">
          {Array.from({ length: n }, (_, i) => (
            <div
              key={i}
              className="match3-page__field-preview-cell match3-page__field-preview-cell--hiero">
              <span className="match3-page__field-preview-hanzi">
                {
                  HIEROGLYPH_DECK[
                    i % HIEROGLYPH_DECK.length
                  ]?.hanzi
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  const icons =
    theme === 'food'
      ? MATCH3_FOOD_ICON_URLS
      : MATCH3_TECH_ICON_URLS
  const previewTitle =
    theme === 'food'
      ? 'Предпросмотр поля в теме «Еда»'
      : 'Предпросмотр поля в теме «Кодер»'
  return (
    <div className="match3-page__field-preview-wrap">
      <div
        className="match3-page__field-preview"
        role="img"
        aria-label={previewTitle}>
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
