import { BASE_URL } from '../../constants'
import { apiClient } from './apiClient'

type YandexServiceIdResponse = {
  service_id: string
}

type YandexOAuthPayload = {
  code: string
  redirect_uri: string
}

const YA_OAUTH_AUTHORIZE_URL =
  'https://oauth.yandex.ru/authorize'

export function buildYandexRedirectUri(): string {
  const envValue = import.meta.env
    .VITE_YANDEX_OAUTH_REDIRECT_URI
  if (
    typeof envValue === 'string' &&
    envValue.trim() !== ''
  ) {
    return envValue.trim().replace(/\/+$/, '')
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'http://localhost:3000'
}

export async function getYandexServiceId(
  redirectUri: string
): Promise<string> {
  const params = new URLSearchParams({
    redirect_uri: redirectUri,
  })
  const response = await fetch(
    `${BASE_URL}/oauth/yandex/service-id?${params.toString()}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  )
  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      text || 'Не удалось получить service_id'
    )
  }
  const data =
    (await response.json()) as YandexServiceIdResponse
  return data.service_id
}

export async function signInByYandexCode(
  payload: YandexOAuthPayload
): Promise<void> {
  const response = await fetch(
    `${BASE_URL}/oauth/yandex`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      text || 'Не удалось завершить OAuth вход'
    )
  }
}

export function buildYandexAuthorizeUrl(
  serviceId: string,
  redirectUri: string,
  state?: string
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: serviceId,
    redirect_uri: redirectUri,
  })
  if (state) {
    params.set('state', state)
  }
  return `${YA_OAUTH_AUTHORIZE_URL}?${params.toString()}`
}
