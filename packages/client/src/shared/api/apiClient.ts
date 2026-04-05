/** Изменения и починка Sprint6 Chores
 * 1. Поддержка POST без обязательного JSON в ответе (POST /auth/logout)
 **/
import { BASE_URL } from '../../constants'

export interface ApiResponse<T = unknown> {
  data: T
  status: number
  ok: boolean
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    }

    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.reason || 'Ошибка запроса'
      )
    }

    return data as T
  }

  // POST без обязательного JSON в ответе (напр, /auth/logout)
  postEmpty(endpoint: string): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`
    return fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(async res => {
      if (!res.ok) {
        const text = await res.text()
        let msg = 'Ошибка запроса'
        if (text) {
          try {
            const j = JSON.parse(text) as {
              reason?: string
            }
            if (j.reason) msg = j.reason
          } catch {
            /* не JSON */
          }
        }
        throw new Error(msg)
      }
    })
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, {
      method: 'GET',
    })
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }

  upload<T>(
    endpoint: string,
    formData: FormData
  ) {
    return fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      body: formData,
      credentials: 'include',
    }).then(async res => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.reason)
      return data as T
    })
  }
}

export const apiClient = new ApiClient(BASE_URL)
