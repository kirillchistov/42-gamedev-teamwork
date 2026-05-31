import React, { useEffect, useState } from 'react'

import { TEAM_MEMBERS } from '../Landing/teamData'
import { appRouteUrl } from '../../utils/publicAssetUrl'
import { useSelector } from '../../store'
import { selectUser } from '../../slices/userSlice'
import {
  CHALLENGES,
  CLIENT_STACK,
  HTTP_APIS_OVERVIEW_URL,
  SERVER_STACK,
  techIconUrl,
} from './presentationData'

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
            <div className="presentation-team__body">
              <h3>{member.name}</h3>
              <p className="presentation-team__role">{member.role}</p>
              <ul className="presentation-team__tasks">
                {member.responsibilities.map(task => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StackColumn({
  title,
  items,
}: {
  title: string
  items: ReadonlyArray<{ label: string; icon: string | null }>
}) {
  return (
    <div className="presentation-stack__column">
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

function ArchitectureDiagram() {
  return (
    <figure
      className="presentation-arch presentation-arch--http"
      aria-label="HTTP-слои проекта">
      <img
        src={HTTP_APIS_OVERVIEW_URL}
        alt="Схема HTTP: браузер, SSR-клиент, apiProxy, Praktikum API, forum backend и PostgreSQL"
        className="presentation-arch__img"
      />
    </figure>
  )
}

export function SlideStack() {
  const [showDiagram, setShowDiagram] = useState(false)

  useEffect(() => {
    setShowDiagram(false)
    const timer = window.setTimeout(() => setShowDiagram(true), 2000)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="presentation-slide presentation-slide--stack">
      <div
        className={
          showDiagram
            ? 'presentation-stack__swap presentation-stack__swap--diagram'
            : 'presentation-stack__swap presentation-stack__swap--list'
        }>
        {!showDiagram ? (
          <div className="presentation-stack__columns">
            <StackColumn title="Клиент" items={CLIENT_STACK} />
            <StackColumn title="Сервер" items={SERVER_STACK} />
          </div>
        ) : (
          <ArchitectureDiagram />
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
      <p>Cosmic Match — match‑3 с уровнями, квестами, HUD и пр.</p>
      <p>Лучше всего посмотреть на игру в действии.</p>
      <button type="button" className="btn btn--primary" onClick={openGame}>
        {user ? 'Открыть /game/start' : 'Войти и открыть игру'}
      </button>
      <p className="presentation-slide__note">
        Презентация останется открытой — можно продолжить листать слайды.
      </p>
    </div>
  )
}

export function SlideChallenges() {
  return (
    <div className="presentation-slide presentation-slide--challenges">
      <ul className="presentation-challenges">
        {CHALLENGES.map(item => (
          <li key={item.id} className="presentation-challenges__item">
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
  return (
    <div className="presentation-slide presentation-slide--learning">
      <ul className="presentation-learning__list">
        <li>
          Разделение UI и игрового runtime, тесты на критичную логику,
          итеративная доставка без поломки ядра игры.
        </li>
        <li>
          <strong>Командное взаимодействие</strong> — распределение зон, code
          review и общие стандарты в монорепо.
        </li>
        <li>
          <strong>Тайм-менеджмент</strong> — спринты, приоритеты и доведение фич
          до рабочего демо.
        </li>
        <li>
          <strong>Самостоятельное освоение</strong> — Web API, SSR, Docker и
          облако по документации и экспериментам.
        </li>
      </ul>
      <p className="presentation-learning__thanks">СПАСИБО!</p>
    </div>
  )
}
