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
        Упс! Этот URL так сильно искривил
        пространство‑время, что даже свет из него
        не выбирается. Маршрутизатор сдался и
        честно признался: такой орбиты у нас нет.
      </p>
      <p className="section-subtitle error-message cosmic-error-page__text cosmic-error-page__text--accent">
        Выберите другой курс — или проверьте, не
        опечатались ли в гиперссылке (здесь легко
        улететь не туда, даже без варп‑двигателя).
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
