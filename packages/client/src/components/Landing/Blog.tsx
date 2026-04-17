import React, { useState } from 'react'

const sprintUpdates = [
  {
    sprint: '6.8',
    title: 'Покрыли игру тестами',
    text: 'Добавили тесты для игрового движка и UI-сценариев, чтобы быстрее ловить регрессии.',
  },
  {
    sprint: '6.7',
    title: 'Подключили Redux-хранилище',
    text: 'Состояние приложения стало более предсказуемым: проще развивать фичи и синхронизировать экранные данные.',
  },
  {
    sprint: '6.6',
    title: 'Добавили Web API в геймплей',
    text: 'Интегрировали браузерные возможности так, чтобы они реально улучшали игровой опыт, а не были формальностью.',
  },
  {
    sprint: '6.5',
    title: 'Усиление авторизации',
    text: 'Подготовили и доработали проверку доступа через обертки и хуки, чтобы защищенные страницы открывались корректно.',
  },
  {
    sprint: '6.4',
    title: 'Service Worker для стабильности',
    text: 'Статика и ключевые ассеты стали лучше кэшироваться, поэтому приложение быстрее стартует при повторном заходе.',
  },
  {
    sprint: '6.3',
    title: 'Прокачали визуальную часть',
    text: 'Дополнили интерфейс игры эффектами и темами, чтобы матч выглядел ярче и цельнее.',
  },
  {
    sprint: '5.17',
    title: 'Запустили механику на Canvas',
    text: 'Появилось рабочее игровое ядро match-3 с полем, матчингом и базовой динамикой.',
  },
  {
    sprint: '5.3',
    title: 'Сверстали первый лендинг',
    text: 'Собрали главную страницу проекта и базовую навигацию по ключевым разделам.',
  },
]

export const Blog: React.FC = () => {
  const [visibleCount, setVisibleCount] =
    useState(6)
  const visibleItems = sprintUpdates.slice(
    0,
    visibleCount
  )
  const hasMore =
    visibleCount < sprintUpdates.length

  return (
    <section className="section" id="blog">
      <h2>Блог разработки</h2>
      <p className="section-subtitle">
        Коротко о последних заметных изменениях в
        спринтах 5 и 6.
      </p>
      <div className="blog-grid">
        {visibleItems.map(item => (
          <article
            key={`${item.sprint}-${item.title}`}
            className="blog-card">
            <div className="blog-card__sprint">
              {item.sprint}
            </div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      {hasMore ? (
        <div className="blog-more">
          <button
            type="button"
            className="btn btn--outline"
            onClick={() =>
              setVisibleCount(prev =>
                Math.min(
                  prev + 4,
                  sprintUpdates.length
                )
              )
            }>
            Еще...
          </button>
        </div>
      ) : null}
    </section>
  )
}

export default Blog
