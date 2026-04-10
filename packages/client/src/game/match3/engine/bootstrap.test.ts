import { createMatch3Game } from './bootstrap'

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
})
