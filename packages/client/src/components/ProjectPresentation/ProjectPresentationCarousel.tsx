import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

import { exportPresentationPdf } from './presentationPdfExport'
import { PresentationSlideContent } from './PresentationSlides'
import { PRESENTATION_BG_URL } from './presentationData'
import {
  PRESENTATION_SLIDES,
  type PresentationSlideId,
} from './presentationSlidesConfig'
import './ProjectPresentation.pcss'

const SWIPE_THRESHOLD_PX = 56
const COMPACT_NAV_MAX_HEIGHT = 700
const COMPACT_NAV_MAX_WIDTH = 760
const TRACKPAD_SWIPE_THRESHOLD_PX = 90
const TRACKPAD_SWIPE_COOLDOWN_MS = 380

function ChevronLeft() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="match3-presentation-fullscreen__chevron">
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="match3-presentation-fullscreen__chevron">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSlide?: number
}

function normalizeStartIndex(
  slideNumber: number | undefined,
  total: number
): number {
  if (!Number.isFinite(slideNumber)) return 0
  const n = Math.trunc(slideNumber as number)
  if (n <= 1) return 0
  if (n >= total) return total - 1
  return n - 1
}

type SlideDotsProps = {
  index: number
  onSelect: (i: number) => void
  className?: string
}

