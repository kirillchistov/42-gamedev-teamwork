import React from 'react'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
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

// хедер без onOpenSettings
jest.mock('../components/Header', () => ({
  Header: () => <div data-testid="header" />,
}))

jest.mock('../components/Footer', () => ({
  Footer: () => <div data-testid="footer" />,
}))

jest.mock('../game/match3/Match3Screen', () => ({
  Match3Screen: () => (
    <div data-testid="match3-screen" />
  ),
}))

function renderGamePage(
  initialRoute = '/game/start'
) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route
          path="/game/*"
          element={<GamePage />}
        />
      </Routes>
    </MemoryRouter>
  )
}

// пропускает обратный отсчёт и ждёт кнопку «Играть»
async function skipCountdown() {
  act(() => {
    jest.advanceTimersByTime(1100)
  })
  act(() => {
    jest.advanceTimersByTime(1000)
  })
  act(() => {
    jest.advanceTimersByTime(1000)
  })
  return waitFor(() => screen.getByText('Играть'))
}

describe('Тесты настроек на странице GamePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('Таймер на запуск игры стартовал, затем появилось окно инициализации', async () => {
    const { container } = renderGamePage()

    const element = container.querySelector(
      '.match3__countdown'
    )
    expect(element).toHaveTextContent('3')

    const button = await skipCountdown()
    expect(element).not.toBeInTheDocument()
    expect(button).toBeInTheDocument()
  })

  test('Открытие inline-панели настроек кнопкой «Настройки»', async () => {
    renderGamePage()
    await skipCountdown()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Настройки',
      })
    )
    expect(
      screen.getByRole('heading', {
        name: 'Настройки игры',
      })
    ).toBeInTheDocument()
  })

  test('Закрытие inline-панели кнопкой «Закрыть»', async () => {
    renderGamePage()
    await skipCountdown()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Настройки',
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

  test('Повторный клик на «Настройки» скрывает панель', async () => {
    renderGamePage()
    await skipCountdown()

    // Раскрываем
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Настройки',
      })
    )
    expect(
      screen.getByRole('heading', {
        name: 'Настройки игры',
      })
    ).toBeInTheDocument()

    // Сворачиваем повторным кликом
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Скрыть настройки',
      })
    )
    expect(
      screen.queryByRole('heading', {
        name: 'Настройки игры',
      })
    ).not.toBeInTheDocument()
  })

  test('На старте не отображается рудимент "Меток для бомб: 0"', async () => {
    renderGamePage()
    await skipCountdown()
    expect(
      screen.queryByText(/Меток для бомб:\s*0/i)
    ).not.toBeInTheDocument()
  })

  test('Для победы применяется класс win-экрана', () => {
    window.localStorage.setItem(
      'match3:last-result',
      JSON.stringify({
        reason: 'goalReached',
        snapshot: {
          score: 1400,
          moves: 20,
          currentCombo: 0,
          maxCombo: 3,
          playerRecord: 1400,
          dailyRecord: 2000,
          goalScore: 1200,
          goalProgressPct: 100,
          goalTargetsTotal: 0,
          goalTargetsLeft: 0,
          timeLeftSec: 15,
        },
      })
    )
    const { container } = renderGamePage(
      '/game/finish'
    )
    expect(
      container.querySelector(
        '.match3-finish-screen--win'
      )
    ).toBeInTheDocument()
  })

  test('Для поражения применяется класс lose-экрана', () => {
    window.localStorage.setItem(
      'match3:last-result',
      JSON.stringify({
        reason: 'timeOut',
        snapshot: {
          score: 700,
          moves: 12,
          currentCombo: 0,
          maxCombo: 2,
          playerRecord: 1400,
          dailyRecord: 2000,
          goalScore: 1200,
          goalProgressPct: 58,
          goalTargetsTotal: 0,
          goalTargetsLeft: 0,
          timeLeftSec: 0,
        },
      })
    )
    const { container } = renderGamePage(
      '/game/finish'
    )
    expect(
      container.querySelector(
        '.match3-finish-screen--lose'
      )
    ).toBeInTheDocument()
  })
})
