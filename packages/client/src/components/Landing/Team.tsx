// Блок "Команда" на лендинге с карточками участников и их ролями
import React from 'react'

type TeamMember = {
  name: string
  role: string
  githubUrl?: string
  avatarUrl?: string
}

const team: TeamMember[] = [
  {
    name: 'Анна',
    role: 'Quenn of cosmic beauty',
    githubUrl: 'https://github.com/larannma',
    avatarUrl:
      'https://avatars.githubusercontent.com/u/66175549?v=4',
  },
  {
    name: 'Сергей',
    role: 'Commander of eternal wisdom',
    githubUrl: 'https://github.com/zergeugenson',
    avatarUrl:
      'https://avatars.githubusercontent.com/u/33512074?v=4',
  },
  {
    name: 'Артур',
    role: 'Master of stellar magic',
    githubUrl: 'https://github.com/Arturaldo',
    avatarUrl:
      'https://avatars.githubusercontent.com/u/97703299?v=4',
  },
  {
    name: 'Антон',
    role: 'Universal treasure keeper)',
    githubUrl: 'https://github.com/TelRoY',
    avatarUrl:
      'https://avatars.githubusercontent.com/u/207622043?v=4',
  },
  {
    name: 'Кирилл',
    role: 'Lunar story teller',
    githubUrl: 'https://github.com/kirillchistov',
    avatarUrl:
      'https://avatars.githubusercontent.com/u/101833862?v=4',
  },
]

export const Team: React.FC = () => {
  return (
    <section className="section" id="team">
      <div className="team__inner">
        <h2>Команда</h2>
        <p className="section-subtitle">
          Пять разработчиков, UI/UX, гейм‑дизайн и
          бэкенд — все роли закрыты внутри
          учебного проекта.
        </p>
        <div className="team__grid">
          {team.map(member => (
            <div
              className="team-card"
              key={member.name}>
              <div
                className="team-card__avatar"
                style={
                  member.avatarUrl
                    ? {
                        backgroundImage: `url(${member.avatarUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition:
                          'center',
                      }
                    : undefined
                }
              />
              <div className="team-card__info">
                <div className="team-card__name">
                  {member.name}
                </div>
                <div className="team-card__role">
                  {member.role}
                </div>
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