function SlideDots({ index, onSelect, className }: SlideDotsProps) {
  return (
    <div
      className={clsx('match3-presentation__dots', className)}
      role="tablist"
      aria-label="Слайды презентации">
      {PRESENTATION_SLIDES.map((s, i) => (
        <button
          key={s.id}
          type="button"
          role="tab"
          aria-selected={i === index}
          aria-label={`Слайд ${i + 1}: ${s.title}`}
          className={clsx(
            'match3-presentation__dot',
            i === index && 'match3-presentation__dot--active'
          )}
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  )
}

export function ProjectPresentationCarousel({
  open,
  onOpenChange,
  initialSlide,
}: Props) {
  const [index, setIndex] = useState(0)
  const [compactNav, setCompactNav] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const swipeStartX = useRef<number | null>(null)
  const trackpadDeltaX = useRef(0)
  const trackpadLastSwitchAt = useRef(0)
  const total = PRESENTATION_SLIDES.length
  const slide = PRESENTATION_SLIDES[index]

  const handleDownloadPdf = useCallback(async () => {
    setPdfError(null)
    setPdfLoading(true)
    try {
      await exportPresentationPdf()
    } catch (e) {
      setPdfError(
        e instanceof Error ? e.message : 'Не удалось сформировать PDF'
      )
    } finally {
      setPdfLoading(false)
    }
  }, [])

  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  const goPrev = useCallback(() => {
    setIndex(i => (i - 1 + total) % total)
  }, [total])

  const goNext = useCallback(() => {
    setIndex(i => (i + 1) % total)
  }, [total])

  const updateCompactNav = useCallback(() => {
    const h = window.visualViewport?.height ?? window.innerHeight
    const w = window.innerWidth
    const shouldCompact =
      h <= COMPACT_NAV_MAX_HEIGHT || w <= COMPACT_NAV_MAX_WIDTH
    setCompactNav(shouldCompact)
  }, [])

  useEffect(() => {
    if (!open) return
    updateCompactNav()
    const root = rootRef.current
    const ro =
      typeof ResizeObserver !== 'undefined' && root
        ? new ResizeObserver(updateCompactNav)
        : null
    ro?.observe(root ?? document.documentElement)
    window.addEventListener('resize', updateCompactNav)
    window.visualViewport?.addEventListener('resize', updateCompactNav)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', updateCompactNav)
      window.visualViewport?.removeEventListener('resize', updateCompactNav)
    }
  }, [open, updateCompactNav])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close, goPrev, goNext])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setIndex(normalizeStartIndex(initialSlide, total))
  }, [open, initialSlide, total])

  const onSwipeTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest(
        '.presentation-diagram-gallery, .presentation-diagram-gallery__tabs, .presentation-diagram-gallery__tab'
      )
    ) {
      swipeStartX.current = null
      return
    }
    swipeStartX.current = e.touches[0]?.clientX ?? null
  }

  const onSwipeTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current == null) return
    const endX = e.changedTouches[0]?.clientX
    if (endX == null) return
    const dx = endX - swipeStartX.current
    swipeStartX.current = null
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return
    if (dx < 0) goNext()
    else goPrev()
  }

  const onTrackpadWheel = (e: React.WheelEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest(
        '.presentation-diagram-gallery, .presentation-diagram-gallery__tabs, .presentation-diagram-gallery__tab'
      )
    ) {
      return
    }

    const absX = Math.abs(e.deltaX)
    const absY = Math.abs(e.deltaY)
    if (absX < 2 || absX <= absY * 1.15) {
      trackpadDeltaX.current = 0
      return
    }

    const now = Date.now()
    if (now - trackpadLastSwitchAt.current < TRACKPAD_SWIPE_COOLDOWN_MS) {
      return
    }

    trackpadDeltaX.current += e.deltaX
    if (Math.abs(trackpadDeltaX.current) < TRACKPAD_SWIPE_THRESHOLD_PX) {
      return
    }

    if (trackpadDeltaX.current > 0) goNext()
    else goPrev()
    trackpadDeltaX.current = 0
    trackpadLastSwitchAt.current = now
  }

  if (!open) return null

  const counterLabel = compactNav
    ? `О проекте · ${index + 1} / ${total}`
    : `Презентация проекта Cosmic Match · ${index + 1} / ${total}`

  return createPortal(
    <div
      ref={rootRef}
      className={clsx(
        'match3-presentation-fullscreen',
        compactNav && 'match3-presentation-fullscreen--compact-nav'
      )}
      style={
        {
          ['--pres-bg-url' as string]: `url("${PRESENTATION_BG_URL}")`,
        } as CSSProperties
      }
      role="dialog"
      aria-modal="true"
      aria-label="Презентация проекта Cosmic Match">
      <div className="match3-presentation-fullscreen__topbar">
        <span className="match3-presentation-fullscreen__counter">
          {counterLabel}
        </span>

        {compactNav ? (
          <nav
            className="match3-presentation-fullscreen__header-nav"
            aria-label="Навигация по слайдам">
            <button
              type="button"
              className="match3-presentation-fullscreen__nav match3-presentation-fullscreen__nav--header"
              onClick={goPrev}
              aria-label="Предыдущий слайд">
              <ChevronLeft />
            </button>
            <SlideDots
              index={index}
              onSelect={setIndex}
              className="match3-presentation-fullscreen__dots--header"
            />
            <button
              type="button"
              className="match3-presentation-fullscreen__nav match3-presentation-fullscreen__nav--header"
              onClick={goNext}
              aria-label="Следующий слайд">
              <ChevronRight />
            </button>
          </nav>
        ) : null}

        <div className="match3-presentation-fullscreen__topbar-actions">
          <button
            type="button"
            className="match3-presentation-fullscreen__pdf"
            onClick={() => void handleDownloadPdf()}
            disabled={pdfLoading}
            aria-busy={pdfLoading}>
            {pdfLoading ? 'PDF…' : 'Скачать PDF'}
          </button>
          <button
            type="button"
            className="match3-presentation-fullscreen__close"
            onClick={close}>
            <span className="match3-presentation-fullscreen__close-label">
              Закрыть
            </span>
            <span
              className="match3-presentation-fullscreen__close-icon"
              aria-hidden>
              +
            </span>
          </button>
        </div>
      </div>
      {pdfError ? (
        <p className="match3-presentation-fullscreen__pdf-error" role="alert">
          {pdfError}
        </p>
      ) : null}

      <div
        className="match3-presentation-fullscreen__content"
        onTouchStart={onSwipeTouchStart}
        onTouchEnd={onSwipeTouchEnd}
        onWheel={onTrackpadWheel}>
        <div className="match3-presentation-fullscreen__content-inner">
          {slide.id !== 'title' ? (
            <h2 className="match3-presentation-fullscreen__title">
              {slide.title}
            </h2>
          ) : (
            <div
              className="match3-presentation-fullscreen__title match3-presentation-fullscreen__title--spacer"
              aria-hidden
            />
          )}
          <div className="match3-presentation-fullscreen__body">
            <PresentationSlideContent
              slideId={slide.id as PresentationSlideId}
            />
          </div>
          {!compactNav ? (
            <nav
              className="match3-presentation-fullscreen__footer-nav"
              aria-label="Навигация по слайдам">
              <button
                type="button"
                className="match3-presentation-fullscreen__nav match3-presentation-fullscreen__nav--inline"
                onClick={goPrev}
                aria-label="Предыдущий слайд">
                <ChevronLeft />
              </button>
              <SlideDots
                index={index}
                onSelect={setIndex}
                className="match3-presentation-fullscreen__dots match3-presentation-fullscreen__dots--footer"
              />
              <button
                type="button"
                className="match3-presentation-fullscreen__nav match3-presentation-fullscreen__nav--inline"
                onClick={goNext}
                aria-label="Следующий слайд">
                <ChevronRight />
              </button>
            </nav>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  )
}
