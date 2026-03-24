// Блок "Команда" на лендинге с карточками участников и их ролями
import React from 'react'

const team = [
  { name: 'dev-1', role: 'Game Developer' },
  { name: 'dev-2', role: 'Frontend Engineer' },
  { name: 'dev-3', role: 'Backend Engineer' },
  { name: 'dev-4', role: 'UI/UX Designer' },
  { name: 'dev-5', role: 'QA / Game Balancer' },
]

export const Team: React.FC = () => {
  return (
    <section className="section" id="team">
      <div className="team__inner">
        <h2>Команда</h2>
        <p className="section-subtitle">
          Пять разработчиков, UI/UX, гейм‑дизайн и бэкенд — все роли закрыты
          внутри учебного проекта.
        </p>
        <div className="team__grid">
          {team.map(member => (
            <div className="team-card" key={member.name}>
              <div className="team-card__avatar" />
              <div className="team-card__info">
                <div className="team-card__name">{member.name}</div>
                <div className="team-card__role">{member.role}</div>
                <a
                  className="team-card__github"
                  href="#"
                  target="_blank"
                  rel="noreferrer">
                  GitHub
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
