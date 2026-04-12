import {
  createInitialHud,
  scoreMultiplier,
  syncGoalProgress,
  tileKindsForBoardSize,
} from './gameState'

describe('Тесты элементов движка', () => {
  test('Проверка начисление очков за открытые клетки', () => {
    expect(scoreMultiplier('x1')).toBe(1)
    expect(scoreMultiplier('x2')).toBe(2)
    expect(scoreMultiplier('x3')).toBe(3)
  })

  test('Проверка числа уникальных фишек', () => {
    expect(
      tileKindsForBoardSize(8)
    ).toBeGreaterThan(1)
  })

  test('Прогресс в интервале от 0 до 100', () => {
    const hud = createInitialHud()
    hud.goalScore = 1000
    hud.goalTargetsTotal = 10
    hud.goalTargetsLeft = 5
    hud.score = 700
    syncGoalProgress(hud)
    expect(hud.goalProgressPct).toBe(50)
    hud.score = 999999
    hud.goalTargetsLeft = 0
    syncGoalProgress(hud)
    expect(hud.goalProgressPct).toBe(100)
  })
})
