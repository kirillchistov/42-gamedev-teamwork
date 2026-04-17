import './client.d'

// export const SERVER_HOST =
//   typeof window === 'undefined'
//     ? __INTERNAL_SERVER_URL__
//     : __EXTERNAL_SERVER_URL__

// пока используем один адрес, потом заменим на define
export const SERVER_HOST = 'http://localhost:3000'
export const DEFAULT_AVATAR_PATH =
  '/avatar-transp.png'
export const BASE_URL =
  'https://ya-praktikum.tech/api/v2'
export const API_RESOURCES_URL = `${BASE_URL}/resources`
