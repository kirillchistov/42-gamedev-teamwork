/** Изменения и починка Sprint6 Chores
 * Сброс куки-сессии на сервере (против "User already in system")
 * Полный URL файла с API и нормализация ответа из API
 *
 **/
import { API_RESOURCES_URL } from '../../constants'
import { apiClient } from './apiClient'

/** Полный URL файла с API . */
export function resourceFileUrl(
  path: string | null | undefined
): string | null {
  if (path == null || path === '') return null
  const p = path.trim()
  if (/^https?:\/\//i.test(p)) return p
  const base = API_RESOURCES_URL.replace(
    /\/$/,
    ''
  )
  const slug = p.startsWith('/') ? p : `/${p}`
  return `${base}${slug}`
}

export interface ProfileData {
  first_name: string
  second_name: string
  display_name: string
  email: string
  phone: string
  login: string
}

export interface ProfileResponse
  extends ProfileData {
  id: number
  avatar: string
}

type ProfileResponseRaw = ProfileResponse & {
  secondName?: string
  firstName?: string
  displayName?: string
  emailAddress?: string
}

function normalizeProfileResponse(
  raw: ProfileResponseRaw
): ProfileResponse {
  return {
    ...raw,
    first_name:
      raw.first_name || raw.firstName || '',
    second_name:
      raw.second_name || raw.secondName || '',
    display_name:
      raw.display_name || raw.displayName || '',
    email: raw.email || raw.emailAddress || '',
    phone: raw.phone || '',
    login: raw.login || '',
  }
}

export interface PasswordData {
  oldPassword: string
  newPassword: string
}

export const userApi = {
  // Сброс куки-сессии на сервере
  logout: () =>
    apiClient.postEmpty('/auth/logout'),

  getProfile: () =>
    apiClient
      .get<ProfileResponseRaw>('/auth/user')
      .then(normalizeProfileResponse),

  updateProfile: (data: ProfileData) =>
    apiClient.put<ProfileResponse>(
      '/user/profile',
      data
    ),

  changePassword: (data: PasswordData) =>
    apiClient.put('/user/password', data),

  updateAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return apiClient.upload<ProfileResponse>(
      '/user/profile/avatar',
      formData
    )
  },

  deleteAvatar: () =>
    apiClient.delete('/user/profile/avatar'),
}
