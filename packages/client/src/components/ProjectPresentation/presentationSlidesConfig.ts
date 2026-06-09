export const PRESENTATION_SLIDES = [
  { id: 'title', title: 'Cosmic Match' },
  { id: 'team', title: 'Команда и роли' },
  { id: 'stack', title: 'Технологический стек' },
  { id: 'diagrams', title: 'Блок-схема' },
  { id: 'game', title: 'Игра' },
  { id: 'challenges', title: 'Сложности и решения' },
  { id: 'learning', title: 'Главное из обучения' },
] as const

export type PresentationSlideId = typeof PRESENTATION_SLIDES[number]['id']

export const PRESENTATION_PDF_FILENAME = 'cosmic-match-presentation.pdf'
