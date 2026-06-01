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

export type LearningPlanet = {
  label: string
  /** Угол орбиты в градусах относительно звезды */
  angleDeg: number
  /** Расстояние от звезды, % от размера галактики */
  radiusPct: number
}

export const LEARNING_GALAXY = [
  {
    id: 'architecture',
    short: 'Архитектура',
    text: 'Разделение UI и игрового runtime, итеративная доставка без поломки ядра игры.',
    x: 14,
    y: 20,
    planets: [
      { label: 'Декомпозиция', angleDeg: -58, radiusPct: 12 },
      { label: 'Тесты', angleDeg: -12, radiusPct: 14 },
      { label: 'Итерации', angleDeg: 38, radiusPct: 12 },
    ],
  },
  {
    id: 'team',
    short: 'Команда',
    text: 'Командное взаимодействие — распределение зон и общие стандарты в монорепо.',
    x: 82,
    y: 16,
    planets: [
      { label: 'Приоритеты', angleDeg: -42, radiusPct: 11 },
      { label: 'Тайм-менеджмент', angleDeg: 8, radiusPct: 13 },
    ],
  },
  {
    id: 'time',
    short: 'Спринты',
    text: 'Спринты, приоритеты и доведение фич до рабочего демо.',
    x: 10,
    y: 78,
    planets: [
      { label: 'Коммуникация', angleDeg: -35, radiusPct: 12 },
      { label: 'Внутренние ревью', angleDeg: 5, radiusPct: 14 },
      { label: 'Стандарты кодинга', angleDeg: 42, radiusPct: 12 },
    ],
  },
  {
    id: 'self',
    short: 'Рост',
    text: 'Самостоятельное освоение технологий по документации и экспериментам.',
    x: 86,
    y: 74,
    planets: [
      { label: 'Самообучение', angleDeg: -48, radiusPct: 11 },
      { label: 'Документация', angleDeg: -18, radiusPct: 13 },
      { label: 'Освоение разных API', angleDeg: 12, radiusPct: 14 },
      { label: 'Эксперименты', angleDeg: 44, radiusPct: 11 },
    ],
  },
] as const

export const PRESENTATION_BG_URL = publicAssetUrl('icons/bgcosmic2.jpg')

/** 8×8 раскладка «камней» для превью поля (индексы 0–7). */
export const GAME_BOARD_PREVIEW: readonly (number | null)[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7],
  [3, 4, 5, 6, 7, 0, 1, 2],
  [6, 7, 0, 1, 2, 3, 4, 5],
  [1, 2, 3, 4, 5, 6, 7, 0],
  [4, 5, 6, 7, 0, 1, 2, 3],
  [7, 0, 1, 2, 3, 4, 5, 6],
  [2, 3, 4, 5, 6, 7, 0, 1],
  [5, 6, 7, 0, 1, 2, 3, 4],
]

export const GAME_GEM_COLORS = [
  '#38bdf8',
  '#a78bfa',
  '#f472b6',
  '#fbbf24',
  '#34d399',
  '#f87171',
  '#22d3ee',
  '#818cf8',
] as const

export const HTTP_APIS_OVERVIEW_URL = publicAssetUrl(
  'docs/http-apis-overview.svg'
)

export function techIconUrl(file: string): string {
  return publicAssetUrl(`icons/${file}`)
}
