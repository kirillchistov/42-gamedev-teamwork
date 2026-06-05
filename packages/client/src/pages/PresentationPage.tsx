import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { ProjectPresentationCarousel } from '../components/ProjectPresentation/ProjectPresentationCarousel'
import { usePage } from '../hooks/usePage'

export function PresentationPage() {
  usePage({ initPage: initPresentationPage })
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ slide?: string }>()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const slideFromQuery = (() => {
    const value = new URLSearchParams(location.search).get('slide')
    if (!value) return undefined
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
  })()

  const slideFromPath = (() => {
    if (!params.slide) return undefined
    const n = Number(params.slide)
    return Number.isFinite(n) ? n : undefined
  })()

  const initialSlide = slideFromPath ?? slideFromQuery

  return (
    <>
      <Helmet>
        <title>Презентация проекта Cosmic Match</title>
        <meta
          name="description"
          content="Полноэкранная презентация проекта Cosmic Match"
        />
      </Helmet>
      {isClient ? (
        <ProjectPresentationCarousel
          open
          initialSlide={initialSlide}
          onOpenChange={nextOpen => {
            if (!nextOpen) navigate('/')
          }}
          onLeavePresentation={() => {
            /* CTA сам делает navigate; не уходим на главную раньше времени */
          }}
        />
      ) : null}
    </>
  )
}

export const initPresentationPage = () => Promise.resolve()
