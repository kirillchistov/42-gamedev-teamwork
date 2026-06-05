const TEAM_PROJECT_VIEW_URL =
  'https://github.com/users/kirillchistov/projects/5/views/1'

export function teamBacklogUrl(assigneeLogin: string): string {
  return `${TEAM_PROJECT_VIEW_URL}?filterQuery=assignee%3A${encodeURIComponent(
    assigneeLogin
  )}`
}

export type TeamMember = {
  name: string
  role: string
  githubUrl?: string
  /** Логин для filterQuery assignee в GitHub Projects. */
  backlogAssignee?: string
  backlogUrl?: string
  avatarUrl?: string
  responsibilities: string[]
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Анна',
    role: 'Queen of cosmic beauty',
    githubUrl: 'https://github.com/larannma',
    backlogAssignee: 'larannma',
    backlogUrl: teamBacklogUrl('larannma'),
    avatarUrl: 'https://avatars.githubusercontent.com/u/66175549?v=4',
    responsibilities: ['Forum', 'SW', 'OAuth', 'Themes', 'WebAPI'],
  },
  {
    name: 'Сергей',
    role: 'Commander of eternal wisdom',
    githubUrl: 'https://github.com/zergeugenson',
    backlogAssignee: 'zergeugenson',
    backlogUrl: teamBacklogUrl('zergeugenson'),
    avatarUrl: 'https://avatars.githubusercontent.com/u/33512074?v=4',
    responsibilities: [
      'Validation',
      'Tests',
      'Leaderboard',
      'Hooks',
      'HOC',
      'Auth MW',
      'nginx',
    ],
  },
  {
    name: 'Артур',
    role: 'Master of stellar magic',
    githubUrl: 'https://github.com/Arturaldo',
    backlogAssignee: 'Arturaldo',
    backlogUrl: teamBacklogUrl('Arturaldo'),
    avatarUrl: 'https://avatars.githubusercontent.com/u/97703299?v=4',
    responsibilities: [
      'Gamedev',
      'Auth',
      'States',
      'Router SSR',
      'Themes',
      'Autodeploy',
    ],
  },
  {
    name: 'Антон',
    role: 'Universal treasure keeper',
    githubUrl: 'https://github.com/TelRoY',
    backlogAssignee: 'TelRoY',
    backlogUrl: teamBacklogUrl('TelRoY'),
    avatarUrl: 'https://avatars.githubusercontent.com/u/207622043?v=4',
    responsibilities: ['Profile', 'Redux', 'WebAPI', 'Forum', 'Cloud'],
  },
  {
    name: 'Кирилл',
    role: 'Lunar story teller',
    githubUrl: 'https://github.com/kirillchistov',
    backlogAssignee: 'kirillchistov',
    backlogUrl: teamBacklogUrl('kirillchistov'),
    avatarUrl: 'https://avatars.githubusercontent.com/u/101833862?v=4',
    responsibilities: ['Infra', 'Layout', 'Slides', 'Ports SSR', 'Docs'],
  },
]

/** Иконки стека для орбиты hero */
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
