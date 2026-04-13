import React from 'react'
import { Link } from 'react-router-dom'

const topLeaders = [
  { place: 1, nickname: 'Max_Fox', score: 60000 },
  { place: 2, nickname: 'Kira', score: 56000 },
  {
    place: 3,
    nickname: 'Mila_sila',
    score: 34000,
  },
  {
    place: 4,
    nickname: 'Cat_Banan',
    score: 24011,
  },
  { place: 5, nickname: 'Sanka', score: 20970 },
]

export const LandingLeaders: React.FC = () => {
  return (
    <section className="section" id="leaderboard">
      <h2>Лидеры</h2>
      <p className="section-subtitle">
        Топ игроков по текущему рейтингу. Полная
        таблица доступна на отдельной странице.
      </p>
      <div className="leaders-card">
        <ul className="leaders-list">
          {topLeaders.map(leader => (
            <li key={leader.place}>
              <span>#{leader.place}</span>
              <span>{leader.nickname}</span>
              <span>
                {leader.score.toLocaleString(
                  'ru-RU'
                )}
              </span>
            </li>
          ))}
        </ul>
        <Link
          to="/leaderboard"
          className="btn btn--outline">
          Открыть лидерборд
        </Link>
      </div>
    </section>
  )
}

export default LandingLeaders
