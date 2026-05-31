/**
 * Page Visibility API: подписка на скрытие/показ вкладки (пауза игры, метрики).
 */

export function isPageVisibilitySupported(): boolean {
  return (
    typeof document !== 'undefined' &&
    typeof document.visibilityState === 'string'
  )
}

export function isDocumentHidden(): boolean {
  if (!isPageVisibilitySupported()) {
    return false
  }
  return document.visibilityState === 'hidden'
}

export function subscribePageVisibility(
  onChange: (hidden: boolean) => void
): () => void {
  if (!isPageVisibilitySupported()) {
    return () => undefined
  }

  const handler = () => {
    onChange(document.visibilityState === 'hidden')
  }

  handler()
  document.addEventListener('visibilitychange', handler)
  return () => {
    document.removeEventListener('visibilitychange', handler)
  }
}
