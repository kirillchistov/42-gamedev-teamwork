# Content-Security-Policy (задача 9.1)

## Что и зачем
CSP (Content Security Policy) — это HTTP-заголовок Content Security Policy (CSP) - HTTP - MDN Web Docs, который определяет, какие ресурсы (скрипты, изображения, стили) браузер может загружать в нашем приложении.
CSP ограничивает, откуда браузер может грузить контент. Это снижает риск XSS: даже если в страницу попадёт чужой скрипт, браузер его не выполнит без разрешения в политике.

## Полезные источники
- [MDN Web Docs](https://developer.mozilla.org/ru/docs/Glossary/CSP)
- [MDN Web Docs - directives](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy#Directives)
- [Xaker Обзор CSP](https://xakep.ru/2013/12/23/61798/)
- [Rechecker CSP Guide](https://rechecker.ru/blog/csp-header-guide)


## Где применяется

| Режим | Как отдаётся CSP |
|-------|------------------|
| 'yarn dev', Docker client (SSR) | HTTP-заголовок 'Content-Security-Policy' из Express |
| GitHub Pages ('VITE_STATIC_DEPLOY=gh-pages') | '<meta http-equiv="Content-Security-Policy">' в собранном 'index.html' |
| Node API ('packages/server') | Отдельный JSON API; CSP для HTML не нужен |

Код политики: 'packages/client/server/cspPolicy.ts', middleware: 'packages/client/server/csp.ts'.

## Разрешённые источники

| Директива | Значения | Зачем |
|-----------|----------|--------|
| 'default-src' | "'self'" | Базовый запасной вариант |
| 'script-src' | "'self'", nonce (SSR), в dev "'unsafe-eval'" | Бандлы Vite; inline только Redux state с nonce; HMR в dev |
| 'style-src' | "'self'", "'unsafe-inline'" | PostCSS, inline-стили React, Vite dev |
| 'img-src' | "'self'", 'data:', 'blob:', 'https:' | Аватары, Canvas, GitHub, CDN |
| 'connect-src' | "'self'", 'https://ya-praktikum.tech', 'https://oauth.yandex.ru', в dev localhost и 'ws:' | API, OAuth, прокси '/api', HMR |
| 'font-src' | "'self'", 'data:' | Локальные шрифты |
| 'frame-src' | 'https://oauth.yandex.ru' | Редирект OAuth (если во frame) |
| 'form-action' | "'self'", 'https://oauth.yandex.ru' | Отправка форм OAuth |
| 'worker-src' | "'self'" | Service Worker |
| 'object-src' | "'none'" | Запрет плагинов |
| 'base-uri' | "'self'" | Базовый URL страницы |

## Inline-скрипт Redux

SSR вставляет:

```html
<script nonce="…">window.APP_INITIAL_STATE = …</script>
```

Nonce генерируется на каждый запрос и совпадает с 'script-src' в заголовке.

## Режим разработки

В 'NODE_ENV=development' добавлены:

- 'script-src': "'unsafe-eval'" (Vite)
- 'connect-src': 'ws:', 'wss:', 'http://localhost:*', 'http://127.0.0.1:*'

## GitHub Pages

Сборка без SSR: нет inline state, только файлы из 'dist/client'. Политика строже: без nonce и без 'unsafe-eval'. API — только 'https://ya-praktikum.tech' (см. 'constants.tsx').

## Проверка

1. 'yarn dev' — открыть приложение, вкладка Network → документ → Response Headers → 'Content-Security-Policy'.
2. Консоль: не должно быть 'Refused to load…' / 'violates CSP' на '/', '/login', '/game'.
3. Сборка Pages: 'VITE_STATIC_DEPLOY=gh-pages yarn build:client', в 'dist/client/index.html' есть meta CSP.

## Что дальше?

Задать эти же настройки в nginx, не ослаблять политику на проде.


## Шпаргалка по подключению CSP из курса Практикум

### CSR (Client Side Rendering)
Но в начале покажем способ для работы со статикой и Webpack. С клиентским рендерингом вы можете устроить CSP с помощью nginx. Если нужно, заводите дополнительный Webpack-плагин. 

### Webpack-плагин

[CSP HTML Webpack Plugin](https://github.com/slackhq/csp-html-webpack-plugin) — поможет подключить к вашей статике CSP-политики через конфиги. 

### Nginx

Пример политик CSP на nginx можете посмотреть [GitHub](https://gist.github.com/ambroisemaupate/bce4b760405558f358ae), а здесь [статья о том, как их подключить](https://habr.com/ru/company/nix/blog/271575/). Обратите также внимание на эту [статья на Хабре с примером политикиъ(https://habr.com/ru/company/nix/blog/271575/).

### SSR (Server Side Rendering)

Пример библиотеки с хорошей сигнатурой (API) — [express-csp-header](https://github.com/frux/express-csp-header). Попробуйте её, а если чувствуете в себе силы, напишите свое решение. Исходники относительно простые.
Один из способов организации дефолтных правил — собрать их в одном файле, а потом перезаписывать для production и testing среды:

```ts
// /../production.ts
const defaultConfig = require('./defaults');
module.exports = {
    csp: {
        policies: {
            ...defaultConfig.csp.policies,
            'img-src': [
                ...defaultConfig.csp.policies['img-src'],
                'avatars.my.app',
                'https://may-app.tst.domain.tv'
            ],
            'connect-src': [...defaultConfig.csp.policies['connect-src'], 'https://sentry.my.app.ru'],
            'frame-src': [...defaultConfig.csp.policies['frame-src'], '*.myapp.ru', '*.myapp.com'],
            'frame-ancestors': [...defaultConfig.csp.policies['frame-ancestors'], '*.myapp.com']
        }
    }
}; 
```