/// <reference lib="webworker" />

export type PrecacheEntry = {
  url: string
  revision: string | null
}

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: Array<PrecacheEntry | string>
  }
}

export {}
