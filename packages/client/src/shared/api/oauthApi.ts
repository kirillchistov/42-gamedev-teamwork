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
const DEFAULT_YANDEX_SERVICE_ID =
  '243f5d3b0fa04e5aa9b8ff6508db3a64'

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

  return (
    data.service_id || DEFAULT_YANDEX_SERVICE_ID
  )
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
