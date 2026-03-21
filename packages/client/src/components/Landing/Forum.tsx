// Блок "О проекте" на лендинге с описанием преимуществ и навигацией по ним
import React from 'react'

export const Forum: React.FC = () => {
  return (
    <section className="section" id="forum">
      <h1>Форум Cosmic Match</h1>
      <p className="auth-note">
        Темы и ответы пока статичны. Друзья и пользователь подгружаются так же,
        как на странице друзей.
      </p>

      <div className="extra-card" style={{ marginBottom: 16 }}>
        <h3>Темы</h3>
        <table>
          <thead>
            <tr>
              <th>Тема</th>
              <th>Автор</th>
              <th>Ответов</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Баланс уровней match‑3</td>
              <td>dev-1</td>
              <td>3</td>
            </tr>
            <tr>
              <td>Идеи новых бомб</td>
              <td>dev-3</td>
              <td>5</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="extra-card" style={{ marginBottom: 16 }}>
        <h3>Демо‑список друзей (как на FriendsPage)</h3>
        <p>Вы вошли как User</p>
        <p>Здесь будет загрузка списка друзей…</p>
      </div>

      <div className="extra-card">
        <h3>Создать новую тему</h3>
        <form>
          <label>
            Заголовок темы
            <input type="text" placeholder="Идеи бонусных уровней" />
          </label>
          <label>
            Сообщение
            <textarea rows={4} placeholder="Опишите вашу идею или вопрос" />
          </label>
          <button type="button" className="btn btn--primary">
            Опубликовать
          </button>
        </form>
      </div>
    </section>
  )
}
