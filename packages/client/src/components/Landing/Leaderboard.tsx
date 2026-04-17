// Блок "Лидеры" на лендинге с описанием преимуществ и навигацией по ним
import React from 'react'

export const Leaderboard: React.FC = () => {
  return (
    <section className="section" id="leaderboard">
      <h2>Лидеры Cosmic Match</h2>
      <p className="section-subtitle">
        Лучшие игроки по результатам соревнований.
      </p>
      <p className="auth-note">
        Сейчас таблица рекордов статична. Данные
        друзей подгружаются так же, как на
        FriendsPage.
      </p>

      <div
        className="extra-card"
        style={{ marginBottom: 16 }}>
        <h3>Таблица рекордов</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Никнейм</th>
              <th>Очки</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Player123</td>
              <td>1200</td>
              <td>18.03.2026</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Match3Pro</td>
              <td>950</td>
              <td>17.03.2026</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
