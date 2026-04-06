# Match3 Test Task

Идеи тестов для движка и UI-экранов, с учетом стека (`yarn`, `lerna`, `jest`, `ts-jest`).

## Как запускать

### Через yarn (рекомендуется)

```bash
yarn --cwd packages/client test -- --config jest.config.js src/game/match3/engine/core/core.engine.test.ts --runInBand
yarn --cwd packages/client test -- --config jest.config.js src/game/match3/Match3Screen.test.tsx --runInBand
yarn --cwd packages/client test -- --config jest.config.js src/pages/GamePage.test.tsx --runInBand
```

### Через lerna

```bash
yarn lerna exec --scope client -- jest -c jest.config.js src/game/match3/engine/core/core.engine.test.ts --runInBand
yarn lerna exec --scope client -- jest -c jest.config.js src/game/match3/Match3Screen.test.tsx --runInBand
yarn lerna exec --scope client -- jest -c jest.config.js src/pages/GamePage.test.tsx --runInBand
```

---

## 1) `packages/client/src/game/match3/engine/core/core.engine.test.ts`

```ts
import { findMatches } from './match'
import { trySwap } from './swap'
import { clearAndScore } from './scoring'
import {
  findPossibleMoves,
  shuffleBoardUntilPlayable,
} from './possibleMoves'
import { getSpecialType } from './cell'

describe('match3 core engine', () => {
  test('findMatches uses base kind for special cells', () => {
    const board = [
      [0, 100, 200],
      [1, 2, 3],
      [4, 5, 6],
    ]

    const matches = findMatches(board)
    expect(matches).toHaveLength(3)
    expect(matches).toEqual(
      expect.arrayContaining([
        { r: 0, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: 2 },
      ])
    )
  })

  test('trySwap accepts only productive swaps', () => {
    const goodBoard = [
      [0, 1, 2],
      [0, 2, 1],
      [1, 0, 2],
    ]
    const ok = trySwap(goodBoard, 2, 0, 2, 1)
    expect(ok).toBe(true)
    expect(findMatches(goodBoard).length).toBeGreaterThan(0)

    const badBoard = [
      [0, 1, 2],
      [2, 0, 1],
      [1, 2, 0],
    ]
    const bad = trySwap(badBoard, 0, 0, 0, 1)
    expect(bad).toBe(false)
  })

  test('clearAndScore spawns special tile for long match', () => {
    const board = [
      [0, 0, 0, 0, 2],
      [1, 2, 3, 4, 5],
      [5, 4, 3, 2, 1],
      [1, 2, 3, 4, 5],
      [5, 4, 3, 2, 1],
    ]

    const matches = findMatches(board)
    const score = clearAndScore(board, matches)

    expect(score).toBeGreaterThan(40)
    const specials = board.flat().filter(v => getSpecialType(v) !== null)
    expect(specials.length).toBeGreaterThan(0)
  })

  test('dead board is recovered by shuffleBoardUntilPlayable', () => {
    const deadBoard = [
      [0, 1, 2, 3],
      [2, 3, 0, 1],
      [1, 0, 3, 2],
      [3, 2, 1, 0],
    ]

    expect(findPossibleMoves(deadBoard)).toHaveLength(0)

    const shuffled = shuffleBoardUntilPlayable(deadBoard, 200)
    expect(shuffled).toBe(true)
    expect(findMatches(deadBoard)).toHaveLength(0)
    expect(findPossibleMoves(deadBoard).length).toBeGreaterThan(0)
  })
})
```

---

## 2) `packages/client/src/game/match3/engine/bootstrap.test.ts`

