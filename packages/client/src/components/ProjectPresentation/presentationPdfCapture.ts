import { domToCanvas } from 'modern-screenshot'

const PDF_PAGE_W = 1280
const PDF_PAGE_H = 720

const UNSAFE_COLOR_RE = /color\(|oklch\(|lab\(|lch\(/i
const MAX_PDF_STYLESHEET_BYTES = 600_000

/** CSS, нужный для слайдов PDF (inline или бандл Vite). */
function isPresentationOnlyStyle(text: string): boolean {
  if (!text || text.length > MAX_PDF_STYLESHEET_BYTES) return false
  return (
    text.includes('.match3-presentation') ||
    text.includes('.presentation-') ||
    text.includes('.hero-board') ||
    text.includes('.hero-visual') ||
    text.includes('.hero__') ||
    /\.hero(\s|{|\.|#)/.test(text) ||
    text.includes('.team-card__avatar')
  )
}

/** modern-screenshot не рисует oklch/lab — подменяем на hex. */
function sanitizeCssForScreenshot(css: string): string {
  return css.replace(/(?:oklch|lab|lch|color)\([^)]*\)/gi, '#94a3b8')
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

async function appendPresentationStylesheet(
  targetDoc: Document,
  cssText: string,
  seen: Set<string>
): Promise<void> {
  if (!isPresentationOnlyStyle(cssText) || seen.has(cssText)) {
    return
  }
  seen.add(cssText)
  const style = targetDoc.createElement('style')
  style.textContent = sanitizeCssForScreenshot(cssText)
  targetDoc.head.appendChild(style)
}

export async function copyPresentationStylesTo(
  targetDoc: Document
): Promise<void> {
  const seen = new Set<string>()

  document.querySelectorAll('style').forEach(style => {
    const text = style.textContent ?? ''
    if (!isPresentationOnlyStyle(text) || seen.has(text)) {
      return
    }
    seen.add(text)
    const clone = style.cloneNode(true) as HTMLStyleElement
    if (UNSAFE_COLOR_RE.test(clone.textContent ?? '')) {
      clone.textContent = sanitizeCssForScreenshot(clone.textContent ?? '')
    }
    targetDoc.head.appendChild(clone)
  })

  await Promise.all(
    Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(
      async link => {
        const href = (link as HTMLLinkElement).href
        if (!href) return
        try {
          const res = await fetch(href, { credentials: 'same-origin' })
          if (!res.ok) return
          const text = await res.text()
          await appendPresentationStylesheet(targetDoc, text, seen)
        } catch {
          /* сеть / CORS — остаются inline-стили */
        }
      }
    )
  )

  const base = targetDoc.createElement('style')
  base.textContent = PDF_BASE_CSS
  targetDoc.head.appendChild(base)
}

export async function createPdfRenderFrame(): Promise<{
  document: Document
  body: HTMLElement
  destroy: () => void
}> {
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

  await copyPresentationStylesTo(doc)

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
