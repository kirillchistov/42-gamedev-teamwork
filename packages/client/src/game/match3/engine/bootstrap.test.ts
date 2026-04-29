import { createMatch3Game } from './bootstrap'
import { renderBoard } from './renderer'

jest.mock('./renderer', () => ({
  renderBoard: jest.fn(),
  pickCellAt: jest.fn(() => null),
  preloadIconTheme: jest.fn(() =>
    Promise.resolve()
  ),
}))

function createCanvasStub(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  Object.defineProperty(canvas, 'getContext', {
    value: () => ({}),
  })
  return canvas
}

describe('Тесты bootstrap', () => {
  test('Проверка доступности canvas', () => {
    const canvas =
      document.createElement('canvas')
    Object.defineProperty(canvas, 'getContext', {
      value: () => null,
    })

    expect(() =>
      createMatch3Game({ canvas })
    ).toThrow('Canvas 2D context unavailable')
  })

  test('Проверка наличия методов API игры', () => {
    const game = createMatch3Game({
      canvas: createCanvasStub(),
    })

    expect(game).toMatchObject({
      resetIdle: expect.any(Function),
      startPlay: expect.any(Function),
      setBoardSize: expect.any(Function),
      setDuration: expect.any(Function),
      setTheme: expect.any(Function),
      setIconTheme: expect.any(Function),
      setSoundEnabled: expect.any(Function),
      setVfxQuality: expect.any(Function),
      setInputBlocked: expect.any(Function),
      setLevel: expect.any(Function),
      setScoreMode: expect.any(Function),
      setHintIdleMs: expect.any(Function),
      destroy: expect.any(Function),
    })
  })
  test('Проверка вызова onHudChange и destroy', () => {
    const onHudChange = jest.fn()
    const game = createMatch3Game({
      canvas: createCanvasStub(),
      onHudChange,
    })
    expect(onHudChange).toHaveBeenCalled()
    game.setDuration(180)
    expect(onHudChange).toHaveBeenCalled()
    expect(() => game.destroy()).not.toThrow()
  })

  test('позиции блокеров не меняются от обычного redraw', () => {
    const renderBoardMock =
      renderBoard as jest.Mock
    renderBoardMock.mockClear()
    const game = createMatch3Game({
      canvas: createCanvasStub(),
    })

    game.setLevel({
      id: 'stable-blockers',
      title: 'Stable blockers',
      description: 'test level',
      boardSize: 8,
      durationSec: 120,
      goalValue: 1500,
      goalType: 'score',
      targetCells: 6,
      theme: 'standard',
      tileKinds: 5,
      iceMultiplier: 1,
      quests: [],
    })
    const callsAfterLevel =
      renderBoardMock.mock.calls.slice()
    const startCall = callsAfterLevel.find(
      call =>
        Array.isArray(call?.[2]?.goalGrid) &&
        call[2].goalGrid.length > 0
    )
    expect(startCall).toBeDefined()

    const readMask = (
      grid: number[][]
    ): Array<string> => {
      const out: string[] = []
      for (let r = 0; r < grid.length; r += 1) {
        for (
          let c = 0;
          c < (grid[r]?.length ?? 0);
          c += 1
        ) {
          if ((grid[r]?.[c] ?? 0) > 0)
            out.push(`${r},${c}`)
        }
      }
      return out
    }

    const startMask = readMask(
      startCall?.[2].goalGrid
    )
    expect(startMask.length).toBe(6)

    game.setTheme('space')
    const callsAfterTheme =
      renderBoardMock.mock.calls.slice()
    const themeCall = callsAfterTheme
      .reverse()
      .find(call =>
        Array.isArray(call?.[2]?.goalGrid)
      )
    expect(themeCall).toBeDefined()
    const afterThemeMask = readMask(
      themeCall?.[2].goalGrid
    )

    expect(afterThemeMask).toEqual(startMask)
    game.destroy()
  })
})
