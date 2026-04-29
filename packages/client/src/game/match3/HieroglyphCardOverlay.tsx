import React, {
  useCallback,
  useEffect,
  useId,
} from 'react'

import {
  getHieroglyphForKind,
  type HieroglyphEntry,
} from './hieroglyphData'

export type HieroglyphCardOverlayProps = {
  /** Индекс типа фишки (kind) с поля. */
  kind: number | null
  soundEnabled: boolean
  onClose: () => void
}

function speakEntry(
  entry: HieroglyphEntry,
  enabled: boolean
) {
  if (!enabled) return
  if (
    typeof window === 'undefined' ||
    !window.speechSynthesis
  ) {
    return
  }
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(
      `${entry.pinyin}. ${entry.hanzi}`
    )
    u.lang = 'zh-CN'
    u.rate = 0.82
    window.speechSynthesis.speak(u)
  } catch {
    // noop
  }
}

export const HieroglyphCardOverlay: React.FC<
  HieroglyphCardOverlayProps
> = ({ kind, soundEnabled, onClose }) => {
  const titleId = useId()
  const entry: HieroglyphEntry | null =
    kind === null
      ? null
      : getHieroglyphForKind(kind)

  useEffect(() => {
    if (!entry) return
    speakEntry(entry, soundEnabled)
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel()
      }
    }
  }, [entry, soundEnabled])

  useEffect(() => {
    if (!entry) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () =>
      window.removeEventListener('keydown', onKey)
  }, [entry, onClose])

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose]
  )

  if (!entry) return null

  return (
    <div
      className="m3-hiero-overlay"
      role="presentation"
      onMouseDown={handleBackdrop}>
      <div
        className="m3-hiero-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={e => e.stopPropagation()}>
        <button
          type="button"
          className="m3-hiero-card__close"
          aria-label="Закрыть карточку"
          onClick={onClose}>
          ×
        </button>

        <div className="m3-hiero-card__body">
          <div className="m3-hiero-card__visual">
            <svg
              className="m3-hiero-card__svg"
              viewBox="0 0 220 200"
              aria-hidden>
              <defs>
                <style>
                  {`
                  .m3-hiero-stroke {
                    fill: none;
                    stroke: #7f1d1d;
                    stroke-width: 2.4;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    stroke-dasharray: 920;
                    stroke-dashoffset: 920;
                    animation: m3HieroStroke 2.1s ease forwards;
                  }
                  .m3-hiero-fill {
                    fill: #431407;
                    opacity: 0;
                    animation: m3HieroFill 0.55s ease 1.55s forwards;
                  }
                  @keyframes m3HieroStroke {
                    to { stroke-dashoffset: 0; }
                  }
                  @keyframes m3HieroFill {
                    to { opacity: 1; }
                  }
                  @media (prefers-reduced-motion: reduce) {
                    .m3-hiero-stroke {
                      animation: none;
                      stroke-dashoffset: 0;
                    }
                    .m3-hiero-fill {
                      animation: none;
                      opacity: 1;
                    }
                  }
                `}
                </style>
              </defs>
              <text
                x="110"
                y="138"
                textAnchor="middle"
                fontSize="108"
                fontWeight="700"
                fontFamily='"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",serif'
                className="m3-hiero-stroke">
                {entry.hanzi}
              </text>
              <text
                x="110"
                y="138"
                textAnchor="middle"
                fontSize="108"
                fontWeight="700"
                fontFamily='"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",serif'
                className="m3-hiero-fill">
                {entry.hanzi}
              </text>
            </svg>
          </div>

          <div className="m3-hiero-card__meta">
            <p
              id={titleId}
              className="m3-hiero-card__pinyin">
              {entry.pinyin}
            </p>
            <p className="m3-hiero-card__meanings">
              {entry.meaningsRu.join(' · ')}
            </p>
            <p className="m3-hiero-card__section">
              Частые слова с этим знаком
            </p>
            <ul className="m3-hiero-card__examples">
              {entry.examples.map((ex, i) => (
                <li key={i}>
                  <span className="m3-hiero-card__zh">
                    {ex.zh}
                  </span>
                  <span>{ex.ru}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
