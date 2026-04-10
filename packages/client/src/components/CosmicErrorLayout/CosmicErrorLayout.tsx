import React from 'react'
import { Helmet } from 'react-helmet'
import { Header } from '../Header'
import { Footer } from '../Footer'
import { useLandingTheme } from '../../contexts/LandingThemeContext'

type CosmicErrorLayoutProps = {
  children: React.ReactNode
  title: string
  description: string
}

export const CosmicErrorLayout: React.FC<
  CosmicErrorLayoutProps
> = ({ children, title, description }) => {
  const { theme } = useLandingTheme()

  return (
    <div
      className={`landing landing--${theme} ErrorPage cosmic-error-page`}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{title}</title>
        <meta
          name="description"
          content={description}
        />
      </Helmet>

      <div
        className="cosmic-error-page__bg"
        aria-hidden="true">
        <div className="cosmic-error-page__stars" />
        <div className="cosmic-error-page__nebula" />
        <div className="cosmic-error-page__galaxy cosmic-error-page__galaxy--a" />
        <div className="cosmic-error-page__galaxy cosmic-error-page__galaxy--b" />
        <div className="cosmic-error-page__galaxy cosmic-error-page__galaxy--c" />
        <div className="cosmic-error-page__galaxy cosmic-error-page__galaxy--d" />
        <div className="cosmic-error-page__comet cosmic-error-page__comet--1" />
        <div className="cosmic-error-page__comet cosmic-error-page__comet--2" />
        <div className="cosmic-error-page__comet cosmic-error-page__comet--3" />
      </div>

      <Header />

      <main className="cosmic-error-page__main">
        <div className="auth-card auth-card--wide error-card cosmic-error-page__card">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  )
}
