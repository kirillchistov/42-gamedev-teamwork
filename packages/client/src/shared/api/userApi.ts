import { apiClient } from './apiClient'

export interface ProfileData {
  first_name: string
  second_name: string
  display_name: string
  email: string
  phone: string
  login: string
}

export interface ProfileResponse extends ProfileData {
  id: number
  avatar: string
}

export interface PasswordData {
  oldPassword: string
  newPassword: string
}

export const userApi = {
  getProfile: () => apiClient.get<ProfileResponse>('/auth/user'),

  updateProfile: (data: ProfileData) =>
    apiClient.put<ProfileResponse>('/user/profile', data),

  changePassword: (data: PasswordData) => apiClient.put('/user/password', data),

  updateAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return apiClient.upload<ProfileResponse>('/user/profile/avatar', formData)
  },

  deleteAvatar: () => apiClient.delete('/user/profile/avatar'),
}
