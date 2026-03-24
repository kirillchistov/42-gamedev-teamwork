// Блок "Контакты" на лендинге с формой обратной связи
import React from 'react'

export const Contact: React.FC = () => {
  return (
    <section className="section" id="contact">
      <div className="contact__inner">
        <h2>Обратная связь</h2>
        <p className="section-subtitle">
          Напишите, если хотите обсудить реализацию, механику уровней или
          совместную работу.
        </p>
        <form className="contact-form" id="contact-form">
          <div className="contact-form__row">
            <label>
              Имя
              <input type="text" id="cf-name" />
            </label>
            <label>
              Email
              <input type="email" id="cf-email" />
            </label>
          </div>
          <label>
            Тема
            <input
              type="text"
              id="cf-subject"
              placeholder="Обратная связь по Cosmic Match"
            />
          </label>
          <label>
            Сообщение
            <textarea id="cf-message" rows={4} />
          </label>
          <div className="contact-form__actions">
            <button type="submit" className="btn btn--primary">
              Отправить
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
