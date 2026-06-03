import { domToCanvas } from 'modern-screenshot'

const PDF_PAGE_W = 1280
const PDF_PAGE_H = 720

const UNSAFE_COLOR_RE = /color\(|oklch\(|lab\(|lch\(/i

/** Только CSS презентации / hero — без глобального бандла приложения. */
function isPresentationOnlyStyle(text: string): boolean {
  if (!text || UNSAFE_COLOR_RE.test(text)) return false
  if (text.length > 120_000) return false
  return (
    text.includes('.match3-presentation') ||
    text.includes('.presentation-') ||
    text.includes('.hero-board') ||
    text.includes('.hero-visual') ||
    text.includes('.hero__') ||
    text.includes('.team-card__avatar')
  )
}

const PDF_BASE_CSS = `
  html, body {
    margin: 0;
    padding: 0;
    background: #020617;
    color: #e2e8f0;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    border: 1px solid transparent;
  }
  .btn--primary {
    background: #4f46e5;
    color: #f8fafc;
    border-color: #6366f1;
  }
  .btn--outline {
    background: rgba(15, 23, 42, 0.6);
    color: #e2e8f0;
    border-color: rgba(148, 163, 184, 0.45);
  }
`

export function copyPresentationStylesTo(targetDoc: Document): void {
  const seen = new Set<string>()
  document.querySelectorAll('style').forEach(style => {
    const text = style.textContent ?? ''
    if (!isPresentationOnlyStyle(text)) return
    if (seen.has(text)) return
    seen.add(text)
    targetDoc.head.appendChild(style.cloneNode(true))
  })

  const base = targetDoc.createElement('style')
  base.textContent = PDF_BASE_CSS
  targetDoc.head.appendChild(base)
}

export function createPdfRenderFrame(): {
  document: Document
  body: HTMLElement
  destroy: () => void
} {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.setAttribute('title', 'PDF export')
  iframe.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${PDF_PAGE_W}px`,
    `height:${PDF_PAGE_H}px`,
    'border:0',
    'visibility:hidden',
  ].join(';')
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  if (!doc) {
    iframe.remove()
    throw new Error('Не удалось создать контекст для PDF')
  }

  doc.open()
  doc.write('<!DOCTYPE html><html><head></head><body></body></html>')
  doc.close()

  copyPresentationStylesTo(doc)

  return {
    document: doc,
    body: doc.body,
    destroy: () => iframe.remove(),
  }
}

export async function capturePageToCanvas(
  page: HTMLElement
): Promise<HTMLCanvasElement> {
  return domToCanvas(page, {
    width: PDF_PAGE_W,
    height: PDF_PAGE_H,
    backgroundColor: '#020617',
    scale: 2,
    style: {
      width: `${PDF_PAGE_W}px`,
      height: `${PDF_PAGE_H}px`,
    },
  })
}

export const PDF_CAPTURE_SIZE = { width: PDF_PAGE_W, height: PDF_PAGE_H }
