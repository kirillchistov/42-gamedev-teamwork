import React, { useState, type CSSProperties } from 'react'

import { TEAM_MEMBERS } from '../Landing/teamData'
import { appRouteUrl } from '../../utils/publicAssetUrl'
import { useSelector } from '../../store'
import { selectUser } from '../../slices/userSlice'
import {
  CHALLENGES,
  CLIENT_STACK,
  LEARNING_GALAXY,
  SERVER_STACK,
  techIconUrl,
} from './presentationData'
import { ArchitectureDiagramGallery } from './ArchitectureDiagramGallery'
import { PresentationGameBoardPreview } from './PresentationGameBoardPreview'

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
  return (
    <div
      className={
        size === 'lg'
          ? 'team-card__avatar presentation-team__avatar presentation-team__avatar--lg'
          : 'team-card__avatar presentation-team__avatar'
      }
      style={
        avatarUrl
          ? {
              backgroundImage: `url(${avatarUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
      role="img"
      aria-label={name}
    />
  )
}

export function SlideTeam() {
  return (
    <div className="presentation-slide presentation-slide--team">
      <ul className="presentation-team__list">
        {TEAM_MEMBERS.map(member => (
          <li key={member.name} className="presentation-team__item">
            <TeamAvatar
              avatarUrl={member.avatarUrl}
              name={member.name}
              size="lg"
            />
            <div className="presentation-team__main">
              <p
                className="presentation-team__title"
                title={`${member.name} / ${member.role}`}>
                <span className="presentation-team__name">{member.name}</span>
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

export function SlideStack() {
  const [showDiagram, setShowDiagram] = useState(false)

  return (
    <div className="presentation-slide presentation-slide--stack">
      <div
        className={
          showDiagram
            ? 'presentation-stack__swap presentation-stack__swap--diagram'
            : 'presentation-stack__swap presentation-stack__swap--list'
        }>
        {!showDiagram ? (
          <>
            <div className="presentation-stack__columns">
              <StackColumn title="Клиент" items={CLIENT_STACK} />
              <StackColumn title="Сервер" items={SERVER_STACK} />
            </div>
            <div className="presentation-slide__actions">
              <button
                type="button"
                className="presentation-btn presentation-btn--primary"
                onClick={() => setShowDiagram(true)}>
                Блок-схемы
              </button>
            </div>
          </>
        ) : (
          <ArchitectureDiagramGallery onBack={() => setShowDiagram(false)} />
        )}
      </div>
    </div>
  )
}

export function SlideGame() {
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
      <PresentationGameBoardPreview onOpen={openGame} />
      <div className="presentation-slide__actions presentation-slide__actions--center">
        <button
          type="button"
          className="presentation-btn presentation-btn--primary"
          onClick={openGame}>
          {user ? 'Запустить игру' : 'Войти в игру'}
        </button>
      </div>
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
  const active =
    LEARNING_GALAXY.find(s => s.id === activeId) ?? LEARNING_GALAXY[0]

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
                activeId === star.id ||
                (activeId == null && star.id === active.id)
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
              activeId === star.id ||
              (activeId == null && star.id === active.id)
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

        <p className="presentation-galaxy__thanks">СПАСИБО</p>
      </div>

      <div className="presentation-galaxy__detail presentation-panel">
        <p>{active.text}</p>
        <ul className="presentation-galaxy__detail-planets">
          {active.planets.map(p => (
            <li key={p.label}>{p.label}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
