// S8 chores: OAuth — без дефолтного service_id; только env или ответ API.

import { BASE_URL } from '../../constants'

type YandexServiceIdResponse = {
  service_id: string
}

type YandexOAuthPayload = {
  code: string
  redirect_uri: string
}

const YA_OAUTH_AUTHORIZE_URL =
  'https://oauth.yandex.ru/authorize'

export const YANDEX_OAUTH_STATE_KEY =
  'oauth:yandex:state'

function readYandexServiceIdFromEnv():
  | string
  | null {
  const envValue = import.meta.env
    .VITE_YANDEX_OAUTH_SERVICE_ID

  if (
    typeof envValue === 'string' &&
    envValue.trim() !== ''
  ) {
    return envValue.trim()
  }

  return null
}

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
    return window.location.origin.replace(
      /\/+$/,
      ''
    )
  }

  return 'http://localhost:3000'
}

export async function getYandexServiceId(
  redirectUri: string
): Promise<string> {
  const envServiceId =
    readYandexServiceIdFromEnv()
  if (envServiceId) return envServiceId

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

  const serviceId =
    typeof data.service_id === 'string'
      ? data.service_id.trim()
      : ''
  if (!serviceId) {
    throw new Error(
      'Сервер не вернул service_id для Yandex OAuth'
    )
  }
  return serviceId
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
