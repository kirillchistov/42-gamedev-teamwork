/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API_URL?: string
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
