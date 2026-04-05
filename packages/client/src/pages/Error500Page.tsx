import { useNavigate } from 'react-router-dom'

import { Button } from '../shared/ui'
import { usePage } from '../hooks/usePage'
import { CosmicErrorLayout } from '../components/CosmicErrorLayout'

export const Error500Page = () => {
  usePage({ initPage: initError500Page })
  const navigate = useNavigate()

  return (
    <CosmicErrorLayout
      title="Ошибка 500 — Cosmic Match"
      description="Внутренняя ошибка сервера">
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
        На борту сервера что-то перегрелось —
        сигнал оборвался посреди гиперпрыжка.
      </p>
      <p className="section-subtitle error-message cosmic-error-page__text">
        Мы уже чиним ретранслятор. Загляните чуть
        позже или вернитесь на базу.
      </p>
      <Button
        type="button"
        variant="primary"
        onClick={() => navigate('/')}>
        На главную
      </Button>
    </CosmicErrorLayout>
  )
}

export const initError500Page = () =>
  Promise.resolve()
