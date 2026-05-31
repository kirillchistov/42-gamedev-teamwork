export type TeamMember = {
  name: string
  role: string
  githubUrl?: string
  avatarUrl?: string
  responsibilities: string[]
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Анна',
    role: 'Queen of cosmic beauty',
    githubUrl: 'https://github.com/larannma',
    avatarUrl: 'https://avatars.githubusercontent.com/u/66175549?v=4',
    responsibilities: ['Форум', 'Service Workers', 'OAuth', 'Темы', 'Web API'],
  },
  {
    name: 'Сергей',
    role: 'Commander of eternal wisdom',
    githubUrl: 'https://github.com/zergeugenson',
    avatarUrl: 'https://avatars.githubusercontent.com/u/33512074?v=4',
    responsibilities: [
      'Валидация',
      'Покрытие тестами',
      'Лидерборд',
      'Хуки и HOC',
      'Авторизация на бэке с прокси',
      'Nginx',
    ],
  },
  {
    name: 'Артур',
    role: 'Master of stellar magic',
    githubUrl: 'https://github.com/Arturaldo',
    avatarUrl: 'https://avatars.githubusercontent.com/u/97703299?v=4',
    responsibilities: [
      'Механика игры',
      'Логика авторизации',
      'Состояния игры',
      'Redux + Router + SSR',
      'Темизация',
      'Автодеплой',
    ],
  },
  {
    name: 'Антон',
    role: 'Universal treasure keeper)',
    githubUrl: 'https://github.com/TelRoY',
    avatarUrl: 'https://avatars.githubusercontent.com/u/207622043?v=4',
    responsibilities: [
      'Профиль',
      'Redux',
      'Performance API',
      'Форум',
      'Облако',
    ],
  },
  {
    name: 'Кирилл',
    role: 'Lunar story teller',
    githubUrl: 'https://github.com/kirillchistov',
    avatarUrl: 'https://avatars.githubusercontent.com/u/101833862?v=4',
    responsibilities: [
      'Инфраструктура',
      'Вёрстка',
      'Лендинг',
      'SSR и порты',
      'Документация',
    ],
  },
]

/** Иконки стека для орбиты hero (без Mongo). */
export const HERO_TECH_ICON_FILES = [
  'tech-react.svg',
  'tech-ts.svg',
  'tech-node.svg',
  'tech-redux.svg',
  'tech-jest.svg',
  'tech-html5.svg',
  'tech-github.svg',
  'tech-js.svg',
] as const
