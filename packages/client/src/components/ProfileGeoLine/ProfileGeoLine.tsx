import React from 'react'
import './ProfileGeoLine.pcss'

type ProfileGeoLineProps = {
  line: string
  loading: boolean
  geoEnabled: boolean
  geoSupported: boolean
  error?: string
  onToggleGeo: () => void
}

function EyeOpenIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeClosedIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-6.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M1 1l22 22" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  )
}

export function ProfileGeoLine({
  line,
  loading,
  geoEnabled,
  geoSupported,
  error,
  onToggleGeo,
}: ProfileGeoLineProps) {
  return (
    <div className="profile-geo">
      <p className="profile-geo__line" aria-live="polite">
        {loading ? 'Определяем регион…' : line}
      </p>
      {geoSupported ? (
        <button
          type="button"
          className="profile-geo__toggle"
          aria-pressed={geoEnabled}
          aria-label={
            geoEnabled
              ? 'Отключить геолокацию (только часовой пояс)'
              : 'Включить геолокацию (приблизительные координаты)'
          }
          title={geoEnabled ? 'Геолокация включена' : 'Геолокация выключена'}
          disabled={loading}
          onClick={onToggleGeo}>
          {geoEnabled ? <EyeOpenIcon /> : <EyeClosedIcon />}
        </button>
      ) : null}
      {error ? (
        <p className="profile-geo__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
