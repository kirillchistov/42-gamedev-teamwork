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
    x: 24,
    y: 20,
    planets: [
      { label: 'Декомпозиция', angleDeg: -58, radiusPct: 12 },
      { label: 'Тесты', angleDeg: -12, radiusPct: 14 },
      { label: 'Документация', angleDeg: 38, radiusPct: 12 },
    ],
  },
  {
    id: 'team',
    short: 'Команда',
    text: 'Командное взаимодействие — распределение зон и общие стандарты в монорепо.',
    x: 72,
    y: 26,
    planets: [
      { label: 'Коммуникация', angleDeg: -42, radiusPct: 11 },
      { label: 'Внутренние ревью', angleDeg: 8, radiusPct: 13 },
      { label: 'Стандарты кодинга', angleDeg: 56, radiusPct: 15 },
    ],
  },
  {
    id: 'time',
    short: 'Время',
    text: 'Спринты, приоритеты и доведение фич до рабочего демо.',
    x: 20,
    y: 78,
    planets: [
      { label: 'Командные спринты', angleDeg: -35, radiusPct: 12 },
      { label: 'Приоритеты', angleDeg: 5, radiusPct: 14 },
      { label: 'Тайм-менеджмент', angleDeg: 42, radiusPct: 12 },
    ],
  },
  {
    id: 'self',
    short: 'Рост',
    text: 'Самостоятельное освоение технологий по документации и экспериментам.',
    x: 66,
    y: 69,
    planets: [
      { label: 'Самообучение', angleDeg: -48, radiusPct: 11 },
      { label: 'Документация', angleDeg: -18, radiusPct: 13 },
      { label: 'Освоение разных API', angleDeg: 12, radiusPct: 14 },
      { label: 'Эксперименты', angleDeg: 44, radiusPct: 11 },
    ],
  },
] as const

/** Текст панели на финальном слайде, пока звезда не выбрана. */
export const LEARNING_FEEDBACK_DEFAULT = {
  text: 'С нетерпением ждем обратную связь',
  planets: ['Вопросы', 'Идеи', 'Комментарии'] as const,
}

export const PRESENTATION_BG_URL = publicAssetUrl('icons/bgcosmic2.jpg')

export const PRESENTATION_QR_URL = publicAssetUrl('images/qrcode_me.png')

export const PRESENTATION_GAME_QR_URL = publicAssetUrl('images/qrcode_game.png')

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

/** Схемы из `docs/`, порядок: от общего к частному. */
export const ARCHITECTURE_DIAGRAMS = [
  {
    id: 'project-architecture',
    file: 'project-architecture.svg',
    title: 'Архитектура Cosmic Match (9 спринтов)',
    short: 'Архитектура',
    alt: 'Итоговая архитектура проекта после 9 спринтов: браузер, SSR, Canvas, API, форум, Postgres, OAuth, PWA, облако',
  },
  {
    id: 'project-meta',
    file: 'project-meta-flow.svg',
    title: 'Мета-схема проекта',
    short: 'Мета',
    alt: 'Связи auth, оболочки приложения, игрового движка, canvas, API форума и service worker',
  },
  {
    id: 'http-overview',
    file: 'http-apis-overview.svg',
    title: 'Обзор HTTP-слоёв',
    short: 'HTTP',
    alt: 'Браузер, SSR-клиент, apiProxy, Практикум API, forum backend и PostgreSQL',
  },
  {
    id: 'client-api',
    file: 'client-api-sources.svg',
    title: 'Клиент: BASE_URL и SERVER_HOST',
    short: 'Клиент API',
    alt: 'Как клиент выбирает хосты для запросов к API',
  },
  {
    id: 'react-redux',
    file: 'react-redux-flow.svg',
    title: 'React и Redux',
    short: 'Redux',
    alt: 'Поток данных React, Redux Toolkit и SSR',
  },
  {
    id: 'react-canvas',
    file: 'react-canvas-bridge.svg',
    title: 'Мост React ↔ Canvas',
    short: 'Canvas',
    alt: 'Связь React-оболочки и игрового Canvas runtime',
  },
  {
    id: 'game-engine',
    file: 'game-engine-flow.svg',
    title: 'Игровой движок',
    short: 'Движок',
    alt: 'Цикл match-3: ввод, resolve, каскады, HUD',
  },
  {
    id: 'game-states',
    file: 'game-states-flow.svg',
    title: 'Состояния игры',
    short: 'Состояния',
    alt: 'Переходы между экранами и фазами партии',
  },
  {
    id: 'canvas-render',
    file: 'canvas-render-flow.svg',
    title: 'Рендер Canvas',
    short: 'Рендер',
    alt: 'Отрисовка поля, анимации и синхронизация с HUD',
  },
  {
    id: 'auth',
    file: 'auth-flow.svg',
    title: 'Авторизация',
    short: 'Auth',
    alt: 'OAuth, сессия Практикума и защищённые маршруты',
  },
  {
    id: 'forum',
    file: 'forum-flow.svg',
    title: 'Форум',
    short: 'Форум',
    alt: 'UI → forumSlice → API → Postgres',
  },
  {
    id: 'service-worker',
    file: 'service-worker-flow.svg',
    title: 'Service Worker',
    short: 'SW',
    alt: 'Кэш, офлайн и обновление PWA',
  },
  {
    id: 'validation',
    file: 'validation-flow.svg',
    title: 'Валидация форм',
    short: 'Валидация',
    alt: 'Проверка ввода на клиенте и ответы API',
  },
] as const

export const HTTP_APIS_OVERVIEW_URL = architectureDiagramUrl(
  'http-apis-overview.svg'
)

export function architectureDiagramUrl(file: string): string {
  return publicAssetUrl(`docs/${file}`)
}

export function techIconUrl(file: string): string {
  return publicAssetUrl(`icons/${file}`)
}
