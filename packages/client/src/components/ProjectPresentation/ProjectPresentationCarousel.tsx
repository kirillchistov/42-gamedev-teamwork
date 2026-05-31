import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

import {
  SlideChallenges,
  SlideGame,
  SlideLearning,
  SlideStack,
  SlideTeam,
} from './PresentationSlides'
import './ProjectPresentation.pcss'

const SLIDES = [
  { id: 'team', title: 'Команда и роли' },
  { id: 'stack', title: 'Технологический стек' },
  { id: 'game', title: 'Презентация игры' },
  { id: 'challenges', title: 'Сложности и решения' },
  { id: 'learning', title: 'Главное из обучения' },
] as const

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
}

function SlideBody({
  slideId,
  onClose,
}: {
  slideId: typeof SLIDES[number]['id']
  onClose: () => void
}) {
  switch (slideId) {
    case 'team':
      return <SlideTeam />
    case 'stack':
      return <SlideStack />
    case 'game':
      return <SlideGame onClose={onClose} />
    case 'challenges':
      return <SlideChallenges />
    case 'learning':
      return <SlideLearning />
    default:
      return null
  }
}

export function ProjectPresentationCarousel({ open, onOpenChange }: Props) {
  const [index, setIndex] = useState(0)
  const total = SLIDES.length
  const slide = SLIDES[index]

  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  const goPrev = useCallback(() => {
    setIndex(i => (i - 1 + total) % total)
  }, [total])

  const goNext = useCallback(() => {
    setIndex(i => (i + 1) % total)
  }, [total])

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
    if (open) setIndex(0)
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="match3-presentation-fullscreen"
      role="dialog"
      aria-modal="true"
      aria-label="Презентация проекта Cosmic Match">
      <button
        type="button"
        className="match3-presentation-fullscreen__close"
        onClick={close}>
        Закрыть
      </button>

      <button
        type="button"
        className="match3-presentation-fullscreen__nav match3-presentation-fullscreen__nav--prev"
        onClick={goPrev}
        aria-label="Предыдущий слайд">
        <ChevronLeft />
      </button>

      <div className="match3-presentation-fullscreen__content">
        <span className="match3-presentation-fullscreen__counter">
          Презентация · ~7 мин · {index + 1} / {total}
        </span>
        <h2>{slide.title}</h2>
        <div className="match3-presentation-fullscreen__body">
          <SlideBody slideId={slide.id} onClose={close} />
        </div>
        <div
          className="match3-presentation__dots match3-presentation-fullscreen__dots"
          role="tablist">
          {SLIDES.map((s, i) => (
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
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        className="match3-presentation-fullscreen__nav match3-presentation-fullscreen__nav--next"
        onClick={goNext}
        aria-label="Следующий слайд">
        <ChevronRight />
      </button>
    </div>,
    document.body
  )
}
