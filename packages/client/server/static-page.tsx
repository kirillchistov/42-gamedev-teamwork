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
      <h1>SSR static page is working</h1>
      <p>
        This route is rendered on the server with
        ReactDOMServer.renderToString().
      </p>
      <p>
        It is intentionally independent from Redux
        and app router to satisfy the formal task
        requirement.
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
