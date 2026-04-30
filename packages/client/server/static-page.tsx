// 7.1.2 Добавил статическую React-страницу через ReactDOMServer.renderToString()
import React from 'react'
import ReactDOMServer from 'react-dom/server'

function StaticPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '3rem auto',
        fontFamily:
          'Inter, system-ui, sans-serif',
        lineHeight: 1.5,
      }}>
      <h1>
        Статичная SSR-страничка появилась в
        галлактике{' '}
      </h1>
      <p>
        Этот путь астронавты проходят с помощью
        серверного рендера. Да поможет вам
        ReactDOMServer.renderToString()!
      </p>
      <p>
        Эта страничка не использует Redux, ибо так
        предписано в звездном Завете.
      </p>
    </main>
  )
}

export function renderStaticPageHtml(): string {
  const body = ReactDOMServer.renderToString(
    <StaticPage />
  )
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<title>SSR static demo</title>',
    '</head>',
    `<body>${body}</body>`,
    '</html>',
  ].join('')
}
