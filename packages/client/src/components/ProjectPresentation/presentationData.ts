import { publicAssetUrl } from '../../utils/publicAssetUrl'

export const CLIENT_STACK = [
  { label: 'TypeScript и React', icon: 'tech-ts.svg' },
  { label: 'PostCSS', icon: null },
  { label: 'Vite / Webpack, Docker', icon: null },
  { label: 'HTML5 Canvas 2D API', icon: 'tech-html5.svg' },
  { label: 'Jest', icon: 'tech-jest.svg' },
] as const

export const SERVER_STACK = [
  { label: 'Node.js', icon: 'tech-node.svg' },
  { label: 'Express (HTTP API)', icon: null },
  { label: 'React SSR', icon: 'tech-react.svg' },
  { label: 'Redux (Toolkit)', icon: 'tech-redux.svg' },
  { label: 'Nginx, Proxy, SSL', icon: null },
  { label: 'ws (WebSocket)', icon: null },
  { label: 'JWT (авторизация)', icon: null },
  { label: 'PostgreSQL', icon: null },
] as const

export const CHALLENGES = [
  {
    id: 'api',
    title: 'Многообразие API',
    text: 'Fullscreen, Performance, Geolocation, OAuth, Service Workers — согласовали CSP, прокси и единые утилиты на клиенте.',
    image: publicAssetUrl('icons/cosmic14.png'),
  },
  {
    id: 'merge',
    title: 'Конфликты слияний',
    text: 'Параллельные ветки по игре, форуму и SSR — договорились о зонах ответственности и регулярных rebase.',
    image: publicAssetUrl('icons/cosmic9.png'),
  },
  {
    id: 'deploy',
    title: 'Деплой в Яндекс Облако',
    text: 'Контейнеры, nginx, переменные окружения и проверка redirect_uri для OAuth на разных портах.',
    image: publicAssetUrl('icons/cosmic16.png'),
  },
  {
    id: 'ssr',
    title: 'SSR и состояние',
    text: 'Сериализация Redux, base path для GitHub Pages, fallback портов клиента (3000 → 5000 → 9000).',
    image: publicAssetUrl('icons/cosmic12.png'),
  },
] as const

export function techIconUrl(file: string): string {
  return publicAssetUrl(`icons/${file}`)
}
