import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

import './ProjectPresentation.pcss'

export type PresentationSlide = {
  id: string
  title: string
  body: string
}

const SLIDES: PresentationSlide[] = [
  {
    id: 'team',
    title: 'Команда и роли',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Представление команды: кто за что отвечает в проекте Cosmic Match, как распределены зоны ответственности и как устроена коммуникация внутри команды.',
  },
  {
    id: 'stack',
    title: 'Технологический стек',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. React, TypeScript, Vite, Redux Toolkit, Express SSR, React Router, Canvas для игрового поля, Web API (Fullscreen, Performance, localStorage).',
  },
  {
    id: 'game',
    title: 'Презентация игры',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Match-3 ядро, квесты, компаньоны, HUD, настройки уровня и интеграция с лидербордом и форумом.',
  },
  {
    id: 'challenges',
    title: 'Сложности и решения',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. SSR и OAuth, совместимость портов, GH Pages base path, сериализация состояния Redux, адаптивный HUD.',
  },
  {
    id: 'learning',
    title: 'Главное из обучения',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Разделение UI и runtime, тестирование, документация по Web API и монетизации, итеративная доставка фич без поломки core-loop.',
  },
]

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 18l-6-6 6-6"
      />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 18l6-6-6 6"
      />
    </svg>
  )
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
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
      aria-label="Презентация проекта, около 7 минут">
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
        <p>{slide.body}</p>
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
