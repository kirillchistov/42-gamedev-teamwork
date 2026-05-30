/**
 * Старый SW (PWA / dev) перехватывает навигацию и даёт 503.
 * Снимаем регистрацию, если SW не включали явно (VITE_ENABLE_SW=1).
 */
export async function unregisterStaleServiceWorkers(): Promise<void> {
  const enableSw = import.meta.env.VITE_ENABLE_SW === '1'
  if (enableSw) {
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
