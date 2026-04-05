// Ошибка 404 — /error404, /error/404)
import { useNavigate } from 'react-router-dom'

import { Button } from '../shared/ui'
import { usePage } from '../hooks/usePage'
import { CosmicErrorLayout } from '../components/CosmicErrorLayout'

export const Error404Page = () => {
  usePage({ initPage: initError404Page })
  const navigate = useNavigate()

  return (
    <CosmicErrorLayout
      title="Ошибка 404 — Cosmic Match"
      description="Страница не найдена">
      <h1 className="error-title error-title--404 cosmic-error-page__code">
        404{' '}
        <span className="error-emoji" aria-hidden>
          🛰️
        </span>
      </h1>
      <h2 className="error-subtitle cosmic-error-page__subtitle">
        Космическая пустота
      </h2>
      <p className="section-subtitle error-message cosmic-error-page__text">
        Запрашиваемая страница потерялась в
        туманности — ни одного пикселя на радарах.
      </p>
      <Button
        type="button"
        variant="primary"
        onClick={() => navigate('/')}>
        Вернуться на главную
      </Button>
    </CosmicErrorLayout>
  )
}

export const initError404Page = () =>
  Promise.resolve()
