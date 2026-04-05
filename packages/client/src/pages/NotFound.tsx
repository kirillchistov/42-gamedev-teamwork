// Неизвестный маршрут (*): космический фон
import { useNavigate } from 'react-router-dom'

import { Button } from '../shared/ui'
import { usePage } from '../hooks/usePage'
import {
  CosmicErrorLayout,
  BlackHoleIllustration,
} from '../components/CosmicErrorLayout'

export const NotFoundPage = () => {
  usePage({ initPage: initNotFoundPage })
  const navigate = useNavigate()

  return (
    <CosmicErrorLayout
      title="Страница не найдена — Cosmic Match"
      description="Такого адреса нет в навигационных картах">
      <div className="cosmic-error-page__illustration-wrap">
        <BlackHoleIllustration className="cosmic-error-page__black-hole" />
      </div>
      <h1 className="error-title cosmic-error-page__code cosmic-error-page__code--oops">
        404
      </h1>
      <h2 className="error-subtitle cosmic-error-page__subtitle">
        За горизонтом событий
      </h2>
      <p className="section-subtitle error-message cosmic-error-page__text">
        Упс! Этот URL искривил
        пространственно‑временной континуум. Даже
        свет из него не выбирается. Маршрутизатор
        считает, что такой орбиты у нас нет.
      </p>
      <p className="section-subtitle error-message cosmic-error-page__text cosmic-error-page__text--accent">
        Выберите другой курс или проверьте
        написание URL.
      </p>
      <Button
        type="button"
        variant="primary"
        onClick={() => navigate('/')}>
        Выйти из гравитационной ловушки
      </Button>
    </CosmicErrorLayout>
  )
}

export const initNotFoundPage = () =>
  Promise.resolve()
