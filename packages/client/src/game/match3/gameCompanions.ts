export type GameCompanion = {
  id: string
  title: string
  imageUrl: string
  heroProfile: string
  introNarrative: string
  lineStart: string
  lineWin: string
  lineLose: string
  diaryBeats: string[]
}

export const GAME_COMPANION_STORAGE_KEY =
  'match3:active-companion-id'
export const GAME_WINS_TOTAL_STORAGE_KEY =
  'match3:narrative-wins-total'
export const GAME_LAST_BEAT_INDEX_STORAGE_KEY =
  'match3:narrative-last-beat-index'
export const GAME_BEAT_WIN_INTERVAL = 3

export const GAME_COMPANIONS: GameCompanion[] = [
  {
    id: 'sw-1',
    title: 'Навигатор Астра',
    imageUrl: '/icons/swcharacter1.png',
    heroProfile:
      'Опытный звездный наставник и первопроходец, ведущий экипаж через опасные секторы.',
    introNarrative:
      'После Матч-Бури Астра собирает фрагменты утраченной карты. Каждая победа возвращает маршрут домой.',
    lineStart:
      'Курс задан. Найди первую сильную комбинацию.',
    lineWin:
      'Отличный проход. Фрагмент карты восстановлен.',
    lineLose:
      'Маршрут сбился, но координаты уже у нас.',
    diaryBeats: [
      'Дневник: мы подняли архив маршрутов сектора Орион.',
      'Дневник: карта показывает нестабильный коридор у Туманности Лира.',
      'Дневник: найден маяк старого флота. Маршрут подтвержден.',
    ],
  },
  {
    id: 'sw-2',
    title: 'Навигатор Ион',
    imageUrl: '/icons/swcharacter2.png',
    heroProfile:
      'Тактик полевых маневров: видит каскады заранее и умеет стабилизировать маршрут в критический момент.',
    introNarrative:
      'Ион ведет корабль через пояс астероидов и отмечает безопасные коридоры в журнале экспедиции.',
    lineStart:
      'Держим темп. Низ поля даст хороший каскад.',
    lineWin:
      'Чистая победа. Сектор отмечен в журнале.',
    lineLose:
      'Шторм сильный. Перестроим маршрут и вернемся.',
    diaryBeats: [
      'Дневник: зафиксирован новый безопасный проход через пояс астероидов.',
      'Дневник: энергетический след ведет к заброшенной станции.',
      'Дневник: маршрут стабилен, готовим дальний прыжок.',
    ],
  },
  {
    id: 'sw-3',
    title: 'Навигатор Нова',
    imageUrl: '/icons/swcharacter3.png',
    heroProfile:
      'Специалист по импульсным связкам 4+: превращает рискованные траектории в быстрый прорыв.',
    introNarrative:
      'Нова расшифровывает звездные координаты и открывает короткие пути у красных гигантов.',
    lineStart:
      'Смотри на связки 4+ — они решают исход.',
    lineWin:
      'Звезды на нашей стороне. Полет продолжается.',
    lineLose:
      'Потеряли импульс. Следующий заход будет точнее.',
    diaryBeats: [
      'Дневник: расшифрована часть звездных координат.',
      'Дневник: найден редкий импульсный коридор у красного гиганта.',
      'Дневник: собран фрагмент карты к следующему сектору.',
    ],
  },
  {
    id: 'sw-4',
    title: 'Навигатор Вега',
    imageUrl: '/icons/swcharacter4.png',
    heroProfile:
      'Навигатор ритма и стабильности, который выигрывает за счет точного темпа и контроля поля.',
    introNarrative:
      'Вега ищет аномальные источники энергии и собирает устойчивый путь к ядру сектора.',
    lineStart:
      'Собери ритм. Один точный ход запустит серию.',
    lineWin:
      'Маршрут подтвержден. Отличная работа, пилот.',
    lineLose:
      'Сигнал слабый. Наберем скорость в новом раунде.',
    diaryBeats: [
      'Дневник: открылся узел быстрой навигации в северном квадранте.',
      'Дневник: отмечен аномальный источник энергии рядом с маршрутом.',
      'Дневник: созвездия сложились в устойчивый путь к ядру сектора.',
    ],
  },
  {
    id: 'sw-5',
    title: 'Навигатор Пульсар',
    imageUrl: '/icons/swcharacter5.png',
    heroProfile:
      'Командир ускоренных операций: фокусируется на спецфишках и резких тактических разворотах.',
    introNarrative:
      'Пульсар синхронизирует маршрут через импульсный коридор и прокладывает путь к внешнему кольцу.',
    lineStart:
      'Приоритет — быстрые спецфишки и контроль поля.',
    lineWin:
      'Цель закрыта. Переходим к следующему сектору.',
    lineLose:
      'Сектор сложный. Нужен более агрессивный старт.',
    diaryBeats: [
      'Дневник: маршрут через пульсар синхронизирован.',
      'Дневник: в журнал занесена новая точка пополнения ресурсов.',
      'Дневник: подтвержден короткий путь к внешнему кольцу.',
    ],
  },
  {
    id: 'sw-6',
    title: 'Навигатор Квазар',
    imageUrl: '/icons/swcharacter6.png',
    heroProfile:
      'Лидер дальних миссий, который берет максимум из первых ходов и не теряет темп под давлением.',
    introNarrative:
      'Квазар открыл устойчивый коридор и ведет команду к новому рубежу галактики.',
    lineStart:
      'Начинаем миссию. Выжми максимум из первых ходов.',
    lineWin:
      'Победа принята. Дневник пополнен новыми данными.',
    lineLose:
      'Ничего, корректируем курс и пробуем снова.',
    diaryBeats: [
      'Дневник: квазарный коридор открыт, сигнал устойчив.',
      'Дневник: получены данные о потерянном караване.',
      'Дневник: маршрут расширен до нового рубежа галактики.',
    ],
  },
  {
    id: 'sw-7',
    title: 'Навигатор Орбис',
    imageUrl: '/icons/swcharacter7.png',
    heroProfile:
      'Навигатор высокой смелости: играет от мощных каскадов и умеет быстро возвращать инициативу.',
    introNarrative:
      'Орбис восстанавливает сеть орбитальных шлюзов и готовит сектор к следующей экспедиции.',
    lineStart:
      'Действуй смело. Каскад даст нам преимущество.',
    lineWin:
      'Сильный результат. Координаты закреплены.',
    lineLose:
      'В этот раз не вышло. Перезапуск и новый маршрут.',
    diaryBeats: [
      'Дневник: орбитальный шлюз снова в сети.',
      'Дневник: зафиксирована безопасная траектория к форпосту.',
      'Дневник: карта обновлена, сектор готов к экспедиции.',
    ],
  },
]

