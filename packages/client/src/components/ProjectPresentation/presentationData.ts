import { publicAssetUrl } from '../../utils/publicAssetUrl'

export const CLIENT_STACK = [
  { label: 'TypeScript', icon: 'tech-ts-2.svg' },
  { label: 'React', icon: 'tech-reactjs.svg' },
  { label: 'Vite', icon: 'tech-vitejs.svg' },
  { label: 'HTML5 Canvas 2D API', icon: 'tech-html5-2.svg' },
  { label: 'Prettier', icon: 'tech-prettier-2.svg' },
  { label: 'Jest', icon: 'tech-jest-2.svg' },
] as const

export const SERVER_STACK = [
  { label: 'Node.js', icon: 'tech-nodejs.svg' },
  { label: 'Express (HTTP API)', icon: 'tech-expressjs-light.svg' },
  { label: 'React Router SSR', icon: 'tech-reactrouter.svg' },
  { label: 'Redux (Toolkit)', icon: 'tech-redux-2.svg' },
  { label: 'Lerna', icon: 'tech-lerna-light.svg' },
  { label: 'PostgreSQL', icon: 'tech-postgresql.svg' },
] as const

export const CHALLENGES = [
  {
    id: 'api',
    title: 'Многообразие API',
    text: 'Practicum API / OAuth / SSR / Forum Backend / Web API — согласовали CSP, прокси и единые утилиты на клиенте.',
    image: publicAssetUrl('icons/cosmic14.png'),
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
  {
    id: 'merge',
    title: 'Конфликты слияний',
    text: 'Параллельные ветки по игре, форуму и SSR — договорились о зонах ответственности и регулярных rebase.',
    image: publicAssetUrl('icons/cosmic9.png'),
  },
] as const

export const HTTP_APIS_OVERVIEW_URL = publicAssetUrl(
  'docs/http-apis-overview.svg'
)

export function techIconUrl(file: string): string {
  return publicAssetUrl(`icons/${file}`)
}
