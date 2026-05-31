import React from 'react'
import { useNavigate } from 'react-router-dom'

import { TEAM_MEMBERS } from '../Landing/teamData'
import { markAuthLoginRedirect } from '../../shared/authLoginRedirect'
import { useSelector } from '../../store'
import { selectUser } from '../../slices/userSlice'
import {
  CHALLENGES,
  CLIENT_STACK,
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
    <figure className="presentation-arch" aria-label="Архитектура проекта">
      <svg
        className="presentation-arch__svg"
        viewBox="0 0 520 200"
        role="img"
        aria-hidden>
        <defs>
          <marker
            id="arch-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#38bdf8" />
          </marker>
        </defs>
        <rect
          x="8"
          y="72"
          width="100"
          height="56"
          rx="8"
          className="presentation-arch__box"
        />
        <text
          x="58"
          y="104"
          textAnchor="middle"
          className="presentation-arch__label">
          Браузер
        </text>
        <rect
          x="140"
          y="24"
          width="120"
          height="48"
          rx="8"
          className="presentation-arch__box"
        />
        <text
          x="200"
          y="54"
          textAnchor="middle"
          className="presentation-arch__label">
          React + Canvas
        </text>
        <rect
          x="140"
          y="128"
          width="120"
          height="48"
          rx="8"
          className="presentation-arch__box"
        />
        <text
          x="200"
          y="158"
          textAnchor="middle"
          className="presentation-arch__label">
          Express SSR
        </text>
        <rect
          x="300"
          y="72"
          width="100"
          height="56"
          rx="8"
          className="presentation-arch__box"
        />
        <text
          x="350"
          y="104"
          textAnchor="middle"
          className="presentation-arch__label">
          API + ws
        </text>
        <rect
          x="420"
          y="72"
          width="92"
          height="56"
          rx="8"
          className="presentation-arch__box presentation-arch__box--db"
        />
        <text
          x="466"
          y="104"
          textAnchor="middle"
          className="presentation-arch__label">
          PostgreSQL
        </text>
        <line
          x1="108"
          y1="92"
          x2="138"
          y2="48"
          className="presentation-arch__line"
          markerEnd="url(#arch-arrow)"
        />
        <line
          x1="108"
          y1="108"
          x2="138"
          y2="152"
          className="presentation-arch__line"
          markerEnd="url(#arch-arrow)"
        />
        <line
          x1="260"
          y1="100"
          x2="298"
          y2="100"
          className="presentation-arch__line"
          markerEnd="url(#arch-arrow)"
        />
        <line
          x1="400"
          y1="100"
          x2="418"
          y2="100"
          className="presentation-arch__line"
          markerEnd="url(#arch-arrow)"
        />
        <text
          x="260"
          y="18"
          textAnchor="middle"
          className="presentation-arch__note">
          Nginx / Proxy / SSL
        </text>
      </svg>
      <figcaption className="presentation-arch__caption">
        Клиент: Canvas и UI · SSR отдаёт HTML · API и WebSocket · данные в
        PostgreSQL
      </figcaption>
    </figure>
  )
}

export function SlideStack() {
  return (
    <div className="presentation-slide presentation-slide--stack">
      <div className="presentation-stack__columns">
        <StackColumn title="Клиент" items={CLIENT_STACK} />
        <StackColumn title="Сервер" items={SERVER_STACK} />
      </div>
      <ArchitectureDiagram />
    </div>
  )
}

type SlideGameProps = {
  onClose: () => void
}

export function SlideGame({ onClose }: SlideGameProps) {
  const user = useSelector(selectUser)
  const navigate = useNavigate()

  const openGame = () => {
    onClose()
    if (user) {
      navigate('/game/start')
      return
    }
    markAuthLoginRedirect('/game/start')
    navigate('/login')
  }

  return (
    <div className="presentation-slide presentation-slide--game">
      <p>
        Cosmic Match — match‑3 с целями уровня, квестами, компаньонами, HUD и
        настройками поля. Лучше всего смотреть в живом интерфейсе.
      </p>
      <button type="button" className="btn btn--primary" onClick={openGame}>
        {user ? 'Открыть /game/start' : 'Войти и открыть игру'}
      </button>
      {!user ? (
        <p className="presentation-slide__note">
          После входа вы попадёте на экран старта матча.
        </p>
      ) : null}
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
        <li>
          Разделение UI и игрового runtime, тесты на критичную логику,
          итеративная доставка без поломки core-loop.
        </li>
      </ul>
      <p className="presentation-learning__thanks">СПАСИБО!</p>
    </div>
  )
}