```ts
import { createMatch3Game } from './bootstrap'
import type { LevelConfig } from './levels'

jest.mock('./renderer', () => ({
  renderBoard: jest.fn(),
  pickCellAt: jest.fn(() => null),
}))

jest.mock('./core/scoring', () => ({
  clearAndScore: jest.fn(() => 0),
}))

jest.mock('./core/match', () => ({
  findMatches: jest.fn(() => []),
}))

jest.mock('./core/possibleMoves', () => ({
  findPossibleMoves: jest.fn(() => [{ from: { r: 0, c: 0 }, to: { r: 0, c: 1 } }]),
  shuffleBoardUntilPlayable: jest.fn(() => true),
}))

describe('bootstrap end conditions', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  function createCanvasStub(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    Object.defineProperty(canvas, 'getContext', {
      value: () => ({}),
    })
    return canvas
  }

  test('emits goalReached when target score is met', async () => {
    const { clearAndScore } = jest.requireMock('./core/scoring')
    const { findMatches } = jest.requireMock('./core/match')

    findMatches
      .mockReturnValueOnce([{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }])
      .mockReturnValue([])

    clearAndScore.mockReturnValue(9999)

    const onGameEnd = jest.fn()
    const game = createMatch3Game({
      canvas: createCanvasStub(),
      onGameEnd,
    })

    const level: LevelConfig = {
      id: 'test',
      title: 'Test',
      description: 'Test level',
      goalType: 'score',
      goalValue: 100,
      boardSize: 8,
      durationSec: 5 * 60,
      tileKinds: 6,
      theme: 'standard',
    }

    game.setLevel(level)
    game.startPlay()

    await Promise.resolve()
    await Promise.resolve()

    expect(onGameEnd).toHaveBeenCalled()
    expect(onGameEnd.mock.calls[0][0].reason).toBe('goalReached')
  })

  test('emits timeOut when timer reaches zero', async () => {
    const onGameEnd = jest.fn()
    const game = createMatch3Game({
      canvas: createCanvasStub(),
      onGameEnd,
    })

    const level: LevelConfig = {
      id: 'short',
      title: 'Short',
      description: 'Short timer',
      goalType: 'score',
      goalValue: 999999,
      boardSize: 8,
      durationSec: 3 * 60,
      tileKinds: 6,
      theme: 'standard',
    }

    game.setLevel(level)
    game.startPlay()

    await Promise.resolve()
    jest.advanceTimersByTime(level.durationSec * 1000 + 1000)

    expect(onGameEnd).toHaveBeenCalled()
    expect(onGameEnd.mock.calls[0][0].reason).toBe('timeOut')
  })
})
```

---

## 3) `packages/client/src/game/match3/Match3Screen.test.tsx`

```tsx
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Match3Screen } from './Match3Screen'

const mockStartPlay = jest.fn()
const mockResetIdle = jest.fn()
const mockSetLevel = jest.fn()
const mockDestroy = jest.fn()

jest.mock('./engine/bootstrap', () => ({
  createMatch3Game: jest.fn((params: any) => {
    params.onHudChange?.({
      score: 0,
      moves: 0,
      currentCombo: 0,
      maxCombo: 0,
      playerRecord: 0,
      dailyRecord: 0,
      goalScore: 1000,
      goalProgressPct: 0,
      timeLeftSec: 300,
    })
    return {
      startPlay: mockStartPlay,
      resetIdle: mockResetIdle,
      setBoardSize: jest.fn(),
      setDuration: jest.fn(),
      setTheme: jest.fn(),
      setLevel: mockSetLevel,
      setScoreMode: jest.fn(),
      destroy: mockDestroy,
    }
  }),
}))

describe('Match3Screen UI', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('switches countdown -> ready and starts game on click', () => {
    render(<Match3Screen />)

    expect(screen.getByText('5')).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    const playBtn = screen.getByRole('button', { name: 'Играть' })
    fireEvent.click(playBtn)

    expect(mockStartPlay).toHaveBeenCalled()
  })

  test('applies selected level via setLevel', () => {
    render(<Match3Screen />)

    const select = screen.getByLabelText('Уровень:')
    fireEvent.change(select, { target: { value: 'pilot' } })

    expect(mockSetLevel).toHaveBeenCalled()
  })

  test('cleans game instance on unmount', () => {
    const { unmount } = render(<Match3Screen />)
    unmount()
    expect(mockDestroy).toHaveBeenCalled()
  })
})
```

---

## 4) `packages/client/src/pages/GamePage.test.tsx`

```tsx
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { GamePage } from './GamePage'

const mockNavigate = jest.fn()

jest.mock('../hooks/usePage', () => ({
  usePage: jest.fn(),
}))

jest.mock('../contexts/LandingThemeContext', () => ({
  useLandingTheme: () => ({ theme: 'light-flat' }),
}))

jest.mock('../components/Header', () => ({
  Header: () => <div data-testid="header" />,
}))

jest.mock('../components/Footer', () => ({
  Footer: () => <div data-testid="footer" />,
}))

jest.mock('../game/match3/Match3Screen', () => ({
  Match3Screen: () => <div data-testid="match3-screen" />,
}))

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/game',
      state: { notice: 'Добро пожаловать!' },
    }),
  }
})

describe('GamePage UI', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('shows notice toast and clears router state', () => {
    render(<GamePage />)

    expect(screen.getByText('Добро пожаловать!')).toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith('/game', {
      replace: true,
      state: null,
    })
  })

  test('toggles settings block by button', () => {
    render(<GamePage />)
    const btn = screen.getByRole('button', { name: 'Настроить' })

    fireEvent.click(btn)
    expect(screen.getByText('Поле')).toBeInTheDocument()

    fireEvent.click(btn)
    expect(screen.queryByText('Поле')).not.toBeInTheDocument()
  })

  test('hides toast after timeout', () => {
    render(<GamePage />)
    expect(screen.getByText('Добро пожаловать!')).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(2600)
    })

    expect(screen.queryByText('Добро пожаловать!')).not.toBeInTheDocument()
  })
})
```

