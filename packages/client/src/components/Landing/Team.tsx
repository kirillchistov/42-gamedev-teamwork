// Блок "Команда" на лендинге с карточками участников и их ролями
import React from 'react'

import { TEAM_MEMBERS } from './teamData'

export function Team() {
  return (
    <section className="section" id="team">
      <div className="team__inner">
        <h2>Команда</h2>
        <p className="section-subtitle">
          Пять разработчиков, UI/UX, гейм‑дизайн и бэкенд — все роли закрыты
          внутри учебного проекта.
        </p>
        <div className="team__grid">
          {TEAM_MEMBERS.map(member => (
            <div className="team-card" key={member.name}>
              <div
                className="team-card__avatar"
                style={
                  member.avatarUrl
                    ? {
                        backgroundImage: `url(${member.avatarUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              />
              <div className="team-card__info">
                <div className="team-card__name">{member.name}</div>
                <div className="team-card__role">{member.role}</div>
                {member.githubUrl ? (
                  <a
                    className="team-card__github"
                    href={member.githubUrl}
                    target="_blank"
                    rel="noreferrer">
                    GitHub
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
