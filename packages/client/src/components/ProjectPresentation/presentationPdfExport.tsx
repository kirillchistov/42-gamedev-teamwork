import { jsPDF } from 'jspdf'
import { createRoot, type Root } from 'react-dom/client'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

import { store } from '../../store'
import { PRESENTATION_BG_URL } from './presentationData'
import {
  capturePageToCanvas,
  createPdfRenderFrame,
  PDF_CAPTURE_SIZE,
} from './presentationPdfCapture'
import { PresentationSlideContent } from './PresentationSlides'
import {
  PRESENTATION_PDF_FILENAME,
  PRESENTATION_SLIDES,
} from './presentationSlidesConfig'

import './ProjectPresentation.pcss'

const { width: PDF_PAGE_W, height: PDF_PAGE_H } = PDF_CAPTURE_SIZE
const PDF_FOOTER_LEFT = 'Cosmic Match by Team 42'

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  return Promise.all(
    images.map(
      img =>
        new Promise<void>(resolve => {
          const finish = () => resolve()
          if (
            !img.getAttribute('crossorigin') &&
            !img.src.startsWith('data:')
          ) {
            img.crossOrigin = 'anonymous'
          }
          if (img.complete && img.naturalWidth > 0) {
            finish()
            return
          }
          img.addEventListener('load', finish, { once: true })
          img.addEventListener('error', finish, { once: true })
        })
    )
  ).then(() => undefined)
}

export async function exportPresentationPdf(
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const total = PRESENTATION_SLIDES.length
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [PDF_PAGE_W, PDF_PAGE_H],
    compress: true,
  })

  const frame = createPdfRenderFrame()

  try {
    for (let i = 0; i < total; i += 1) {
      onProgress?.(i + 1, total)
      const slide = PRESENTATION_SLIDES[i]
      const slideNumber = i + 1
      const page = frame.document.createElement('div')
      page.className =
        i === 0
          ? 'presentation-pdf-page presentation-pdf-page--title'
          : 'presentation-pdf-page presentation-pdf-page--content'
      page.style.setProperty('--pres-bg-url', `url("${PRESENTATION_BG_URL}")`)
      frame.body.appendChild(page)

      const title = frame.document.createElement('h2')
      title.className = 'presentation-pdf-page__title'
      title.textContent = slide.title
      page.appendChild(title)

      const shell = frame.document.createElement('div')
      shell.className = 'presentation-pdf-page__shell'
      page.appendChild(shell)

      const body = frame.document.createElement('div')
      body.className = 'presentation-pdf-page__body'
      shell.appendChild(body)

      const footer = frame.document.createElement('footer')
      footer.className = 'presentation-pdf-page__footer'
      const footerLeft = frame.document.createElement('span')
      footerLeft.className = 'presentation-pdf-page__footer-left'
      footerLeft.textContent = PDF_FOOTER_LEFT
      const footerRight = frame.document.createElement('span')
      footerRight.className = 'presentation-pdf-page__footer-right'
      footerRight.textContent = `${slideNumber} / ${total}`
      footer.append(footerLeft, footerRight)
      shell.appendChild(footer)

      const root: Root = createRoot(body)
      root.render(
        <Provider store={store}>
          <MemoryRouter>
            <PresentationSlideContent slideId={slide.id} pdfMode />
          </MemoryRouter>
        </Provider>
      )

      await waitForImages(page)
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })

      const canvas = await capturePageToCanvas(page)
      const img = canvas.toDataURL('image/jpeg', 0.92)
      if (i > 0) pdf.addPage([PDF_PAGE_W, PDF_PAGE_H], 'landscape')
      pdf.addImage(img, 'JPEG', 0, 0, PDF_PAGE_W, PDF_PAGE_H)

      root.unmount()
      frame.body.removeChild(page)
    }

    pdf.save(PRESENTATION_PDF_FILENAME)
  } finally {
    frame.destroy()
  }
}