export function readActiveCompanionId(): string {
  if (typeof window === 'undefined') {
    return GAME_COMPANIONS[0]?.id ?? 'sw-1'
  }
  try {
    const raw = window.localStorage.getItem(
      GAME_COMPANION_STORAGE_KEY
    )
    const exists = GAME_COMPANIONS.some(
      companion => companion.id === raw
    )
    return exists
      ? (raw as string)
      : GAME_COMPANIONS[0]?.id ?? 'sw-1'
  } catch {
    return GAME_COMPANIONS[0]?.id ?? 'sw-1'
  }
}

export function writeActiveCompanionId(
  id: string
): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      GAME_COMPANION_STORAGE_KEY,
      id
    )
  } catch {
    // noop
  }
}

export function readNarrativeWinsTotal(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(
      GAME_WINS_TOTAL_STORAGE_KEY
    )
    const parsed = Number(raw ?? '0')
    return Number.isFinite(parsed) && parsed > 0
      ? Math.floor(parsed)
      : 0
  } catch {
    return 0
  }
}

export function writeNarrativeWinsTotal(
  wins: number
): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      GAME_WINS_TOTAL_STORAGE_KEY,
      String(Math.max(0, Math.floor(wins)))
    )
  } catch {
    // noop
  }
}

export function readLastShownBeatIndex(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(
      GAME_LAST_BEAT_INDEX_STORAGE_KEY
    )
    const parsed = Number(raw ?? '0')
    return Number.isFinite(parsed) && parsed > 0
      ? Math.floor(parsed)
      : 0
  } catch {
    return 0
  }
}

export function writeLastShownBeatIndex(
  beatIndex: number
): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      GAME_LAST_BEAT_INDEX_STORAGE_KEY,
      String(Math.max(0, Math.floor(beatIndex)))
    )
  } catch {
    // noop
  }
}
