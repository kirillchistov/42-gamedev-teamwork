import React, { useState } from 'react'

const sprintUpdates = [
  {
    sprint: '9.6',
    title: 'Деплой в Яндекс.Облако',
    text: 'Подняли production-стек в облаке: контейнеры, nginx и проверка OAuth redirect_uri на реальном домене.',
  },
  {
    sprint: '9.5',
    title: 'Автодеплой через GitHub Actions',
    text: 'Настроили CI/CD: сборка образов, выкладка на ВМ и обновление статики без ручных шагов.',
  },
  {
    sprint: '9.4',
    title: 'Защита от XSS',
    text: 'Добавили санитизацию пользовательского контента на форуме и профиле, задокументировали подход в docs/xss.md.',
  },
  {
    sprint: '9.2',
    title: 'Nginx: HTTP/2 и SSL',
    text: 'Собрали конфиг reverse proxy с TLS и HTTP/2 для production-трафика между браузером и сервисами.',
  },
  {
    sprint: '9.1',
    title: 'Content Security Policy',
    text: 'Включили CSP для клиента и SSR: ограничили источники скриптов, стилей и API-запросов.',
  },
  {
    sprint: '8.9',
    title: 'Форум на клиенте',
    text: 'Подключили API форума в UI: темы, сообщения и работа с данными из PostgreSQL через наш бэкенд.',
  },
  {
    sprint: '8.2',
    title: 'API форума на сервере',
    text: 'Реализовали REST-слой для тем и постов, миграции и связку с Docker Postgres.',
  },
  {
    sprint: '8.1',
    title: 'Docker для PostgreSQL',
    text: 'Оформили compose-стек: Postgres, миграции, API и SSR-клиент поднимаются одной командой.',
  },
  {
    sprint: '8.3',
    title: 'Переключение тем на клиенте',
    text: 'Добавили светлые и тёмные темы лендинга и игры с сохранением выбора пользователя.',
  },
  {
    sprint: '8.4',
    title: 'Проверка авторизации на бэкенде',
    text: 'Защитили API прокси и форум: сессия и права проверяются на сервере, а не только в UI.',
  },
  {
    sprint: '7.3',
    title: 'OAuth через Яндекс',
    text: 'Интегрировали вход по OAuth рядом с логином и паролем, с callback-маршрутом и state в sessionStorage.',
  },
  {
    sprint: '7.2',
    title: 'Redux и Router в SSR',
    text: 'Сериализуем store на сервере и гидратируем на клиенте — защищённые страницы открываются без «мигания».',
  },
  {
    sprint: '7.1',
    title: 'Express для SSR',
    text: 'Клиент отдаёт HTML с сервера: маршруты, Helmet и прокси /api на одном origin.',
  },
  {
    sprint: '7.4',
    title: 'API лидерборда',
    text: 'Добавили серверный эндпоинт и экран таблицы лидеров с данными из Practicum API.',
  },
  {
    sprint: '7.5',
    title: 'Performance API',
    text: 'Замеряем длительность игровой сессии и используем метрики для отладки производительности.',
  },
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

export function Blog() {
  const [visibleCount, setVisibleCount] = useState(6)
  const visibleItems = sprintUpdates.slice(0, visibleCount)
  const hasMore = visibleCount < sprintUpdates.length

  return (
    <section className="section" id="blog">
      <h2>Блог разработки</h2>
      <p className="section-subtitle">
        Коротко о ключевых изменениях в спринтах 5–9.
      </p>
      <div className="blog-grid">
        {visibleItems.map(item => (
          <article key={`${item.sprint}-${item.title}`} className="blog-card">
            <div className="blog-card__sprint">{item.sprint}</div>
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
              setVisibleCount(prev => Math.min(prev + 4, sprintUpdates.length))
            }>
            Еще...
          </button>
        </div>
      ) : null}
    </section>
  )
}

export default Blog
