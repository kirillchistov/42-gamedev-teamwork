import React, { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'

import {
  ARCHITECTURE_DIAGRAMS,
  architectureDiagramUrl,
} from './presentationData'

type Props = {
  onBack?: () => void
  /** Отдельный слайд презентации (без кнопки «К стеку»). */
  embedded?: boolean
  /** Упрощённый вид для экспорта в PDF. */
  pdfMode?: boolean
}

export function ArchitectureDiagramGallery({
  onBack,
  embedded = false,
  pdfMode = false,
}: Props) {
  const [index, setIndex] = useState(0)
  const showIndex = pdfMode ? 0 : index
  const total = ARCHITECTURE_DIAGRAMS.length
  const diagram = ARCHITECTURE_DIAGRAMS[showIndex]

  const goPrev = useCallback(() => {
    setIndex(i => (i - 1 + total) % total)
  }, [total])

  const goNext = useCallback(() => {
    setIndex(i => (i + 1) % total)
  }, [total])

  useEffect(() => {
    if (pdfMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.stopPropagation()
        goPrev()
      }
      if (e.key === 'ArrowRight') {
        e.stopPropagation()
        goNext()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [goPrev, goNext, pdfMode])

  const onGalleryTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return
    ;(e.currentTarget as HTMLElement).dataset.touchX = String(touch.clientX)
  }

  const onGalleryTouchEnd = (e: React.TouchEvent) => {
    const startX = Number((e.currentTarget as HTMLElement).dataset.touchX)
    if (!Number.isFinite(startX)) return
    const endX = e.changedTouches[0]?.clientX
    if (endX == null) return
    const dx = endX - startX
    if (Math.abs(dx) < 48) return
    e.stopPropagation()
    if (dx < 0) goNext()
    else goPrev()
  }

  return (
    <div
      className="presentation-diagram-gallery"
      onTouchStart={onGalleryTouchStart}
      onTouchEnd={onGalleryTouchEnd}>
      {!embedded && onBack ? (
        <div className="presentation-diagram-gallery__toolbar">
          <button
            type="button"
            className="presentation-btn presentation-btn--ghost presentation-diagram-gallery__back"
            onClick={onBack}>
            ← К стеку
          </button>
          <span className="presentation-diagram-gallery__counter">
            {showIndex + 1} / {total}
          </span>
        </div>
      ) : (
        <div className="presentation-diagram-gallery__toolbar presentation-diagram-gallery__toolbar--embedded">
          <span className="presentation-diagram-gallery__counter">
            {showIndex + 1} / {total}
          </span>
        </div>
      )}

      {/* <p className="presentation-diagram-gallery__hint">
        От общего к частному · свайп по схеме или вкладки ниже
      </p> */}

      <figure
        className="presentation-arch presentation-arch--http presentation-panel presentation-diagram-gallery__figure"
        aria-label={diagram.title}>
        <figcaption className="presentation-diagram-gallery__caption">
          {diagram.title}
        </figcaption>
        <img
          key={diagram.file}
          src={architectureDiagramUrl(diagram.file)}
          alt={diagram.alt}
          className="presentation-arch__img"
        />
      </figure>

      {!pdfMode ? (
        <div
          className="presentation-diagram-gallery__nav"
          role="group"
          aria-label="Навигация по схемам">
          <button
            type="button"
            className="presentation-diagram-gallery__arrow"
            onClick={goPrev}
            aria-label="Предыдущая схема">
            ‹
          </button>
          <div
            className="presentation-diagram-gallery__tabs"
            role="tablist"
            aria-label="Список схем">
            {ARCHITECTURE_DIAGRAMS.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                className={clsx(
                  'presentation-diagram-gallery__tab',
                  i === index && 'presentation-diagram-gallery__tab--active'
                )}
                onClick={() => setIndex(i)}
                title={item.title}>
                <span className="presentation-diagram-gallery__tab-index">
                  {i + 1}
                </span>
                <span className="presentation-diagram-gallery__tab-label">
                  {item.short}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="presentation-diagram-gallery__arrow"
            onClick={goNext}
            aria-label="Следующая схема">
            ›
          </button>
        </div>
      ) : (
        <p className="presentation-diagram-gallery__pdf-note">
          Итоговая архитектура · полный набор схем в репозитории docs/
        </p>
      )}
    </div>
  )
}
