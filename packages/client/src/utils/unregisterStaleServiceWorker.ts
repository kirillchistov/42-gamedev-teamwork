import { isStaticGhPagesDeploy } from '../shared/staticDeploy'

/**
 * Старый SW (PWA / dev) перехватывает навигацию и даёт 503.
 * На GitHub Pages SW нужен для прокси /api/v2 — не снимаем регистрацию.
 */
export async function unregisterStaleServiceWorkers(): Promise<void> {
  const keepServiceWorker =
    import.meta.env.VITE_ENABLE_SW === '1' || isStaticGhPagesDeploy()
  if (keepServiceWorker) {
    return
  }
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map(reg => reg.unregister()))
  } catch {
    // noop
  }
}
