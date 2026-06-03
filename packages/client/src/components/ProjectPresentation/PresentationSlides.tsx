import React, { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'

import { HeroMiniBoard } from '../Landing/HeroMiniBoard'
import { HeroVisualOrbit } from '../Landing/HeroVisualOrbit'
import { TEAM_MEMBERS } from '../Landing/teamData'
import {
  COSMIC_MATCH_LOGO_URL,
  GITHUB_MARK_WHITE_URL,
} from '../../shared/brandAssets'
import { appRouteUrl } from '../../utils/publicAssetUrl'
import { useSelector } from '../../store'
import { selectUser } from '../../slices/userSlice'
import {
  CHALLENGES,
  CLIENT_STACK,
  LEARNING_FEEDBACK_DEFAULT,
  LEARNING_GALAXY,
  PRESENTATION_GAME_QR_URL,
  PRESENTATION_QR_URL,
  SERVER_STACK,
  techIconUrl,
} from './presentationData'
import { ArchitectureDiagramGallery } from './ArchitectureDiagramGallery'
import { PresentationGameBoardPreview } from './PresentationGameBoardPreview'
import type { PresentationSlideId } from './presentationSlidesConfig'

function TeamTaskTag({ label }: { label: string }) {
  const space = label.indexOf(' ')
  const firstWord = space > 0 ? label.slice(0, space) : label
  const hasMore = space > 0

  return (
    <li className="presentation-team__tag" title={label}>
      <span className="presentation-team__tag-text">
        <span className="presentation-team__tag-first">{firstWord}</span>
        {hasMore ? (
          <span className="presentation-team__tag-more" aria-hidden>
            …
          </span>
        ) : null}
      </span>
    </li>
  )
}

function TeamAvatar({
  avatarUrl,
  name,
  size = 'md',
}: {
  avatarUrl?: string
  name: string
  size?: 'md' | 'lg'
}) {
  const className =
    size === 'lg'
      ? 'team-card__avatar presentation-team__avatar presentation-team__avatar--lg'
      : 'team-card__avatar presentation-team__avatar'

  if (avatarUrl) {
    return (
      <div className={className} role="img" aria-label={name}>
        <img
          src={avatarUrl}
          alt=""
          className="presentation-team__avatar-img"
          width={size === 'lg' ? 44 : 36}
          height={size === 'lg' ? 44 : 36}
          crossOrigin="anonymous"
          decoding="async"
        />
      </div>
    )
  }

  return <div className={className} role="img" aria-label={name} />
}

export function SlideTeam() {
  return (
    <div className="presentation-slide presentation-slide--team">
      <ul className="presentation-team__list">
        {TEAM_MEMBERS.map(member => (
          <li key={member.name} className="presentation-team__item">
            {member.backlogUrl ? (
              <a
                className="presentation-team__backlog"
                href={member.backlogUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Бэклог GitHub Projects: ${member.name}`}
                title="Бэклог в GitHub Projects">
                <img
                  src={GITHUB_MARK_WHITE_URL}
                  alt=""
                  width={20}
                  height={20}
                  className="presentation-team__backlog-icon"
                />
              </a>
            ) : null}
            {member.githubUrl ? (
              <a
                className="presentation-team__avatar-link"
                href={member.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`GitHub: ${member.name}`}>
                <TeamAvatar
                  avatarUrl={member.avatarUrl}
                  name={member.name}
                  size="lg"
                />
              </a>
            ) : (
              <TeamAvatar
                avatarUrl={member.avatarUrl}
                name={member.name}
                size="lg"
              />
            )}
            <div className="presentation-team__main">
              <p
                className="presentation-team__title"
                title={`${member.name} / ${member.role}`}>
                {member.githubUrl ? (
                  <a
                    className="presentation-team__name presentation-team__link"
                    href={member.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer">
                    {member.name}
                  </a>
                ) : (
                  <span className="presentation-team__name">{member.name}</span>
                )}
                <span className="presentation-team__sep"> / </span>
                <span className="presentation-team__role">{member.role}</span>
              </p>
            </div>
            <ul className="presentation-team__tasks">
              {member.responsibilities.map(task => (
                <TeamTaskTag key={task} label={task} />
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

function planetPosition(
  starX: number,
  starY: number,
  planet: { angleDeg: number; radiusPct: number }
): CSSProperties {
  const rad = (planet.angleDeg * Math.PI) / 180
  const left = starX + planet.radiusPct * Math.cos(rad)
  const top = starY + planet.radiusPct * Math.sin(rad)
  return { left: `${left}%`, top: `${top}%` }
}

function StackColumn({
  title,
  items,
}: {
  title: string
  items: ReadonlyArray<{ label: string; icon: string | null }>
}) {
  return (
    <div className="presentation-stack__column presentation-panel">
      <h3>{title}</h3>
      <ul className="presentation-stack__list">
        {items.map(item => (
          <li key={item.label}>
            {item.icon ? (
              <img
                src={techIconUrl(item.icon)}
                alt=""
                className="presentation-stack__icon"
                width={22}
                height={22}
              />
            ) : (
              <span className="presentation-stack__icon presentation-stack__icon--placeholder" />
            )}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SlideTitle({ pdfMode = false }: { pdfMode?: boolean }) {
  const user = useSelector(selectUser)
  const ctaLink = user ? '/presentation' : '/signup'
  const ctaText = user ? 'О проекте' : 'Зарегистрироваться'

  return (
    <section
      className="hero presentation-slide presentation-slide--title"
      id="top-hero">
      <div className="hero__text presentation-title__text">
        <div className="presentation-title__brand">
          <img
            src={COSMIC_MATCH_LOGO_URL}
            alt=""
            className="presentation-title__logo"
            width={50}
            height={50}
          />
          <h1>Cosmic Match с живой прогрессией</h1>
        </div>
        <div className="presentation-title__copy">
          <p>
            Уровни, цели и комбо‑каскады. Широкий выбор игровых и визуальных
            настроек. Выбирай своего персонажа и делай историю вместе с ним!
          </p>
          <div className="hero__actions presentation-title__actions">
            {pdfMode ? (
              <>
                <span className="btn btn--primary">Играть</span>
                <span className="btn btn--outline">{ctaText}</span>
              </>
            ) : (
              <>
                <Link className="btn btn--primary" to="/game">
                  Играть
                </Link>
                <Link className="btn btn--outline" to={ctaLink}>
                  {ctaText}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="hero__visual presentation-title__visual">
        <HeroVisualOrbit>
          <HeroMiniBoard ariaLabel="Превью игрового поля Cosmic Match" />
        </HeroVisualOrbit>
      </div>
    </section>
  )
}

export function SlideStack() {
  return (
    <div className="presentation-slide presentation-slide--stack">
      <div className="presentation-stack__columns">
        <StackColumn title="Клиент" items={CLIENT_STACK} />
        <StackColumn title="Сервер" items={SERVER_STACK} />
      </div>
    </div>
  )
}

export function SlideDiagrams({ pdfMode = false }: { pdfMode?: boolean }) {
  return (
    <div className="presentation-slide presentation-slide--diagrams">
      <ArchitectureDiagramGallery embedded pdfMode={pdfMode} />
    </div>
  )
}

export function SlideGame({ pdfMode = false }: { pdfMode?: boolean }) {
  const user = useSelector(selectUser)

  const openGame = () => {
    const path = user ? '/game/start' : '/login'
    window.open(appRouteUrl(path), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="presentation-slide presentation-slide--game">
      <p className="presentation-game__lead">
        Cosmic Match‑3 с космическими квестами и тонкой настройкой.
      </p>
      {pdfMode ? (
        <figure
          className="presentation-game__qr"
          aria-label="QR-код для перехода в игру">
          <img
            src={PRESENTATION_GAME_QR_URL}
            alt="QR-код игры Cosmic Match"
            width={200}
            height={200}
          />
          <figcaption>Откройте игру по QR-коду</figcaption>
        </figure>
      ) : (
        <PresentationGameBoardPreview onOpen={openGame} />
      )}
      {!pdfMode ? (
        <div className="presentation-slide__actions presentation-slide__actions--center">
          <button
            type="button"
            className="presentation-btn presentation-btn--primary"
            onClick={openGame}>
            {user ? 'Запустить игру' : 'Войти в игру'}
          </button>
        </div>
      ) : null}
      {/* <p className="presentation-slide__note">
        Игра откроется в новой вкладке (после логина).
      </p> */}
    </div>
  )
}

export function SlideChallenges() {
  return (
    <div className="presentation-slide presentation-slide--challenges">
      <ul className="presentation-challenges">
        {CHALLENGES.map(item => (
          <li
            key={item.id}
            className="presentation-challenges__item presentation-panel">
            <img
              src={item.image}
              alt=""
              className="presentation-challenges__art"
              width={56}
              height={56}
            />
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SlideLearning() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = activeId ? LEARNING_GALAXY.find(s => s.id === activeId) : null
  const detailText = active?.text ?? LEARNING_FEEDBACK_DEFAULT.text
  const detailPlanets = active
    ? active.planets.map(p => p.label)
    : [...LEARNING_FEEDBACK_DEFAULT.planets]

  const isStarLit = (starId: string) => activeId === starId

  return (
    <div className="presentation-slide presentation-slide--learning">
      <div
        className="presentation-galaxy"
        role="img"
        aria-label="Галактика выводов">
        <div className="presentation-galaxy__sky" aria-hidden>
          {Array.from({ length: 48 }, (_, i) => (
            <span
              key={i}
              className="presentation-galaxy__dust"
              style={
                {
                  ['--i' as string]: String(i),
                  left: `${(i * 17) % 100}%`,
                  top: `${(i * 23) % 100}%`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="presentation-galaxy__core" aria-hidden />
        <div
          className="presentation-galaxy__arm presentation-galaxy__arm--a"
          aria-hidden
        />
        <div
          className="presentation-galaxy__arm presentation-galaxy__arm--b"
          aria-hidden
        />

        {LEARNING_GALAXY.map(star =>
          star.planets.map(planet => (
            <span
              key={`${star.id}-${planet.label}`}
              className={
                isStarLit(star.id)
                  ? 'presentation-galaxy__planet presentation-galaxy__planet--lit'
                  : 'presentation-galaxy__planet'
              }
              style={planetPosition(star.x, star.y, planet)}
              title={planet.label}>
              <span className="presentation-galaxy__planet-body" aria-hidden />
              <span className="presentation-galaxy__planet-label">
                {planet.label}
              </span>
            </span>
          ))
        )}

        {LEARNING_GALAXY.map(star => (
          <button
            key={star.id}
            type="button"
            className={
              isStarLit(star.id)
                ? 'presentation-galaxy__star presentation-galaxy__star--active'
                : 'presentation-galaxy__star'
            }
            style={{ left: `${star.x}%`, top: `${star.y}%` }}
            onClick={() => setActiveId(star.id)}
            aria-pressed={activeId === star.id}>
            <span className="presentation-galaxy__star-glow" aria-hidden />
            <span className="presentation-galaxy__star-core" aria-hidden />
            <span className="presentation-galaxy__star-label">
              {star.short}
            </span>
          </button>
        ))}

        <div className="presentation-galaxy__finale">
          <p className="presentation-galaxy__thanks">СПАСИБО</p>
          <figure
            className="presentation-galaxy__qr"
            aria-label="QR-код для связи">
            <img
              src={PRESENTATION_QR_URL}
              alt="QR-код для связи"
              width={88}
              height={88}
            />
            <figcaption className="presentation-galaxy__qr-caption">
              Связь
            </figcaption>
          </figure>
        </div>
      </div>

      <div className="presentation-galaxy__detail presentation-panel">
        <p>{detailText}</p>
        <ul className="presentation-galaxy__detail-planets">
          {detailPlanets.map(label => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function PresentationSlideContent({
  slideId,
  pdfMode = false,
}: {
  slideId: PresentationSlideId
  pdfMode?: boolean
}) {
  switch (slideId) {
    case 'title':
      return <SlideTitle pdfMode={pdfMode} />
    case 'team':
      return <SlideTeam />
    case 'stack':
      return <SlideStack />
    case 'diagrams':
      return <SlideDiagrams pdfMode={pdfMode} />
    case 'game':
      return <SlideGame pdfMode={pdfMode} />
    case 'challenges':
      return <SlideChallenges />
    case 'learning':
      return <SlideLearning />
    default:
      return null
  }
}
