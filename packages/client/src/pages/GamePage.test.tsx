import React from 'react'
import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom'
import { GamePage } from './GamePage'

jest.mock('../hooks/usePage', () => ({
  usePage: jest.fn(),
}))

jest.mock(
  '../contexts/LandingThemeContext',
  () => ({
    useLandingTheme: () => ({
      theme: 'light-flat',
    }),
  })
)

jest.mock('../components/Header', () => ({
  Header: ({
    onOpenSettings,
  }: {
    onOpenSettings?: () => void
  }) => (
    <div>
      <button
        type="button"
        onClick={onOpenSettings}>
        open-settings
      </button>
    </div>
  ),
}))

jest.mock('../components/Footer', () => ({
  Footer: () => <div data-testid="footer" />,
}))

jest.mock('../game/match3/Match3Screen', () => ({
  Match3Screen: () => (
    <div data-testid="match3-screen" />
  ),
}))

function renderGamePage() {
  return render(
    <MemoryRouter
      initialEntries={['/game/start']}>
      <Routes>
        <Route
          path="/game/*"
          element={<GamePage />}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('Тесты настроек на странице GamePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    jest.useFakeTimers()
    jest.clearAllMocks()
    renderGamePage()
  })

  test('Таймер на запуск игры стартовал', () => {
    const { container } = renderGamePage()
    const element = container.querySelector(
      '.match3__countdown'
    )
    expect(element).toHaveTextContent('3')
  })

  test('Открытие модалки с настройками', () => {
    fireEvent.click(
      screen.getByRole('button', {
        name: 'open-settings',
      })
    )
    expect(
      screen.getByRole('heading', {
        name: 'Настройки игры',
      })
    ).toBeInTheDocument()
  })

  test('Закрытие модалки кнопкой Отмена', () => {
    fireEvent.click(
      screen.getByRole('button', {
        name: 'open-settings',
      })
    )
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Отмена',
      })
    )
    expect(
      screen.queryByRole('heading', {
        name: 'Настройки игры',
      })
    ).not.toBeInTheDocument()
  })

  test('Закрытие модалки кнопкой Закрыть', () => {
    // renderGamePage()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'open-settings',
      })
    )
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Закрыть',
      })
    )
    expect(
      screen.queryByRole('heading', {
        name: 'Настройки игры',
      })
    ).not.toBeInTheDocument()
  })

  test('Закрытие модалки кнопкой Escape', () => {
    fireEvent.click(
      screen.getByRole('button', {
        name: 'open-settings',
      })
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(
      screen.queryByRole('heading', {
        name: 'Настройки игры',
      })
    ).not.toBeInTheDocument()
  })
})
