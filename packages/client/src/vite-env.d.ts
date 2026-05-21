/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API_URL?: string
  /** gh-pages — прямой API Практикума, без Express-прокси */
  readonly VITE_STATIC_DEPLOY?: string
  readonly VITE_YANDEX_OAUTH_REDIRECT_URI?: string
  readonly VITE_YANDEX_OAUTH_SERVICE_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace NodeJS {
  interface ProcessEnv {
    /** Подставляется Vite `define` в клиентском бандле; в Jest — из .env через dotenv. */
    readonly VITE_APP_API_URL?: string
  }
}
