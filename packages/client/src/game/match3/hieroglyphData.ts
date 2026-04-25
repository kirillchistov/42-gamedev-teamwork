export type HieroglyphExample = {
  zh: string
  ru: string
}

export type HieroglyphEntry = {
  hanzi: string
  pinyin: string
  /** Варианты перевода на русский (основное значение и близкие смыслы). */
  meaningsRu: string[]
  examples: HieroglyphExample[]
}

/**
 * Колода для темы поля «Иероглиф»: индекс типа фишки (kind) мапится по модулю.
 */
export const HIEROGLYPH_DECK: HieroglyphEntry[] =
  [
    {
      hanzi: '人',
      pinyin: 'rén',
      meaningsRu: ['человек', 'люди'],
      examples: [
        { zh: '中国人', ru: 'китаец' },
        { zh: '大人', ru: 'взрослый' },
        { zh: '人口', ru: 'население' },
      ],
    },
    {
      hanzi: '口',
      pinyin: 'kǒu',
      meaningsRu: ['рот', 'устье', 'отверстие'],
      examples: [
        { zh: '口水', ru: 'слюна' },
        { zh: '入口', ru: 'вход' },
        { zh: '口味', ru: 'вкус' },
      ],
    },
    {
      hanzi: '水',
      pinyin: 'shuǐ',
      meaningsRu: ['вода'],
      examples: [
        { zh: '水果', ru: 'фрукты' },
        { zh: '喝水', ru: 'пить воду' },
        {
          zh: '水平',
          ru: 'уровень; горизонталь',
        },
      ],
    },
    {
      hanzi: '火',
      pinyin: 'huǒ',
      meaningsRu: ['огонь', 'пламя'],
      examples: [
        { zh: '火车', ru: 'поезд' },
        { zh: '着火', ru: 'воспламениться' },
        { zh: '火热', ru: 'пылкий, горячий' },
      ],
    },
    {
      hanzi: '山',
      pinyin: 'shān',
      meaningsRu: ['гора', 'холм'],
      examples: [
        { zh: '爬山', ru: 'взбираться на гору' },
        { zh: '高山', ru: 'высокая гора' },
        {
          zh: '山水',
          ru: 'пейзаж (горы и вода)',
        },
      ],
    },
    {
      hanzi: '木',
      pinyin: 'mù',
      meaningsRu: ['дерево', 'древесина'],
      examples: [
        { zh: '木头', ru: 'дерево (материал)' },
        { zh: '木马', ru: 'деревянная лошадь' },
        { zh: '木材', ru: 'лесоматериалы' },
      ],
    },
    {
      hanzi: '日',
      pinyin: 'rì',
      meaningsRu: ['солнце', 'день'],
      examples: [
        { zh: '今日', ru: 'сегодня' },
        { zh: '生日', ru: 'день рождения' },
        { zh: '日常', ru: 'повседневность' },
      ],
    },
    {
      hanzi: '月',
      pinyin: 'yuè',
      meaningsRu: ['луна', 'месяц'],
      examples: [
        { zh: '月亮', ru: 'луна' },
        { zh: '一个月', ru: 'один месяц' },
        { zh: '月光', ru: 'лунный свет' },
      ],
    },
    {
      hanzi: '心',
      pinyin: 'xīn',
      meaningsRu: ['сердце', 'душа', 'ум'],
      examples: [
        { zh: '开心', ru: 'радоваться' },
        { zh: '小心', ru: 'осторожно' },
        { zh: '心情', ru: 'настроение' },
      ],
    },
    {
      hanzi: '手',
      pinyin: 'shǒu',
      meaningsRu: ['рука'],
      examples: [
        { zh: '手机', ru: 'мобильный телефон' },
        { zh: '洗手', ru: 'мыть руки' },
        { zh: '手工', ru: 'ручная работа' },
      ],
    },
    {
      hanzi: '上',
      pinyin: 'shàng',
      meaningsRu: ['верх', 'над', 'подниматься'],
      examples: [
        { zh: '上课', ru: 'ходить на урок' },
        { zh: '网上', ru: 'в интернете' },
        { zh: '上面', ru: 'сверху' },
      ],
    },
    {
      hanzi: '门',
      pinyin: 'mén',
      meaningsRu: ['дверь', 'ворота'],
      examples: [
        { zh: '开门', ru: 'открыть дверь' },
        { zh: '门口', ru: 'у входа' },
        { zh: '门票', ru: 'входной билет' },
      ],
    },
  ]

export function getHieroglyphForKind(
  kind: number
): HieroglyphEntry {
  const deck = HIEROGLYPH_DECK
  const idx =
    deck.length === 0
      ? 0
      : Math.abs(Math.floor(kind)) % deck.length
  return deck[idx] ?? deck[0]
}
