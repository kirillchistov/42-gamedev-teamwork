/**
 * Старый SW (PWA) перехватывает запросы и даёт 503, если dev-сервер не запущен.
 * В development снимаем регистрацию при каждом заходе.
 */
export async function unregisterDevServiceWorkers(): Promise<void> {
  if (import.meta.env.PROD) {
    return
  }
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map(reg => reg.unregister()))
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SKIP_WAITING',
      })
    }
  } catch {
    // noop
  }
}
