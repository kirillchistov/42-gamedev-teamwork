import { isStaticGhPagesDeploy } from '../shared/staticDeploy'

/**
 * На GitHub Pages снимаем старый SW (прокси /api/v2 ломал cookie).
 * В dev с VITE_ENABLE_SW=1 SW оставляем для локальной отладки.
 */
export async function unregisterStaleServiceWorkers(): Promise<void> {
  const keepServiceWorker =
    import.meta.env.VITE_ENABLE_SW === '1' && !isStaticGhPagesDeploy()
  if (keepServiceWorker) {
    return
  }
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map(reg => reg.unregister()))
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(key => caches.delete(key)))
    }
  } catch {
    // noop
  }
}
