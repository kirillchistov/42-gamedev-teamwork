"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderSsrErrorHtml = renderSsrErrorHtml;
// HTML error handler для Express (вместо text/plain)
function renderSsrErrorHtml() {
    return [
        '<!DOCTYPE html>',
        '<html lang="ru">',
        '<head>',
        '<meta charset="utf-8" />',
        '<meta name="viewport" content="width=device-width, initial-scale=1" />',
        '<title>500 — Cosmic Match</title>',
        '<style>',
        'body{margin:0;min-height:100vh;font-family:Inter,system-ui,sans-serif;',
        'background:#070b14;color:#e8ecf4}',
        '.wrap{display:flex;flex-direction:column;align-items:center;',
        'justify-content:center;min-height:100vh;padding:2rem;text-align:center}',
        'h1{font-size:clamp(2.5rem,8vw,4rem);margin:0}',
        'h2{margin:1rem 0;font-weight:500}',
        'p{max-width:36rem;opacity:.85;line-height:1.5}',
        'a{color:#7eb8ff}',
        '</style>',
        '</head>',
        '<body>',
        '<div class="wrap">',
        '<h1>500 <span aria-hidden="true">🛠️</span></h1>',
        '<h2>Космическая турбулентность</h2>',
        '<p>На борту SSR-сервера что-то перегрелось. Попробуйте обновить страницу или вернуться на главную.</p>',
        '<p><a href="/">На базу</a></p>',
        '</div>',
        '</body>',
        '</html>',
    ].join('');
}
