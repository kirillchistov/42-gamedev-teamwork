/**
 * Обёртка над Fullscreen API с префиксом webkit (Safari).
 * 6.3.2 Оболочка страницы игры:
 * Стабильный enter/exit/toggle и подписка на fullscreenchange для иконки в шапке.
 * Реализовал: getFullscreenElement, enterFullscreen, exitFullscreen, toggleFullscreen,
 * addFullscreenChangeListener (fullscreenchange + webkitfullscreenchange).
 * Потребители: GamePage.tsx (клавиша F), Header/index.tsx (кнопка развернуть/свернуть).
 */

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void>
}

type FsHTMLElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>
}

export function getFullscreenElement(): Element | null {
  const d = document as FsDocument
  return (
    document.fullscreenElement ??
    d.webkitFullscreenElement ??
    null
  )
}

export function isElementFullscreen(
  el: HTMLElement
): boolean {
  const active = getFullscreenElement()
  return Boolean(active && active === el)
}

export async function enterFullscreen(
  el: HTMLElement
): Promise<void> {
  const node = el as FsHTMLElement
  try {
    if (
      typeof node.requestFullscreen === 'function'
    ) {
      await node.requestFullscreen()
      return
    }
    if (
      typeof node.webkitRequestFullscreen ===
      'function'
    ) {
      await node.webkitRequestFullscreen()
    }
  } catch {
    console.log(
      'пользователь отклонил или API недоступен'
    )
  }
}

export async function exitFullscreen(): Promise<void> {
  const d = document as FsDocument
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    if (
      typeof d.webkitExitFullscreen === 'function'
    ) {
      await d.webkitExitFullscreen()
    }
  } catch {
    console.log(
      'не получилось выйти из полноэкранного режима'
    )
  }
}

export async function toggleFullscreen(
  el: HTMLElement | null
): Promise<void> {
  if (!el) return
  if (getFullscreenElement()) {
    await exitFullscreen()
  } else {
    await enterFullscreen(el)
  }
}

export function addFullscreenChangeListener(
  fn: () => void
): () => void {
  document.addEventListener(
    'fullscreenchange',
    fn
  )
  document.addEventListener(
    'webkitfullscreenchange',
    fn
  )
  return () => {
    document.removeEventListener(
      'fullscreenchange',
      fn
    )
    document.removeEventListener(
      'webkitfullscreenchange',
      fn
    )
  }
}
