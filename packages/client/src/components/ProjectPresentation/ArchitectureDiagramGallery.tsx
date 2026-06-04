import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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

function isFullscreenShortcut(e: KeyboardEvent): boolean {
  const key = e.key.toLowerCase()
  if (key !== 'f') return false
  return e.metaKey && !e.altKey && !e.shiftKey
}

export function ArchitectureDiagramGallery({
  onBack,
  embedded = false,
  pdfMode = false,
}: Props) {
  const [index, setIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const showIndex = pdfMode ? 0 : index
  const total = ARCHITECTURE_DIAGRAMS.length
  const diagram = ARCHITECTURE_DIAGRAMS[showIndex]

  const goPrev = useCallback(() => {
    setIndex(i => (i - 1 + total) % total)
  }, [total])

  const goNext = useCallback(() => {
    setIndex(i => (i + 1) % total)
  }, [total])

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false)
  }, [])

  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true)
  }, [])

  useEffect(() => {
    if (pdfMode || !isFullscreen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isFullscreen, pdfMode])

  useEffect(() => {
    if (pdfMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault()
        e.stopPropagation()
        exitFullscreen()
        return
      }
      if (isFullscreenShortcut(e)) {
        e.preventDefault()
        e.stopPropagation()
        if (!isFullscreen) enterFullscreen()
        return
      }
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
  }, [goPrev, goNext, pdfMode, isFullscreen, enterFullscreen, exitFullscreen])

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
          <button
            type="button"
            className="presentation-btn presentation-btn--ghost presentation-diagram-gallery__fullscreen-btn"
            onClick={enterFullscreen}
            title="Полный экран (⌘F)">
            На весь экран ⌘F
          </button>
        </div>
      ) : (
        <div className="presentation-diagram-gallery__toolbar presentation-diagram-gallery__toolbar--embedded">
          <span className="presentation-diagram-gallery__counter">
            {showIndex + 1} / {total}
          </span>
          <button
            type="button"
            className="presentation-btn presentation-btn--ghost presentation-diagram-gallery__fullscreen-btn"
            onClick={enterFullscreen}
            title="Полный экран (⌘F)">
            На весь экран ⌘F
          </button>
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

      {!pdfMode && isFullscreen
        ? createPortal(
            <div
              className="presentation-diagram-fullscreen"
              role="dialog"
              aria-modal="true"
              aria-label={`Схема: ${diagram.title}`}
              onTouchStart={onGalleryTouchStart}
              onTouchEnd={onGalleryTouchEnd}>
              <div className="presentation-diagram-fullscreen__bar">
                <span className="presentation-diagram-fullscreen__counter">
                  {showIndex + 1} / {total}
                </span>
                <p className="presentation-diagram-fullscreen__hint">
                  Esc — выход · ← → — другая схема
                </p>
                <button
                  type="button"
                  className="presentation-btn presentation-btn--ghost presentation-diagram-fullscreen__close"
                  onClick={exitFullscreen}
                  aria-label="Выйти из полноэкранного режима">
                  Esc — закрыть
                </button>
              </div>
              <figure className="presentation-diagram-fullscreen__figure">
                <figcaption className="presentation-diagram-fullscreen__caption">
                  {diagram.title}
                </figcaption>
                <img
                  key={diagram.file}
                  src={architectureDiagramUrl(diagram.file)}
                  alt={diagram.alt}
                  className="presentation-diagram-fullscreen__img"
                />
              </figure>
              <div
                className="presentation-diagram-fullscreen__nav"
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
                        i === index &&
                          'presentation-diagram-gallery__tab--active'
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
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
