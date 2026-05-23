// Таймеры для кода вызываются и в браузере, и при SSR (Node)
// Не использовать window.setTimeout на сервере

type TimeoutHandle = ReturnType<typeof setTimeout>

export function scheduleTimeout(fn: () => void, ms: number): TimeoutHandle {
  return setTimeout(fn, ms)
}

export function cancelScheduledTimeout(
  id: TimeoutHandle | null | undefined
): void {
  if (id != null) {
    clearTimeout(id)
  }
}

export function delayMs(ms: number): Promise<void> {
  return new Promise(resolve => {
    scheduleTimeout(resolve, ms)
  })
}
