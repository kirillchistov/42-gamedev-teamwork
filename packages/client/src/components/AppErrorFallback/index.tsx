// UI для сбоев и 'react-router' errorElement
import React from 'react'
import { LinkButton } from '../../shared/ui'
import { CosmicErrorLayout } from '../CosmicErrorLayout'

type AppErrorFallbackProps = {
  title?: string
  description?: string
}

export const AppErrorFallback: React.FC<
  AppErrorFallbackProps
> = ({
  title = 'Ошибка 500 — Cosmic Match',
  description = 'Внутренняя ошибка сервера',
}) => {
  return (
    <CosmicErrorLayout
      title={title}
      description={description}
      showSiteChrome={false}>
      <h1 className="error-title cosmic-error-page__code cosmic-error-page__code--500">
        500{' '}
        <span className="error-emoji" aria-hidden>
          🛠️
        </span>
      </h1>
      <h2 className="error-subtitle cosmic-error-page__subtitle">
        Космическая турбулентность
      </h2>
      <p className="section-subtitle error-message cosmic-error-page__text">
        На борту сервера что-то перегрелось -
        сигнал оборвался посреди гиперпрыжка.
      </p>
      <p className="section-subtitle error-message cosmic-error-page__text">
        Мы уже чиним ретранслятор. Загляните чуть
        позже или вернитесь на базу.
      </p>
      <LinkButton
        type="button"
        variant="primary"
        to="/">
        На главную
      </LinkButton>
    </CosmicErrorLayout>
  )
}
